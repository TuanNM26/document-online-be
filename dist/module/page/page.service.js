"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const XLSX = __importStar(require("xlsx"));
const page_schema_1 = require("./page.schema");
const document_schema_1 = require("../document/document.schema");
const uuid_1 = require("uuid");
const supabase_1 = require("../../common/storage/supabase");
const document_gateway_1 = require("../document/document.gateway");
const message_1 = require("../../common/constant/message");
const allowedFileType_1 = require("../../common/constant/allowedFileType");
const responsePage_dto_1 = require("./dto/responsePage.dto");
const class_transformer_1 = require("class-transformer");
const pagination_interface_1 = require("../../common/interface/pagination.interface");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const DOCOLINE = "doconline";
let PageService = class PageService {
    pageModel;
    documentModel;
    documentGateway;
    constructor(pageModel, documentModel, documentGateway) {
        this.pageModel = pageModel;
        this.documentModel = documentModel;
        this.documentGateway = documentGateway;
    }
    async createPage(dto, file) {
        const document = await this.documentModel.findById(dto.documentId);
        if (!document) {
            throw new common_1.BadRequestException(message_1.MESSAGES.DOCUMENT_NOT_FOUND);
        }
        this.validateFileType(document.fileType, file);
        const fileExt = file.originalname.split('.').pop() || 'pdf';
        const pdfData = await (0, pdf_parse_1.default)(file.buffer);
        const totalNewPages = pdfData.numpages;
        if (!totalNewPages || totalNewPages <= 0) {
            throw new common_1.BadRequestException('Không thể đọc được số trang PDF.');
        }
        let nextPageNumber = 1;
        const lastPage = await this.pageModel
            .findOne({ documentId: new mongoose_2.Types.ObjectId(dto.documentId) })
            .sort({ pageNumber: -1 })
            .exec();
        if (lastPage) {
            nextPageNumber = lastPage.pageNumber + 1;
        }
        console.log(lastPage);
        console.log(nextPageNumber);
        const fileName = `pages/${dto.documentId}-${(0, uuid_1.v4)()}.${fileExt}`;
        const { error } = await supabase_1.supabase.storage
            .from(DOCOLINE)
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false,
        });
        if (error) {
            throw new common_1.BadRequestException(`Upload failed: ${error.message}`);
        }
        const { data: urlData } = supabase_1.supabase.storage
            .from(DOCOLINE)
            .getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;
        const createdPageDocs = [];
        console.log(dto.documentId);
        for (let i = 0; i < totalNewPages; i++) {
            const page = new this.pageModel({
                documentId: new mongoose_2.Types.ObjectId(dto.documentId),
                pageNumber: nextPageNumber + i,
                filePath: publicUrl,
                fileType: fileExt,
                pdfPageIndex: i + 1,
            });
            await page.save();
            createdPageDocs.push(page);
        }
        await this.documentModel.findByIdAndUpdate(dto.documentId, {
            $inc: { totalPages: totalNewPages },
        });
        const populatedPages = await this.pageModel
            .find({ _id: { $in: createdPageDocs.map(p => p._id) } })
            .populate('documentId', 'title field filePath fileType totalPages')
            .exec();
        await this.documentGateway.notifyPageChange(dto.documentId.toString(), 'added');
        return populatedPages.map(page => (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, page.toObject(), {
            excludeExtraneousValues: true,
        }));
    }
    async analyzeFile(file) {
        const mimetype = file.mimetype;
        if (mimetype === 'application/pdf') {
            const data = await (0, pdf_parse_1.default)(file.buffer);
            return data.numpages;
        }
        else if (mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimetype === 'application/vnd.ms-excel') {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            return workbook.SheetNames.length;
        }
        else if (mimetype === 'text/plain') {
            const text = file.buffer.toString('utf-8').trim();
            if (!text)
                return 1;
            const charCount = text.length;
            const charsPerPage = 10000;
            return Math.ceil(charCount / charsPerPage);
        }
        else {
            throw new common_1.BadRequestException('Unsupported file type');
        }
    }
    validateFileType(documentFileType, file) {
        const allowedTypes = allowedFileType_1.ALLOWED_TYPES_MAP[documentFileType];
        if (!allowedTypes) {
            throw new common_1.BadRequestException(`Unsupported document file type: ${documentFileType}`);
        }
        const fileExt = file.originalname.split('.').pop()?.toLowerCase() || '';
        const mimetype = file.mimetype.toLowerCase();
        const isValidType = allowedTypes.includes(fileExt) || allowedTypes.includes(mimetype);
        if (!isValidType) {
            throw new common_1.BadRequestException(`File type mismatch. Only ${documentFileType} files are allowed.`);
        }
    }
    async findAll(page = 1, limit = 10, q) {
        const filter = q ? { documentId: new mongoose_2.Types.ObjectId(q) } : {};
        const result = await (0, pagination_interface_1.paginate)(this.pageModel, page, limit, filter, { pageNumber: 1 }, [{ path: 'documentId', select: 'title field' }]);
        return {
            ...result,
            data: (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, result.data, {
                excludeExtraneousValues: true,
            }),
        };
    }
    async findOne(id) {
        const page = await this.pageModel
            .findById(id)
            .populate({ path: 'documentId', select: 'title field' });
        if (!page)
            throw new common_1.NotFoundException(message_1.MESSAGES.PAGE_NOT_FOUND);
        return (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, page.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async update(id, file) {
        const oldPage = await this.pageModel.findById(id);
        if (!oldPage) {
            throw new common_1.NotFoundException(message_1.MESSAGES.PAGE_NOT_FOUND);
        }
        if (file) {
            const document = await this.documentModel.findById(oldPage.documentId);
            if (!document) {
                throw new common_1.BadRequestException(message_1.MESSAGES.DOCUMENT_NOT_FOUND);
            }
            this.validateFileType(document.fileType, file);
            const fileExt = file.originalname.split('.').pop() || 'pdf';
            const pdfData = await (0, pdf_parse_1.default)(file.buffer);
            const totalNewPages = pdfData.numpages;
            if (!totalNewPages || totalNewPages <= 0) {
                throw new common_1.BadRequestException('Cannot read number of pages from the new PDF file.');
            }
            const oldPageNumber = oldPage.pageNumber;
            const pageNumberDifference = totalNewPages - 1;
            if (pageNumberDifference !== 0) {
                await this.pageModel.updateMany({
                    documentId: oldPage.documentId,
                    pageNumber: { $gt: oldPageNumber },
                }, { $inc: { pageNumber: pageNumberDifference } });
            }
            const oldFileName = oldPage.filePath.split('/').pop();
            if (oldFileName) {
                const { error: deleteError } = await supabase_1.supabase.storage
                    .from(DOCOLINE)
                    .remove([`pages/${oldFileName}`]);
                if (deleteError) {
                    console.warn(`Failed to delete old file ${oldFileName}: ${deleteError.message}`);
                }
            }
            await this.pageModel.deleteOne({ _id: oldPage._id });
            const newFileName = `pages/${oldPage.documentId}-${(0, uuid_1.v4)()}.${fileExt}`;
            const { error: uploadError } = await supabase_1.supabase.storage
                .from(DOCOLINE)
                .upload(newFileName, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false,
            });
            if (uploadError) {
                throw new common_1.BadRequestException(`Upload new file failed: ${uploadError.message}`);
            }
            const { data: urlData } = supabase_1.supabase.storage
                .from(DOCOLINE)
                .getPublicUrl(newFileName);
            const newPublicUrl = urlData.publicUrl;
            const createdPageDocs = [];
            for (let i = 0; i < totalNewPages; i++) {
                const newPage = new this.pageModel({
                    documentId: new mongoose_2.Types.ObjectId(oldPage.documentId),
                    pageNumber: oldPageNumber + i,
                    filePath: newPublicUrl,
                    fileType: fileExt,
                    pdfPageIndex: i + 1,
                });
                await newPage.save();
                createdPageDocs.push(newPage);
            }
            await this.documentModel.findByIdAndUpdate(oldPage.documentId, {
                $inc: { totalPages: pageNumberDifference },
            });
            await this.documentGateway.notifyPageChange(oldPage.documentId.toString(), 'updated');
            const populatedPages = await this.pageModel
                .find({ _id: { $in: createdPageDocs.map(p => p._id) } })
                .populate('documentId', 'title field filePath fileType totalPages')
                .exec();
            return populatedPages.map(page => (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, page.toObject(), {
                excludeExtraneousValues: true,
            }));
        }
        else {
            const savedPage = await oldPage.save();
            await this.documentGateway.notifyPageChange(oldPage.documentId.toString(), 'updated');
            const populatedPage = await this.pageModel
                .findById(savedPage._id)
                .populate('documentId', 'title field filePath fileType totalPages')
                .exec();
            if (!populatedPage) {
                throw new common_1.NotFoundException("not found");
            }
            return (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, populatedPage.toObject(), {
                excludeExtraneousValues: true,
            });
        }
    }
    async remove(id) {
        const page = await this.pageModel.findById(id);
        if (!page) {
            throw new common_1.NotFoundException(message_1.MESSAGES.PAGE_NOT_FOUND);
        }
        const documentId = page.documentId;
        const deletedPageNumber = page.pageNumber;
        await this.pageModel.findByIdAndDelete(id);
        await this.documentModel.findByIdAndUpdate(documentId, {
            $inc: { totalPages: -1 },
        });
        await this.pageModel.updateMany({
            documentId: documentId,
            pageNumber: { $gt: deletedPageNumber },
        }, { $inc: { pageNumber: -1 } });
        await this.documentGateway.notifyPageChange(documentId.toString(), 'deleted');
        return { message: 'Page deleted and page numbers updated' };
    }
    async findByDocumentId(documentId) {
        const result = await this.pageModel
            .find({ documentId: new mongoose_2.Types.ObjectId(documentId) })
            .populate({ path: 'documentId', select: 'title field' })
            .sort({ pageNumber: 1 })
            .exec();
        return (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, result, {
            excludeExtraneousValues: true,
        });
    }
};
exports.PageService = PageService;
exports.PageService = PageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(page_schema_1.Page.name)),
    __param(1, (0, mongoose_1.InjectModel)(document_schema_1.Document.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        document_gateway_1.DocumentGateway])
], PageService);
//# sourceMappingURL=page.service.js.map