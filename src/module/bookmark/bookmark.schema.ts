import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Bookmark {
  @Prop({ type: Types.ObjectId, ref: 'Document', required: true })
  documentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Page', required: true })
  pageId: Types.ObjectId;

  @Prop()
  note?: string;
}

export type BookmarkDocument = Bookmark & MongooseDocument;
export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

BookmarkSchema.index({ userId: 1, documentId: 1, pageId: 1 }, { unique: true });
