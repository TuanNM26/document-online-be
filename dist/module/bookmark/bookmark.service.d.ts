import { Model } from 'mongoose';
import { BookmarkDocument } from './bookmark.schema';
import { CreateBookmarkDto } from './dto/createBookmark.dto';
import { UpdateBookmarkDto } from './dto/updateBookmark.dto';
import { DocumentInfo, ResponseBookmarkDto } from './dto/responseBookmark.dto';
import { PageDocument } from '../page/page.schema';
import { DocumentDocument } from '../document/document.schema';
import { userInfo } from '../bookmark/dto/responseBookmark.dto';
export declare class BookmarkService {
    private bookmarkModel;
    private pageModel;
    private documentModel;
    constructor(bookmarkModel: Model<BookmarkDocument>, pageModel: Model<PageDocument>, documentModel: Model<DocumentDocument>);
    create(dto: CreateBookmarkDto, userId: string): Promise<ResponseBookmarkDto>;
    findAll(page?: number, limit?: number, q?: string): Promise<{
        data: ResponseBookmarkDto[];
        pagination: {
            totalItems: number;
            totalPages: number;
            currentPage: number;
            pageSize: number;
        };
    }>;
    findOne(id: string): Promise<ResponseBookmarkDto>;
    update(id: string, dto: UpdateBookmarkDto): Promise<ResponseBookmarkDto>;
    remove(id: string): Promise<ResponseBookmarkDto>;
    getBookmarkPageFile(bookmarkId: string): Promise<{
        document: DocumentInfo;
        pageId: string;
        filePath: string;
        user: userInfo;
    }>;
    findAllByUserId(userId: string, page?: number, limit?: number, q?: string): Promise<{
        data: ResponseBookmarkDto[];
        pagination: {
            totalItems: number;
            totalPages: number;
            currentPage: number;
            pageSize: number;
        };
    }>;
}
