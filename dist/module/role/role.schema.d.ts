import { Document } from 'mongoose';
export declare class Role extends Document {
    roleName: string;
    description?: string;
}
export declare const RoleSchema: import("mongoose").Schema<Role, import("mongoose").Model<Role, any, any, any, Document<unknown, any, Role, any> & Role & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Role, Document<unknown, {}, import("mongoose").FlatRecord<Role>, {}> & import("mongoose").FlatRecord<Role> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
