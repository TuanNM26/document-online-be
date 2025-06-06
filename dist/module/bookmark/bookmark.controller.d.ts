import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from '../bookmark/dto/createBookmark.dto';
import { UpdateBookmarkDto } from '../bookmark/dto/updateBookmark.dto';
export declare class BookmarkController {
    private readonly bookmarkService;
    constructor(bookmarkService: BookmarkService);
    create(dto: CreateBookmarkDto): Promise<import("./dto/responseBookmark.dto").ResponseBookmarkDto>;
    getPageFile(bookmarkId: string): Promise<{
        document: import("./dto/responseBookmark.dto").DocumentInfo;
        pageNumber: number;
        filePath: string;
        user: import("./dto/responseBookmark.dto").userInfo;
    }>;
    findAll(page?: string, limit?: string, q?: string): Promise<{
        data: import("./dto/responseBookmark.dto").ResponseBookmarkDto[];
        pagination: {
            totalItems: number;
            totalPages: number;
            currentPage: number;
            pageSize: number;
        };
    }>;
    findOne(id: string): Promise<import("./dto/responseBookmark.dto").ResponseBookmarkDto>;
    update(id: string, dto: UpdateBookmarkDto): Promise<import("./dto/responseBookmark.dto").ResponseBookmarkDto>;
    remove(id: string): Promise<import("./dto/responseBookmark.dto").ResponseBookmarkDto>;
}
