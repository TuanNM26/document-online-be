import { Exclude, Expose, Transform } from 'class-transformer';
@Exclude()
export class ResponseDocumentDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string;

  @Expose()
  title: string;

  @Expose()
  field?: string;

  @Expose()
  @Transform(({ obj }) => obj.userId?._id.toString())
  userId?: string;

  @Expose()
  @Transform(({ obj }) => obj.userId?.username)
  username?: string;

  @Expose()
  filePath: string;

  @Expose()
  fileType: string;

  @Expose()
  totalPages: number;
}
