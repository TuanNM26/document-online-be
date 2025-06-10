import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Document {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop()
  field: string;

  @Prop({ unique: true })
  filePath: string;

  @Prop()
  fileType: string;

  @Prop()
  totalPages: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export type DocumentDocument = Document & MDocument;
export const DocumentSchema = SchemaFactory.createForClass(Document);
