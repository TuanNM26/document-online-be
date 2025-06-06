import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @ApiProperty({ description: 'Document Title' })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Document Field' })
  @IsOptional()
  @IsString()
  field: string;

  @ApiProperty({ description: 'Document file path' })
  @IsOptional()
  @IsString()
  filePath: string;
}
