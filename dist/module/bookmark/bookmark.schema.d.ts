import { Document as MongooseDocument, Types } from 'mongoose';
export declare class Bookmark {
    documentId: Types.ObjectId;
    userId: Types.ObjectId;
    pageNumber: number;
    note?: string;
}
export type BookmarkDocument = Bookmark & MongooseDocument;
export declare const BookmarkSchema: import("mongoose").Schema<Bookmark, import("mongoose").Model<Bookmark, any, any, any, MongooseDocument<unknown, any, Bookmark, any> & Bookmark & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Bookmark, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<Bookmark>, {}> & import("mongoose").FlatRecord<Bookmark> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
