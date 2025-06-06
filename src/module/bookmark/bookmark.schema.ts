import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Bookmark {
  @Prop({ type: Types.ObjectId, ref: 'Document', required: true })
  documentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  pageNumber: number;

  @Prop()
  note?: string;
}

export type BookmarkDocument = Bookmark & MongooseDocument;
export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

BookmarkSchema.index(
  { userId: 1, documentId: 1, pageNumber: 1 },
  { unique: true },
);
