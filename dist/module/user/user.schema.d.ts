import mongoose, { Document as MongooseDocument, Types } from 'mongoose';
import { Role } from '../role/role.schema';
export declare class User {
    username: string;
    password: string;
    email?: string;
    role: Role;
    isActive: boolean;
    verificationKey?: string;
    verificationExpires?: Date;
    resetToken?: string;
    resetTokenExpiry?: Date;
}
export type UserDocument = User & MongooseDocument;
export declare const UserSchema: mongoose.Schema<User, mongoose.Model<User, any, any, any, mongoose.Document<unknown, any, User, any> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, User, mongoose.Document<unknown, {}, mongoose.FlatRecord<User>, {}> & mongoose.FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
