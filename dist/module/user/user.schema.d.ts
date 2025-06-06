import { Document as MongooseDocument, Types } from 'mongoose';
export declare class User {
    username: string;
    password: string;
    email?: string;
}
export type UserDocument = User & MongooseDocument;
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, MongooseDocument<unknown, any, User, any> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<User>, {}> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
