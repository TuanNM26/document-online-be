import { Document as MongooseDocument, Types } from 'mongoose';
export declare class Page {
    documentId: Types.ObjectId;
    pageNumber: number;
    filePath: string;
    fileType: string;
}
export type PageDocument = Page & MongooseDocument;
export declare const PageSchema: import("mongoose").Schema<Page, import("mongoose").Model<Page, any, any, any, MongooseDocument<unknown, any, Page, any> & Page & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Page, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<Page>, {}> & import("mongoose").FlatRecord<Page> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
