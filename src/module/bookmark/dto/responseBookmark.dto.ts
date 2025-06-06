import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class DocumentInfo {
  @Expose()
  _id: string;

  @Expose()
  title: string;

  @Expose()
  field: string;

  @Expose()
  filePath: string;

  @Expose()
  fileType: string;

  @Expose()
  totalPages: number;
}

export class userInfo {
  @Expose()
  _id: string;

  @Expose()
  username: string;
}

export class ResponseBookmarkDto {
  @Expose()
  @Type(() => String)
  _id: Types.ObjectId;

  @Expose()
  pageNumber: number;

  @Expose()
  note: string;

  @Expose()
  @Type(() => DocumentInfo)
  document: DocumentInfo;

  @Expose()
  @Type(() => userInfo)
  user: userInfo;
}
