import { Document as MDocument, Types } from 'mongoose';
export declare class Document {
    title: string;
    field: string;
    filePath: string;
    fileType: string;
    totalPages: number;
    userId: Types.ObjectId;
}
export type DocumentDocument = Document & MDocument;
export declare const DocumentSchema: import("mongoose").Schema<Document, import("mongoose").Model<Document, any, any, any, MDocument<unknown, any, Document, any> & Document & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document, MDocument<unknown, {}, import("mongoose").FlatRecord<Document>, {}> & import("mongoose").FlatRecord<Document> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
