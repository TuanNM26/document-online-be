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

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  verificationKey?: string;

  @Prop()
  verificationExpires?: Date;

  @Prop({ nullable: true })
  resetToken?: string;

  @Prop({ nullable: true })
  resetTokenExpiry?: Date;
}

export type UserDocument = User & MongooseDocument;
export const UserSchema = SchemaFactory.createForClass(User);
