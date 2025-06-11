import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from '../bookmark/dto/createBookmark.dto';
import { UpdateBookmarkDto } from '../bookmark/dto/updateBookmark.dto';
import { ResponseBookmarkDto } from './dto/responseBookmark.dto';
export declare class BookmarkController {
    private readonly bookmarkService;
    constructor(bookmarkService: BookmarkService);
    findMyBookmarks(req: any, page?: number, limit?: number, q?: string): Promise<{
        data: ResponseBookmarkDto[];
        pagination: {
            totalItems: number;
            totalPages: number;
            currentPage: number;
            pageSize: number;
        };
    }>;
    create(dto: CreateBookmarkDto, req: any): Promise<ResponseBookmarkDto>;
    getPageFile(bookmarkId: string): Promise<{
        document: import("./dto/responseBookmark.dto").DocumentInfo;
        pageId: string;
        filePath: string;
        user: import("./dto/responseBookmark.dto").userInfo;
    }>;
    findAll(page?: string, limit?: string, q?: string): Promise<{
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
}
