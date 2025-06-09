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
exports.ResponseDocumentDto = void 0;
const class_transformer_1 = require("class-transformer");
let ResponseDocumentDto = class ResponseDocumentDto {
    _id;
    title;
    field;
    userId;
    username;
    filePath;
    fileType;
    totalPages;
};
exports.ResponseDocumentDto = ResponseDocumentDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj._id.toString()),
    __metadata("design:type", String)
], ResponseDocumentDto.prototype, "_id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ResponseDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ResponseDocumentDto.prototype, "field", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.userId?._id.toString()),
    __metadata("design:type", String)
], ResponseDocumentDto.prototype, "userId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.userId?.username),
    __metadata("design:type", String)
], ResponseDocumentDto.prototype, "username", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ResponseDocumentDto.prototype, "filePath", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ResponseDocumentDto.prototype, "fileType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], ResponseDocumentDto.prototype, "totalPages", void 0);
exports.ResponseDocumentDto = ResponseDocumentDto = __decorate([
    (0, class_transformer_1.Exclude)()
], ResponseDocumentDto);
//# sourceMappingURL=responseDocument.dto.js.map