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
const pdf_lib_1 = require("pdf-lib");
const DOCOLINE = 'doconline';
let PageService = class PageService {
    pageModel;
    documentModel;
    documentGateway;
    constructor(pageModel, documentModel, documentGateway) {
        this.pageModel = pageModel;
        this.documentModel = documentModel;
        this.documentGateway = documentGateway;
    }
    async addPagesToDocument(documentId, file) {
        const document = await this.documentModel.findById(documentId);
        if (!document) {
            throw new common_1.NotFoundException(message_1.MESSAGES.DOCUMENT_NOT_FOUND);
        }
        const fileExt = file.originalname.split('.').pop()?.toLowerCase();
        const existingPages = await this.pageModel
            .find({ documentId: new mongoose_2.Types.ObjectId(documentId) })
            .sort({ pageNumber: 1 });
        if (document.fileType !== fileExt) {
            throw new common_1.BadRequestException(`Tài liệu chỉ hỗ trợ thêm trang với định dạng '${document.fileType}'.`);
        }
        const currentPageCount = existingPages.length;
        let newPages = [];
        if (fileExt === 'pdf') {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(file.buffer);
            const numNewPages = pdfDoc.getPages().length;
            for (let i = 0; i < numNewPages; i++) {
                const newPageDoc = await pdf_lib_1.PDFDocument.create();
                const [copiedPage] = await newPageDoc.copyPages(pdfDoc, [i]);
                newPageDoc.addPage(copiedPage);
                const newPageBytes = await newPageDoc.save();
                const pageFileName = `documents/${document._id}/pages/page_${currentPageCount + i + 1}.pdf`;
                const { error } = await supabase_1.supabase.storage
                    .from('doconline')
                    .upload(pageFileName, Buffer.from(newPageBytes), {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: false,
                });
                if (error) {
                    throw new common_1.BadRequestException(`Upload trang mới thất bại: ${error.message}`);
                }
                const { data: urlData } = supabase_1.supabase.storage
                    .from('doconline')
                    .getPublicUrl(pageFileName);
                newPages.push({
                    documentId: document._id,
                    pageNumber: currentPageCount + i + 1,
                    filePath: urlData.publicUrl,
                    fileType: 'pdf',
                });
            }
        }
        else if (fileExt === 'txt') {
            const pageSize = 10000;
            const content = file.buffer.toString('utf-8');
            const totalPages = Math.ceil(content.length / pageSize);
            for (let i = 0; i < totalPages; i++) {
                const pageText = content.slice(i * pageSize, (i + 1) * pageSize);
                const uniqueId = (0, uuid_1.v4)();
                const pageFileName = `documents/${document._id}/pages/page_${currentPageCount + i + 1}_${uniqueId}.txt`;
                const { error } = await supabase_1.supabase.storage
                    .from('doconline')
                    .upload(pageFileName, Buffer.from(pageText, 'utf-8'), {
                    contentType: 'text/plain',
                    cacheControl: '3600',
                    upsert: false,
                });
                if (error) {
                    throw new common_1.BadRequestException(`Upload trang TXT thất bại: ${error.message}`);
                }
                const { data: urlData } = supabase_1.supabase.storage
                    .from('doconline')
                    .getPublicUrl(pageFileName);
                newPages.push({
                    documentId: document._id,
                    pageNumber: currentPageCount + i + 1,
                    filePath: urlData.publicUrl,
                    fileType: 'txt',
                });
            }
        }
        else if (fileExt === 'xlsx') {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetNames = workbook.SheetNames;
            for (let i = 0; i < sheetNames.length; i++) {
                const sheetName = sheetNames[i];
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                const uniqueId = (0, uuid_1.v4)();
                const pageFileName = `documents/${document._id}/pages/page_${currentPageCount + i + 1}_${uniqueId}.txt`;
                const { error } = await supabase_1.supabase.storage
                    .from('doconline')
                    .upload(pageFileName, Buffer.from(csv, 'utf-8'), {
                    contentType: 'text/csv',
                    cacheControl: '3600',
                    upsert: false,
                });
                if (error) {
                    throw new common_1.BadRequestException(`Upload trang XLSX thất bại: ${error.message}`);
                }
                const { data: urlData } = supabase_1.supabase.storage
                    .from('doconline')
                    .getPublicUrl(pageFileName);
                newPages.push({
                    documentId: document._id,
                    pageNumber: currentPageCount + i + 1,
                    filePath: urlData.publicUrl,
                    fileType: 'xlsx',
                });
            }
        }
        else {
            throw new common_1.BadRequestException('Chỉ hỗ trợ thêm trang từ file .pdf, .txt, .xlsx');
        }
        const insertedPages = await this.pageModel.insertMany(newPages);
        document.totalPages = currentPageCount + newPages.length;
        await document.save();
        this.documentGateway.notifyPageChange(documentId.toString(), 'added');
        return (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, insertedPages.map((p) => p.toObject()), { excludeExtraneousValues: true });
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
    async updatePageFile(id, file) {
        const page = await this.pageModel.findById(id);
        if (!page) {
            throw new common_1.NotFoundException('Trang không tồn tại');
        }
        const fileExt = file.originalname.split('.').pop()?.toLowerCase();
        const allowedTypes = {
            pdf: ['pdf'],
            txt: ['txt'],
            xlsx: ['xlsx', 'xls'],
        };
        const currentType = page.fileType?.toLowerCase();
        const isAllowed = allowedTypes[currentType]?.includes(fileExt || '');
        if (!isAllowed) {
            throw new common_1.BadRequestException(`Không thể cập nhật file .${fileExt}. Trang này chỉ chấp nhận cập nhật file ${allowedTypes[currentType]?.join(', ')}`);
        }
        if (page.filePath) {
            const oldFileName = page.filePath.split('/').slice(-1)[0];
            await supabase_1.supabase.storage
                .from('doconline')
                .remove([`documents/${page.documentId}/pages/${oldFileName}`]);
        }
        await this.pageModel.findByIdAndDelete(page._id);
        const newPages = [];
        if (fileExt === 'pdf') {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(file.buffer);
            const newPdfPages = pdfDoc.getPages();
            const numNewPages = newPdfPages.length;
            const shiftAmount = numNewPages - 1;
            const nextPages = await this.pageModel
                .find({
                documentId: page.documentId,
                pageNumber: { $gt: page.pageNumber },
            })
                .sort({ pageNumber: 1 });
            for (const nextPage of nextPages) {
                nextPage.pageNumber += shiftAmount;
                await nextPage.save();
            }
            for (let i = 0; i < numNewPages; i++) {
                const newPageDoc = await pdf_lib_1.PDFDocument.create();
                const [copiedPage] = await newPageDoc.copyPages(pdfDoc, [i]);
                newPageDoc.addPage(copiedPage);
                const newPageBytes = await newPageDoc.save();
                const pageFileName = `documents/${page.documentId}/pages/page_${page.pageNumber + i}-${(0, uuid_1.v4)()}.pdf`;
                const { error } = await supabase_1.supabase.storage
                    .from('doconline')
                    .upload(pageFileName, Buffer.from(newPageBytes), {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                });
                if (error)
                    throw new common_1.BadRequestException(`Tải file thất bại: ${error.message}`);
                const { data: urlData } = supabase_1.supabase.storage
                    .from('doconline')
                    .getPublicUrl(pageFileName);
                newPages.push({
                    documentId: page.documentId,
                    pageNumber: page.pageNumber + i,
                    filePath: urlData.publicUrl,
                    fileType: 'pdf',
                });
            }
            const document = await this.documentModel.findById(page.documentId);
            if (document) {
                document.totalPages += shiftAmount;
                await document.save();
            }
        }
        else {
            const pageFileName = `documents/${page.documentId}/pages/page_${page.pageNumber}-${(0, uuid_1.v4)()}.${fileExt}`;
            const { error } = await supabase_1.supabase.storage
                .from('doconline')
                .upload(pageFileName, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
            });
            if (error)
                throw new common_1.BadRequestException(`Tải file thất bại: ${error.message}`);
            const { data: urlData } = supabase_1.supabase.storage
                .from('doconline')
                .getPublicUrl(pageFileName);
            newPages.push({
                documentId: page.documentId,
                pageNumber: page.pageNumber,
                filePath: urlData.publicUrl,
                fileType: fileExt,
            });
        }
        const inserted = await this.pageModel.insertMany(newPages);
        this.documentGateway.notifyPageChange(page.documentId.toString(), 'updated');
        return (0, class_transformer_1.plainToInstance)(responsePage_dto_1.ResponsePageDto, inserted.map((p) => p.toObject()), {
            excludeExtraneousValues: true,
        });
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
        if (!mongoose_2.Types.ObjectId.isValid(documentId)) {
            throw new common_1.BadRequestException('documentId không hợp lệ');
        }
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