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
exports.BookmarkService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const class_transformer_1 = require("class-transformer");
const bookmark_schema_1 = require("./bookmark.schema");
const responseBookmark_dto_1 = require("./dto/responseBookmark.dto");
const page_schema_1 = require("../page/page.schema");
const document_schema_1 = require("../document/document.schema");
const message_1 = require("../../common/constant/message");
const responseBookmark_dto_2 = require("../bookmark/dto/responseBookmark.dto");
let BookmarkService = class BookmarkService {
    bookmarkModel;
    pageModel;
    documentModel;
    constructor(bookmarkModel, pageModel, documentModel) {
        this.bookmarkModel = bookmarkModel;
        this.pageModel = pageModel;
        this.documentModel = documentModel;
    }
    async create(dto, userId) {
        const pageExists = await this.pageModel.exists({
            _id: new mongoose_2.Types.ObjectId(dto.pageId),
            documentId: new mongoose_2.Types.ObjectId(dto.documentId),
        });
        console.log(pageExists);
        if (!pageExists) {
            throw new common_1.BadRequestException(message_1.MESSAGES.PAGE_NOT_EXIST_DOCUMENT);
        }
        const existing = await this.bookmarkModel.findOne({
            documentId: new mongoose_2.Types.ObjectId(dto.documentId),
            userId: new mongoose_2.Types.ObjectId(userId),
            pageNumber: new mongoose_2.Types.ObjectId(dto.pageId),
        });
        if (existing) {
            throw new common_1.ConflictException(message_1.MESSAGES.BOOKMARK_ALREADY_EXIST);
        }
        const bookmark = new this.bookmarkModel(dto);
        bookmark.userId = new mongoose_2.Types.ObjectId(userId);
        const saved = await bookmark.save();
        const populated = await saved.populate('documentId', 'title field');
        return (0, class_transformer_1.plainToInstance)(responseBookmark_dto_1.ResponseBookmarkDto, populated.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async findAll(page = 1, limit = 10, q) {
        const filter = {};
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            const matchingDocuments = await this.documentModel
                .find({
                $or: [{ title: { $regex: regex } }, { field: { $regex: regex } }],
            })
                .select('_id');
            const matchingDocumentIds = matchingDocuments.map((doc) => doc.id.toString());
            if (matchingDocumentIds.length > 0) {
                filter.$or = [
                    { note: { $regex: regex } },
                    { documentId: { $in: matchingDocumentIds } },
                ];
            }
            else {
                filter.note = { $regex: regex };
            }
        }
        const [results, totalItems] = await Promise.all([
            this.bookmarkModel
                .find(filter)
                .populate('documentId')
                .populate('userId', 'username')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            this.bookmarkModel.countDocuments(filter),
        ]);
        const withRenamed = results.map((bookmark) => ({
            ...bookmark,
            document: bookmark.documentId,
            user: bookmark.userId,
        }));
        return {
            data: (0, class_transformer_1.plainToInstance)(responseBookmark_dto_1.ResponseBookmarkDto, withRenamed, {
                excludeExtraneousValues: true,
            }),
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                pageSize: limit,
            },
        };
    }
    async findOne(id) {
        const bookmark = await this.bookmarkModel
            .findById(id)
            .populate('documentId')
            .populate('userId', 'username')
            .lean();
        if (!bookmark)
            throw new common_1.NotFoundException(message_1.MESSAGES.BOOKMARK_NOT_FOUND);
        const withRenamed = {
            ...bookmark,
            document: bookmark.documentId,
            user: bookmark.userId,
        };
        return (0, class_transformer_1.plainToInstance)(responseBookmark_dto_1.ResponseBookmarkDto, withRenamed, {
            excludeExtraneousValues: true,
        });
    }
    async update(id, dto) {
        const updated = await this.bookmarkModel
            .findByIdAndUpdate(id, dto, { new: true })
            .populate('documentId')
            .populate('userId', 'username')
            .lean();
        if (!updated)
            throw new common_1.NotFoundException(message_1.MESSAGES.BOOKMARK_NOT_FOUND);
        const withRenamed = {
            ...updated,
            document: updated.documentId,
            user: updated.userId,
        };
        return (0, class_transformer_1.plainToInstance)(responseBookmark_dto_1.ResponseBookmarkDto, withRenamed, {
            excludeExtraneousValues: true,
        });
    }
    async remove(id) {
        const deleted = await this.bookmarkModel
            .findByIdAndDelete(id)
            .populate('documentId')
            .populate('userId', 'username')
            .lean();
        if (!deleted)
            throw new common_1.NotFoundException(message_1.MESSAGES.BOOKMARK_NOT_FOUND);
        const withRenamed = {
            ...deleted,
            document: deleted.documentId,
            user: deleted.userId,
        };
        return (0, class_transformer_1.plainToInstance)(responseBookmark_dto_1.ResponseBookmarkDto, withRenamed, {
            excludeExtraneousValues: true,
        });
    }
    async getBookmarkPageFile(bookmarkId) {
        if (!mongoose_2.Types.ObjectId.isValid(bookmarkId)) {
            throw new common_1.BadRequestException('Invalid bookmark ID');
        }
        const bookmark = await this.bookmarkModel
            .findById(bookmarkId)
            .populate('documentId')
            .populate('userId')
            .populate('pageId')
            .lean();
        if (!bookmark) {
            throw new common_1.NotFoundException('Bookmark not found');
        }
        const document = bookmark.documentId;
        const page = await this.pageModel.findById(bookmark.pageId).lean();
        if (!page || !page.filePath) {
            throw new common_1.NotFoundException('Page not found or missing file path');
        }
        const documentDto = (0, class_transformer_1.plainToInstance)(responseBookmark_dto_1.DocumentInfo, document, {
            excludeExtraneousValues: true,
        });
        const userDto = (0, class_transformer_1.plainToInstance)(responseBookmark_dto_2.userInfo, bookmark.userId, {
            excludeExtraneousValues: true,
        });
        return {
            document: documentDto,
            pageId: page._id.toString(),
            filePath: page.filePath,
            user: userDto,
        };
    }
    async findAllByUserId(userId, page = 1, limit = 10, q) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const filter = { userId: new mongoose_2.Types.ObjectId(userId) };
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            const matchingDocuments = await this.documentModel
                .find({
                $or: [{ title: { $regex: regex } }, { field: { $regex: regex } }],
            })
                .select('_id');
            const matchingDocumentIds = matchingDocuments.map((doc) => doc.id.toString());
            if (matchingDocumentIds.length > 0) {
                filter.$and = [
                    { userId: new mongoose_2.Types.ObjectId(userId) },
                    {
                        $or: [
                            { note: { $regex: regex } },
                            { documentId: { $in: matchingDocumentIds } },
                        ],
                    },
                ];
            }
            else {
                filter.$and = [
                    { userId: new mongoose_2.Types.ObjectId(userId) },
                    { note: { $regex: regex } },
                ];
            }
        }
        const [results, totalItems] = await Promise.all([
            this.bookmarkModel
                .find(filter)
                .populate('documentId')
                .populate('userId', 'username')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            this.bookmarkModel.countDocuments(filter),
        ]);
        const withRenamed = results.map((bookmark) => ({
            ...bookmark,
            document: {
                ...bookmark.documentId,
                _id: bookmark.documentId?._id?.toString(),
            },
            user: bookmark.userId,
        }));
        return {
            data: (0, class_transformer_1.plainToInstance)(responseBookmark_dto_1.ResponseBookmarkDto, withRenamed, {
                excludeExtraneousValues: true,
            }),
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                pageSize: limit,
            },
        };
    }
};
exports.BookmarkService = BookmarkService;
exports.BookmarkService = BookmarkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(bookmark_schema_1.Bookmark.name)),
    __param(1, (0, mongoose_1.InjectModel)(page_schema_1.Page.name)),
    __param(2, (0, mongoose_1.InjectModel)(document_schema_1.Document.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], BookmarkService);
//# sourceMappingURL=bookmark.service.js.map