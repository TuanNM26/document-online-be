import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop()
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email?: string;
}

export type UserDocument = User & MongooseDocument;
export const UserSchema = SchemaFactory.createForClass(User);
