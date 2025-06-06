import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Page {
  @Prop({ type: Types.ObjectId, ref: 'Document', required: true })
  documentId: Types.ObjectId;

  @Prop({ required: true })
  pageNumber: number;

  @Prop({ required: true })
  filePath: string;

  @Prop()
  fileType: string;
}

export type PageDocument = Page & MongooseDocument;
export const PageSchema = SchemaFactory.createForClass(Page);

PageSchema.index({ documentId: 1, pageNumber: 1 }, { unique: true });
