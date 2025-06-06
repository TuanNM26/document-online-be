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
  userId?: string;

  @Expose()
  filePath: string;

  @Expose()
  fileType: string;

  @Expose()
  totalPages: number;
}
