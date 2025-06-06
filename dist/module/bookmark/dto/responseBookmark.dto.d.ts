import { Types } from 'mongoose';
export declare class DocumentInfo {
    _id: string;
    title: string;
    field: string;
    filePath: string;
    fileType: string;
    totalPages: number;
}
export declare class userInfo {
    _id: string;
    username: string;
}
export declare class ResponseBookmarkDto {
    _id: Types.ObjectId;
    pageNumber: number;
    note: string;
    document: DocumentInfo;
    user: userInfo;
}
