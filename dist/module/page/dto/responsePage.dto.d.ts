import { Types } from 'mongoose';
export declare class DocumentDto {
    _id: Types.ObjectId;
    title: string;
    field: string;
}
export declare class ResponsePageDto {
    _id: Types.ObjectId;
    document: DocumentDto;
    pageNumber: number;
    filePath: string;
    fileType: 'text' | 'excel' | 'pdf';
}
