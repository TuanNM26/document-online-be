import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookmarkDto {
  @ApiProperty({ description: 'Document ID' })
  @IsNotEmpty()
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Bookmark page number', type: Number })
  @IsNotEmpty()
  @IsNumber()
  pageNumber: number;

  @ApiProperty({ description: 'ID of user create bookmark' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Note for bookmark', type: String })
  @IsOptional()
  @IsString()
  note?: string;
}
