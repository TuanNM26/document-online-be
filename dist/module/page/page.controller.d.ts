import { PageService } from './page.service';
import { CreatePageDto } from './dto/createPage.dto';
export declare class PageController {
    private readonly pageService;
    constructor(pageService: PageService);
    getPagesByDocument(documentId: string): Promise<{
        data: import("./dto/responsePage.dto").ResponsePageDto[];
    }>;
    createPage(dto: CreatePageDto, file: Express.Multer.File): Promise<import("./dto/responsePage.dto").ResponsePageDto[]>;
    findAll(page?: string, limit?: string, q?: string): Promise<import("../../common/interface/pagination.interface").PaginationResult<import("./dto/responsePage.dto").ResponsePageDto>>;
    findOne(id: string): Promise<import("./dto/responsePage.dto").ResponsePageDto>;
    update(id: string, file: Express.Multer.File): Promise<import("./dto/responsePage.dto").ResponsePageDto | import("./dto/responsePage.dto").ResponsePageDto[]>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
