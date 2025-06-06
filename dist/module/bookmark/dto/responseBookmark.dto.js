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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBookmarkDto = exports.userInfo = exports.DocumentInfo = void 0;
const class_transformer_1 = require("class-transformer");
const mongoose_1 = require("mongoose");
class DocumentInfo {
    _id;
    title;
    field;
    filePath;
    fileType;
    totalPages;
}
exports.DocumentInfo = DocumentInfo;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DocumentInfo.prototype, "_id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DocumentInfo.prototype, "title", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DocumentInfo.prototype, "field", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DocumentInfo.prototype, "filePath", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DocumentInfo.prototype, "fileType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DocumentInfo.prototype, "totalPages", void 0);
class userInfo {
    _id;
    username;
}
exports.userInfo = userInfo;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], userInfo.prototype, "_id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], userInfo.prototype, "username", void 0);
class ResponseBookmarkDto {
    _id;
    pageNumber;
    note;
    document;
    user;
}
exports.ResponseBookmarkDto = ResponseBookmarkDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], ResponseBookmarkDto.prototype, "_id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], ResponseBookmarkDto.prototype, "pageNumber", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ResponseBookmarkDto.prototype, "note", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => DocumentInfo),
    __metadata("design:type", DocumentInfo)
], ResponseBookmarkDto.prototype, "document", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => userInfo),
    __metadata("design:type", userInfo)
], ResponseBookmarkDto.prototype, "user", void 0);
//# sourceMappingURL=responseBookmark.dto.js.map