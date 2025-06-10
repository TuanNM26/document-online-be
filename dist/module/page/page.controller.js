"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageController = void 0;
const common_1 = require("@nestjs/common");
const page_service_1 = require("./page.service");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const responsePage_dto_1 = require("./dto/responsePage.dto");
let PageController = class PageController {
    pageService;
    constructor(pageService) {
        this.pageService = pageService;
    }
    async getPagesByDocument(documentId) {
        const pages = await this.pageService.findByDocumentId(documentId);
        return { data: pages };
    }
    async addPages(id, file) {
        return this.pageService.addPagesToDocument(id, file);
    }
    findAll(page = '1', limit = '10', q) {
        return this.pageService.findAll(Number(page), Number(limit), q);
    }
    findOne(id) {
        return this.pageService.findOne(id);
    }
    async updatePageFile(id, file) {
        return this.pageService.updatePageFile(id, file);
    }
    remove(id) {
        return this.pageService.remove(id);
    }
};
exports.PageController = PageController;
__decorate([
    (0, common_1.Get)('document/:documentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pages of a document by documentId' }),
    (0, swagger_1.ApiParam)({ name: 'documentId', required: true }),
    __param(0, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getPagesByDocument", null);
__decorate([
    (0, common_1.Post)(':id/pages'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Thêm các trang vào tài liệu đã tồn tại' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID của document',
        type: String,
    }),
    (0, swagger_1.ApiBody)({
        description: 'File PDF cần tách thành các trang và thêm vào document',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['file'],
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "addPages", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of all pages' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], PageController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get page information by id' }),
    (0, swagger_1.ApiParam)({ name: 'id', required: true }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PageController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiOkResponse)({ type: [responsePage_dto_1.ResponsePageDto] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "updatePageFile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a page' }),
    (0, swagger_1.ApiParam)({ name: 'id', required: true }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PageController.prototype, "remove", null);
exports.PageController = PageController = __decorate([
    (0, swagger_1.ApiTags)('Pages'),
    (0, common_1.Controller)('pages'),
    __metadata("design:paramtypes", [page_service_1.PageService])
], PageController);
//# sourceMappingURL=page.controller.js.map