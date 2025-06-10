import { DocumentDocument } from './document.schema';
import { Model } from 'mongoose';
import { PageDocument } from '../page/page.schema';
import { DocumentGateway } from './document.gateway';
import { UpdateDocumentDto } from './dto/updateDocument.dto';
import { ResponseDocumentDto } from './dto/responseDocument.dto';
import { PaginationResult } from 'src/common/interface/pagination.interface';
export declare class DocumentService {
    private readonly documentModel;
    private readonly pageModel;
    private readonly documentGateway;
    constructor(documentModel: Model<DocumentDocument>, pageModel: Model<PageDocument>, documentGateway: DocumentGateway);
    create(data: {
        title: string;
        field: string;
        file: Express.Multer.File;
        userId: string;
    }): Promise<ResponseDocumentDto>;
    findAll(page?: number, limit?: number, searchQuery?: string): Promise<PaginationResult<ResponseDocumentDto>>;
    findById(id: string): Promise<ResponseDocumentDto>;
    update(id: string, dto: UpdateDocumentDto, file?: Express.Multer.File, userId?: string): Promise<ResponseDocumentDto>;
    delete(id: string): Promise<void>;
    analyzeFile(file: Express.Multer.File): Promise<number>;
    splitPdf(fileBuffer: Buffer): Promise<Buffer[]>;
}
