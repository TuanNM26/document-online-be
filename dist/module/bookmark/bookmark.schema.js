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
exports.BookmarkSchema = exports.Bookmark = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Bookmark = class Bookmark {
    documentId;
    userId;
    pageId;
    note;
};
exports.Bookmark = Bookmark;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Document', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Bookmark.prototype, "documentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Bookmark.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Page', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Bookmark.prototype, "pageId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Bookmark.prototype, "note", void 0);
exports.Bookmark = Bookmark = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Bookmark);
exports.BookmarkSchema = mongoose_1.SchemaFactory.createForClass(Bookmark);
exports.BookmarkSchema.index({ userId: 1, documentId: 1, pageId: 1 }, { unique: true });
//# sourceMappingURL=bookmark.schema.js.map