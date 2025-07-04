import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { plainToInstance, Type } from 'class-transformer';

import { Bookmark, BookmarkDocument } from './bookmark.schema';
import { CreateBookmarkDto } from './dto/createBookmark.dto';
import { UpdateBookmarkDto } from './dto/updateBookmark.dto';
import { DocumentInfo, ResponseBookmarkDto } from './dto/responseBookmark.dto';

import { Page, PageDocument } from '../page/page.schema';
import { Document, DocumentDocument } from '../document/document.schema';
import { MESSAGES } from '../../common/constant/message';
import { userInfo } from '../bookmark/dto/responseBookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
  ) {}

  async create(
    dto: CreateBookmarkDto,
    userId: string,
  ): Promise<ResponseBookmarkDto> {
    const pageExists = await this.pageModel.exists({
      _id: new Types.ObjectId(dto.pageId),
      documentId: new Types.ObjectId(dto.documentId),
    });

    console.log(pageExists);
    if (!pageExists) {
      throw new BadRequestException(MESSAGES.PAGE_NOT_EXIST_DOCUMENT);
    }

    const existing = await this.bookmarkModel.findOne({
      documentId: new Types.ObjectId(dto.documentId),
      userId: new Types.ObjectId(userId),
      pageNumber: new Types.ObjectId(dto.pageId),
    });

    if (existing) {
      throw new ConflictException(MESSAGES.BOOKMARK_ALREADY_EXIST);
    }

    const bookmark = new this.bookmarkModel(dto);
    bookmark.userId = new Types.ObjectId(userId);
    const saved = await bookmark.save();
    const populated = await saved.populate('documentId', 'title field');

    return plainToInstance(ResponseBookmarkDto, populated.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    q?: string,
  ): Promise<{
    data: ResponseBookmarkDto[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  }> {
    const filter: any = {};

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      const matchingDocuments = await this.documentModel
        .find({
          $or: [{ title: { $regex: regex } }, { field: { $regex: regex } }],
        })
        .select('_id');

      const matchingDocumentIds = matchingDocuments.map((doc) =>
        doc.id.toString(),
      );

      if (matchingDocumentIds.length > 0) {
        filter.$or = [
          { note: { $regex: regex } },
          { documentId: { $in: matchingDocumentIds } },
        ];
      } else {
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
      data: plainToInstance(ResponseBookmarkDto, withRenamed, {
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

  async findOne(id: string): Promise<ResponseBookmarkDto> {
    const bookmark = await this.bookmarkModel
      .findById(id)
      .populate('documentId')
      .populate('userId', 'username')
      .lean();

    if (!bookmark) throw new NotFoundException(MESSAGES.BOOKMARK_NOT_FOUND);

    const withRenamed = {
      ...bookmark,
      document: bookmark.documentId,
      user: bookmark.userId,
    };

    return plainToInstance(ResponseBookmarkDto, withRenamed, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    dto: UpdateBookmarkDto,
  ): Promise<ResponseBookmarkDto> {
    const updated = await this.bookmarkModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('documentId')
      .populate('userId', 'username')
      .lean();

    if (!updated) throw new NotFoundException(MESSAGES.BOOKMARK_NOT_FOUND);

    const withRenamed = {
      ...updated,
      document: updated.documentId,
      user: updated.userId,
    };

    return plainToInstance(ResponseBookmarkDto, withRenamed, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<ResponseBookmarkDto> {
    const deleted = await this.bookmarkModel
      .findByIdAndDelete(id)
      .populate('documentId')
      .populate('userId', 'username')
      .lean();

    if (!deleted) throw new NotFoundException(MESSAGES.BOOKMARK_NOT_FOUND);

    const withRenamed = {
      ...deleted,
      document: deleted.documentId,
      user: deleted.userId,
    };

    return plainToInstance(ResponseBookmarkDto, withRenamed, {
      excludeExtraneousValues: true,
    });
  }

  async getBookmarkPageFile(bookmarkId: string): Promise<{
    document: DocumentInfo;
    pageId: string;
    filePath: string;
    user: userInfo;
  }> {
    if (!Types.ObjectId.isValid(bookmarkId)) {
      throw new BadRequestException('Invalid bookmark ID');
    }

    const bookmark = await this.bookmarkModel
      .findById(bookmarkId)
      .populate('documentId')
      .populate('userId')
      .populate('pageId')
      .lean();

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    const document = bookmark.documentId;
    const page = await this.pageModel.findById(bookmark.pageId).lean();

    if (!page || !page.filePath) {
      throw new NotFoundException('Page not found or missing file path');
    }

    const documentDto = plainToInstance(DocumentInfo, document, {
      excludeExtraneousValues: true,
    });

    const userDto = plainToInstance(userInfo, bookmark.userId, {
      excludeExtraneousValues: true,
    });

    return {
      document: documentDto,
      pageId: page._id.toString(),
      filePath: page.filePath,
      user: userDto,
    };
  }

  async findAllByUserId(
    userId: string,
    page = 1,
    limit = 10,
    q?: string,
  ): Promise<{
    data: ResponseBookmarkDto[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const filter: any = { userId: new Types.ObjectId(userId) }; // Filter by userId

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      const matchingDocuments = await this.documentModel
        .find({
          $or: [{ title: { $regex: regex } }, { field: { $regex: regex } }],
        })
        .select('_id');

      const matchingDocumentIds = matchingDocuments.map((doc) =>
        doc.id.toString(),
      );
      if (matchingDocumentIds.length > 0) {
        filter.$and = [
          { userId: new Types.ObjectId(userId) },
          {
            $or: [
              { note: { $regex: regex } },
              { documentId: { $in: matchingDocumentIds } },
            ],
          },
        ];
      } else {
        filter.$and = [
          { userId: new Types.ObjectId(userId) },
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
      data: plainToInstance(ResponseBookmarkDto, withRenamed, {
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
}
