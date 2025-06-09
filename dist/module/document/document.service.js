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
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const document_schema_1 = require("./document.schema");
const mongoose_2 = require("mongoose");
const XLSX = __importStar(require("xlsx"));
const supabase_1 = require("../../common/storage/supabase");
const uuid_1 = require("uuid");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const page_schema_1 = require("../page/page.schema");
const document_gateway_1 = require("./document.gateway");
const message_1 = require("../../common/constant/message");
const responseDocument_dto_1 = require("./dto/responseDocument.dto");
const class_transformer_1 = require("class-transformer");
const pagination_interface_1 = require("../../common/interface/pagination.interface");
let DocumentService = class DocumentService {
    documentModel;
    pageModel;
    documentGateway;
    constructor(documentModel, pageModel, documentGateway) {
        this.documentModel = documentModel;
        this.pageModel = pageModel;
        this.documentGateway = documentGateway;
    }
    async create(data) {
        const { file, ...docInfo } = data;
        const fileExt = file.originalname.split('.').pop()?.toLowerCase();
        if (!fileExt) {
            throw new common_1.BadRequestException('File extension is missing');
        }
        const fileName = `documents/${(0, uuid_1.v4)()}.${fileExt}`;
        const { data: uploaded, error } = await supabase_1.supabase.storage
            .from('doconline')
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false,
        });
        if (error) {
            throw new common_1.BadRequestException(`Upload failed: ${error.message}`);
        }
        const { data: urlData } = supabase_1.supabase.storage
            .from('doconline')
            .getPublicUrl(fileName);
        const filePath = urlData.publicUrl;
        const totalPages = await this.analyzeFile(file);
        const newDoc = new this.documentModel({
            ...docInfo,
            filePath,
            fileType: fileExt,
            totalPages,
        });
        const pages = Array.from({ length: totalPages }, (_, i) => ({
            documentId: newDoc._id,
            pageNumber: i + 1,
            filePath: filePath,
            fileType: fileExt,
        }));
        await this.pageModel.insertMany(pages);
        const savedDoc = await newDoc.save();
        await savedDoc.populate('userId', 'username');
        return (0, class_transformer_1.plainToInstance)(responseDocument_dto_1.ResponseDocumentDto, savedDoc.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async findAll(page = 1, limit = 10, searchQuery) {
        const filter = searchQuery
            ? {
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { field: { $regex: searchQuery, $options: 'i' } },
                    { author: { $regex: searchQuery, $options: 'i' } },
                ],
            }
            : {};
        const populate = {
            path: 'userId',
            select: 'username',
        };
        const result = await (0, pagination_interface_1.paginate)(this.documentModel, page, limit, filter, { createdAt: -1 }, populate);
        return {
            ...result,
            data: (0, class_transformer_1.plainToInstance)(responseDocument_dto_1.ResponseDocumentDto, result.data, {
                excludeExtraneousValues: true,
            }),
        };
    }
    async findById(id) {
        const doc = await this.documentModel.findById(id).populate('userId', 'username');
        if (!doc) {
            throw new common_1.NotFoundException(`Document with id ${id} not found`);
        }
        return (0, class_transformer_1.plainToInstance)(responseDocument_dto_1.ResponseDocumentDto, doc.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async update(id, dto, file) {
        const document = await this.documentModel.findById(id);
        if (!document) {
            throw new common_1.NotFoundException(message_1.MESSAGES.DOCUMENT_NOT_FOUND);
        }
        if (file) {
            const fileExt = file.originalname.split('.').pop()?.toLowerCase();
            const allowedTypes = ['pdf', 'txt', 'xlsx'];
            if (!fileExt || !allowedTypes.includes(fileExt)) {
                throw new common_1.BadRequestException(`Only .pdf, .txt, .xlsx files are allowed.`);
            }
            const pages = await this.pageModel.find({ documentId: document._id });
            for (const page of pages) {
                if (page.filePath) {
                    const pageFileName = page.filePath.split('/').pop();
                    if (pageFileName) {
                        await supabase_1.supabase.storage
                            .from('doconline')
                            .remove([`pages/${pageFileName}`]);
                    }
                }
            }
            await this.pageModel.deleteMany({ documentId: document._id });
            if (document.filePath) {
                const oldFileName = document.filePath.split('/').slice(-1)[0];
                await supabase_1.supabase.storage
                    .from('doconline')
                    .remove([`documents/${oldFileName}`]);
            }
            const newFileName = `documents/document-${id}-${(0, uuid_1.v4)()}.${fileExt}`;
            const { data, error } = await supabase_1.supabase.storage
                .from('doconline')
                .upload(newFileName, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false,
            });
            if (error) {
                throw new common_1.BadRequestException(`Upload failed: ${error.message}`);
            }
            const { data: urlData } = supabase_1.supabase.storage
                .from('doconline')
                .getPublicUrl(newFileName);
            const totalPages = await this.analyzeFile(file);
            document.filePath = urlData.publicUrl;
            document.fileType = fileExt;
            document.totalPages = totalPages;
            const newPages = Array.from({ length: totalPages }, (_, i) => ({
                documentId: document._id,
                pageNumber: i + 1,
                filePath: urlData.publicUrl,
                fileType: fileExt,
            }));
            await this.pageModel.insertMany(newPages);
        }
        Object.assign(document, dto);
        const saved = document.save();
        return (0, class_transformer_1.plainToInstance)(responseDocument_dto_1.ResponseDocumentDto, saved, {
            excludeExtraneousValues: true,
        });
    }
    async delete(id) {
        const result = await this.documentModel.findByIdAndDelete(id);
        if (!result) {
            throw new common_1.NotFoundException(`Document with id ${id} not found`);
        }
        await this.pageModel.deleteMany({ documentId: result._id });
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
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(document_schema_1.Document.name)),
    __param(1, (0, mongoose_1.InjectModel)(page_schema_1.Page.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        document_gateway_1.DocumentGateway])
], DocumentService);
//# sourceMappingURL=document.service.js.map