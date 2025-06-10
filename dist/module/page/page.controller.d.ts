import { PageService } from './page.service';
import { ResponsePageDto } from './dto/responsePage.dto';
export declare class PageController {
    private readonly pageService;
    constructor(pageService: PageService);
    getPagesByDocument(documentId: string): Promise<{
        data: ResponsePageDto[];
    }>;
    addPages(id: string, file: Express.Multer.File): Promise<ResponsePageDto[]>;
    findAll(page?: string, limit?: string, q?: string): Promise<import("../../common/interface/pagination.interface").PaginationResult<ResponsePageDto>>;
    findOne(id: string): Promise<ResponsePageDto>;
    updatePageFile(id: string, file: Express.Multer.File): Promise<ResponsePageDto[]>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
