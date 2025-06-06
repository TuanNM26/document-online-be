import { Model } from 'mongoose';
import { PageDocument } from './page.schema';
import { CreatePageDto } from './dto/createPage.dto';
import { DocumentDocument } from '../document/document.schema';
import { DocumentGateway } from '../document/document.gateway';
import { ResponsePageDto } from './dto/responsePage.dto';
import { PaginationResult } from 'src/common/interface/pagination.interface';
export declare class PageService {
    private pageModel;
    private documentModel;
    private documentGateway;
    constructor(pageModel: Model<PageDocument>, documentModel: Model<DocumentDocument>, documentGateway: DocumentGateway);
    createPage(dto: CreatePageDto, file: Express.Multer.File): Promise<ResponsePageDto[]>;
    analyzeFile(file: Express.Multer.File): Promise<number>;
    private validateFileType;
    findAll(page?: number, limit?: number, q?: string): Promise<PaginationResult<ResponsePageDto>>;
    findOne(id: string): Promise<ResponsePageDto>;
    update(id: string, file?: Express.Multer.File): Promise<ResponsePageDto | ResponsePageDto[]>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findByDocumentId(documentId: string): Promise<ResponsePageDto[]>;
}
