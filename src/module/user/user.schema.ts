import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document as MongooseDocument, Types } from 'mongoose';
import { Role } from '../role/role.schema';

@Schema({ timestamps: true })
export class User {
  @Prop()
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
  role: Role;
}

export type UserDocument = User & MongooseDocument;
export const UserSchema = SchemaFactory.createForClass(User);
