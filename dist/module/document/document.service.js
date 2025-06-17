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
const pdf_lib_1 = require("pdf-lib");
const path = __importStar(require("path"));
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
        const fileExt = path.extname(file.originalname)?.substring(1).toLowerCase();
        const pageEntities = [];
        let totalPages = 0;
        let originalFilePath;
        const nowTimestamp = Date.now();
        const newDocId = new mongoose_2.Types.ObjectId();
        originalFilePath = `documents/${nowTimestamp}_${file.originalname}`;
        const { error: originalUploadError } = await supabase_1.supabase.storage
            .from('doconline')
            .upload(originalFilePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (originalUploadError) {
            throw new common_1.BadRequestException(`Tải file gốc thất bại: ${originalUploadError.message}`);
        }
        const { data: originalUrlData } = supabase_1.supabase.storage
            .from('doconline')
            .getPublicUrl(originalFilePath);
        if (!originalUrlData?.publicUrl ||
            typeof originalUrlData.publicUrl !== 'string') {
            throw new common_1.BadRequestException('Không thể lấy publicUrl cho file gốc.');
        }
        if (fileExt === 'pdf') {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(file.buffer);
            const pages = pdfDoc.getPages();
            totalPages = pages.length;
            for (let i = 0; i < totalPages; i++) {
                const singlePageDoc = await pdf_lib_1.PDFDocument.create();
                const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
                singlePageDoc.addPage(copiedPage);
                const pdfBytes = await singlePageDoc.save();
                const pageFileName = `documents/${newDocId}/page_${i + 1}.pdf`;
                const { error } = await supabase_1.supabase.storage
                    .from('doconline')
                    .upload(pageFileName, Buffer.from(pdfBytes), {
                    contentType: 'application/pdf',
                    upsert: false,
                });
                if (error) {
                    throw new common_1.BadRequestException(`Upload page ${i + 1} thất bại: ${error.message}`);
                }
                const { data: urlData } = supabase_1.supabase.storage
                    .from('doconline')
                    .getPublicUrl(pageFileName);
                pageEntities.push({
                    documentId: newDocId,
                    pageNumber: i + 1,
                    filePath: urlData.publicUrl,
                    fileType: 'pdf',
                });
            }
        }
        else if (fileExt === 'txt') {
            const text = file.buffer.toString('utf-8').trim();
            const charsPerPage = 100000;
            const totalChunks = Math.ceil(text.length / charsPerPage);
            for (let i = 0; i < totalChunks; i++) {
                const chunkText = text.slice(i * charsPerPage, (i + 1) * charsPerPage);
                const pageFileName = `documents/${newDocId}/page_${i + 1}.txt`;
                const { error } = await supabase_1.supabase.storage
                    .from('doconline')
                    .upload(pageFileName, Buffer.from(chunkText), {
                    contentType: 'text/plain',
                    upsert: false,
                });
                if (error) {
                    throw new common_1.BadRequestException(`Upload TXT page ${i + 1} thất bại: ${error.message}`);
                }
                const { data: urlData } = supabase_1.supabase.storage
                    .from('doconline')
                    .getPublicUrl(pageFileName);
                pageEntities.push({
                    documentId: newDocId,
                    pageNumber: i + 1,
                    filePath: urlData.publicUrl,
                    fileType: 'txt',
                });
            }
            totalPages = pageEntities.length;
        }
        else if (fileExt === 'xlsx') {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const rowsPerPage = 30;
            const totalChunks = Math.ceil(rows.length / rowsPerPage);
            for (let i = 0; i < totalChunks; i++) {
                const chunkRows = rows.slice(i * rowsPerPage, (i + 1) * rowsPerPage);
                const contentLines = chunkRows
                    .map((row) => row.join(' | '))
                    .filter((line) => line.trim() !== '');
                const pageContent = contentLines.join('\n');
                const pageFileName = `documents/${newDocId}/page_${i + 1}.txt`;
                const { error } = await supabase_1.supabase.storage
                    .from('doconline')
                    .upload(pageFileName, Buffer.from(pageContent), {
                    contentType: 'text/plain',
                    upsert: false,
                });
                if (error) {
                    throw new common_1.BadRequestException(`Upload XLSX page ${i + 1} thất bại: ${error.message}`);
                }
                const { data: urlData } = supabase_1.supabase.storage
                    .from('doconline')
                    .getPublicUrl(pageFileName);
                pageEntities.push({
                    documentId: newDocId,
                    pageNumber: i + 1,
                    filePath: urlData.publicUrl,
                    fileType: 'xlsx',
                });
            }
            totalPages = pageEntities.length;
        }
        else {
            throw new common_1.BadRequestException('Chỉ hỗ trợ file PDF, TXT hoặc XLSX.');
        }
        const newDoc = new this.documentModel({
            ...docInfo,
            fileType: fileExt,
            totalPages,
            userId: data.userId,
            _id: newDocId,
            filePath: originalUrlData.publicUrl,
        });
        await newDoc.save();
        if (pageEntities.length > 0) {
            await this.pageModel.insertMany(pageEntities);
        }
        await newDoc.populate('userId', 'username');
        await this.documentGateway.notifyHomeDocumentUpdate('created', newDoc);
        return (0, class_transformer_1.plainToInstance)(responseDocument_dto_1.ResponseDocumentDto, newDoc.toObject(), {
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
        const doc = await this.documentModel
            .findById(id)
            .populate('userId', 'username');
        if (!doc) {
            throw new common_1.NotFoundException(`Document with id ${id} not found`);
        }
        return (0, class_transformer_1.plainToInstance)(responseDocument_dto_1.ResponseDocumentDto, doc.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async update(id, dto, file, userId) {
        const document = await this.documentModel.findById(id);
        if (!document) {
            throw new common_1.NotFoundException(message_1.MESSAGES.DOCUMENT_NOT_FOUND);
        }
        if (file) {
            const fileExt = file.originalname.split('.').pop()?.toLowerCase();
            const allowedTypes = ['pdf', 'txt', 'xlsx'];
            if (!fileExt || !allowedTypes.includes(fileExt)) {
                throw new common_1.BadRequestException(`Chỉ cho phép file .pdf, .txt, hoặc .xlsx.`);
            }
            const pages = await this.pageModel.find({ documentId: document._id });
            for (const page of pages) {
                if (page.filePath) {
                    try {
                        const pageFileName = page.filePath.split('/').slice(-1)[0];
                        const { error: removePageError } = await supabase_1.supabase.storage
                            .from('doconline')
                            .remove([`documents/${document._id}/pages/${pageFileName}`]);
                        if (removePageError) {
                            console.warn(`Cảnh báo: Không thể xóa trang cũ ${pageFileName} khỏi Supabase: ${removePageError.message}`);
                        }
                    }
                    catch (e) {
                        console.error(`Lỗi khi cố gắng xóa trang Supabase: ${page.filePath}`, e);
                    }
                }
            }
            await this.pageModel.deleteMany({ documentId: document._id });
            console.log(`Đã xóa tất cả các trang cũ cho document ID: ${document._id}`);
            if (document.filePath) {
                try {
                    const oldFileBucketPath = document.filePath.substring(document.filePath.indexOf('documents/'));
                    const { error: removeOldFileError } = await supabase_1.supabase.storage
                        .from('doconline')
                        .remove([oldFileBucketPath]);
                    if (removeOldFileError) {
                        console.warn(`Cảnh báo: Không thể xóa file gốc cũ ${oldFileBucketPath} khỏi Supabase: ${removeOldFileError.message}`);
                    }
                }
                catch (e) {
                    console.error(`Lỗi khi cố gắng xóa file gốc cũ Supabase: ${document.filePath}`, e);
                }
            }
            const originalFileName = `documents/document-${id}-${(0, uuid_1.v4)()}.${fileExt}`;
            const { error: uploadError } = await supabase_1.supabase.storage
                .from('doconline')
                .upload(originalFileName, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false,
            });
            if (uploadError) {
                throw new common_1.BadRequestException(`Upload file gốc mới thất bại: ${uploadError.message}`);
            }
            const { data: originalUrlData } = supabase_1.supabase.storage
                .from('doconline')
                .getPublicUrl(originalFileName);
            if (!originalUrlData?.publicUrl ||
                typeof originalUrlData.publicUrl !== 'string') {
                throw new common_1.BadRequestException('Không thể lấy URL file gốc mới.');
            }
            document.filePath = originalUrlData.publicUrl;
            document.fileType = fileExt;
            const newPages = [];
            if (fileExt === 'pdf') {
                const pdfDoc = await pdf_lib_1.PDFDocument.load(file.buffer);
                const totalPages = pdfDoc.getPages().length;
                for (let i = 0; i < totalPages; i++) {
                    const singlePageDoc = await pdf_lib_1.PDFDocument.create();
                    const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
                    singlePageDoc.addPage(copiedPage);
                    const pdfBytes = await singlePageDoc.save();
                    const pageFileName = `documents/${document._id}/pages/page_${i + 1}-${(0, uuid_1.v4)()}.pdf`;
                    const { error } = await supabase_1.supabase.storage
                        .from('doconline')
                        .upload(pageFileName, Buffer.from(pdfBytes), {
                        contentType: 'application/pdf',
                        cacheControl: '3600',
                        upsert: false,
                    });
                    if (error) {
                        throw new common_1.BadRequestException(`Upload trang PDF ${i + 1} thất bại: ${error.message}`);
                    }
                    const { data: urlData } = supabase_1.supabase.storage
                        .from('doconline')
                        .getPublicUrl(pageFileName);
                    newPages.push({
                        documentId: document._id,
                        pageNumber: i + 1,
                        filePath: urlData.publicUrl,
                        fileType: 'pdf',
                    });
                }
                document.totalPages = totalPages;
            }
            else if (fileExt === 'txt') {
                const text = file.buffer.toString('utf-8').trim();
                const charsPerPage = 2000;
                const totalChunks = Math.ceil(text.length / charsPerPage);
                for (let i = 0; i < totalChunks; i++) {
                    newPages.push({
                        documentId: document._id,
                        pageNumber: i + 1,
                        filePath: document.filePath,
                        fileType: 'txt',
                    });
                }
                document.totalPages = totalChunks;
            }
            else if (fileExt === 'xlsx') {
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheetNames = workbook.SheetNames;
                for (let i = 0; i < sheetNames.length; i++) {
                    const sheet = workbook.Sheets[sheetNames[i]];
                    const csvBuffer = Buffer.from(XLSX.utils.sheet_to_csv(sheet), 'utf-8');
                    const pageFileName = `documents/${document._id}/pages/sheet_${i + 1}${(0, uuid_1.v4)()}.csv`;
                    const { error } = await supabase_1.supabase.storage
                        .from('doconline')
                        .upload(pageFileName, csvBuffer, {
                        contentType: 'text/csv',
                        cacheControl: '3600',
                        upsert: false,
                    });
                    if (error) {
                        throw new common_1.BadRequestException(`Upload sheet ${i + 1} thất bại: ${error.message}`);
                    }
                    const { data: urlData } = supabase_1.supabase.storage
                        .from('doconline')
                        .getPublicUrl(pageFileName);
                    newPages.push({
                        documentId: document._id,
                        pageNumber: i + 1,
                        filePath: urlData.publicUrl,
                        fileType: 'csv',
                    });
                }
                document.totalPages = sheetNames.length;
            }
            if (newPages.length > 0) {
                await this.pageModel.insertMany(newPages);
            }
        }
        Object.assign(document, dto);
        if (userId) {
            document.userId = new mongoose_2.Types.ObjectId(userId);
        }
        const saved = await document.save();
        this.documentGateway.notifyDocumentChange(document.id.toString(), saved);
        this.documentGateway.notifyHomeDocumentUpdate('updated', saved);
        return (0, class_transformer_1.plainToInstance)(responseDocument_dto_1.ResponseDocumentDto, saved.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async delete(id) {
        const result = await this.documentModel.findByIdAndDelete(id);
        if (!result) {
            throw new common_1.NotFoundException(`Document with id ${id} not found`);
        }
        await this.pageModel.deleteMany({ documentId: result._id });
        await this.documentGateway.notifyHomeDocumentUpdate('deleted', result);
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
    async splitPdf(fileBuffer) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(fileBuffer);
        const numPages = pdfDoc.getPages().length;
        const pagesBuffers = [];
        for (let i = 0; i < numPages; i++) {
            const subDoc = await pdf_lib_1.PDFDocument.create();
            const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
            subDoc.addPage(copiedPage);
            const pdfBytes = await subDoc.save();
            pagesBuffers.push(Buffer.from(pdfBytes));
        }
        return pagesBuffers;
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