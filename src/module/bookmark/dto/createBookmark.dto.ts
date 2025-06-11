import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookmarkDto {
  @ApiProperty({ description: 'Document ID' })
  @IsNotEmpty()
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Bookmark page id', type: String })
  @IsNotEmpty()
  @IsString()
  pageId: string;

  @ApiPropertyOptional({ description: 'Note for bookmark', type: String })
  @IsOptional()
  @IsString()
  note?: string;
}
