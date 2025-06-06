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
exports.BookmarkController = void 0;
const common_1 = require("@nestjs/common");
const bookmark_service_1 = require("./bookmark.service");
const createBookmark_dto_1 = require("../bookmark/dto/createBookmark.dto");
const updateBookmark_dto_1 = require("../bookmark/dto/updateBookmark.dto");
const swagger_1 = require("@nestjs/swagger");
let BookmarkController = class BookmarkController {
    bookmarkService;
    constructor(bookmarkService) {
        this.bookmarkService = bookmarkService;
    }
    create(dto) {
        return this.bookmarkService.create(dto);
    }
    getPageFile(bookmarkId) {
        return this.bookmarkService.getBookmarkPageFile(bookmarkId);
    }
    findAll(page = '1', limit = '10', q) {
        return this.bookmarkService.findAll(Number(page), Number(limit), q);
    }
    findOne(id) {
        return this.bookmarkService.findOne(id);
    }
    update(id, dto) {
        return this.bookmarkService.update(id, dto);
    }
    remove(id) {
        return this.bookmarkService.remove(id);
    }
};
exports.BookmarkController = BookmarkController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new bookmark' }),
    (0, swagger_1.ApiBody)({ type: createBookmark_dto_1.CreateBookmarkDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bookmark created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createBookmark_dto_1.CreateBookmarkDto]),
    __metadata("design:returntype", void 0)
], BookmarkController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':bookmarkId/page-file'),
    (0, swagger_1.ApiOperation)({ summary: 'Get page file from bookmark' }),
    (0, swagger_1.ApiParam)({ name: 'bookmarkId', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Page file retrieved successfully' }),
    __param(0, (0, common_1.Param)('bookmarkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookmarkController.prototype, "getPageFile", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of bookmarks (with pagination & search)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of bookmarks' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], BookmarkController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bookmark details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bookmark details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookmarkController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bookmark by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiBody)({ type: updateBookmark_dto_1.UpdateBookmarkDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bookmark updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, updateBookmark_dto_1.UpdateBookmarkDto]),
    __metadata("design:returntype", void 0)
], BookmarkController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete bookmark by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bookmark deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookmarkController.prototype, "remove", null);
exports.BookmarkController = BookmarkController = __decorate([
    (0, swagger_1.ApiTags)('Bookmarks'),
    (0, common_1.Controller)('bookmarks'),
    __metadata("design:paramtypes", [bookmark_service_1.BookmarkService])
], BookmarkController);
//# sourceMappingURL=bookmark.controller.js.map