import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/createDocument.dto';
import { UpdateDocumentDto } from './dto/updateDocument.dto';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    createDocument(body: CreateDocumentDto, file: Express.Multer.File, req: any): Promise<import("./dto/responseDocument.dto").ResponseDocumentDto>;
    findAll(page?: string, limit?: string, q?: string): Promise<import("../../common/interface/pagination.interface").PaginationResult<import("./dto/responseDocument.dto").ResponseDocumentDto>>;
    findOne(id: string): Promise<import("./dto/responseDocument.dto").ResponseDocumentDto>;
    update(id: string, dto: UpdateDocumentDto, file?: Express.Multer.File): Promise<import("./dto/responseDocument.dto").ResponseDocumentDto>;
    remove(id: string): Promise<void>;
}
