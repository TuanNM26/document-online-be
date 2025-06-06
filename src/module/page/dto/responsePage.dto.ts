import { Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class DocumentDto {
  @Expose()
  @Type(() => String)
  _id: Types.ObjectId;

  @Expose()
  title: string;

  @Expose()
  field: string;
}

export class ResponsePageDto {
  @Expose()
  @Type(() => String)
  _id: Types.ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.documentId)
  @Type(() => DocumentDto)
  document: DocumentDto;

  @Expose()
  pageNumber: number;

  @Expose()
  filePath: string;

  @Expose()
  fileType: 'text' | 'excel' | 'pdf';
}


