import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePageDto {
  @ApiProperty({ description: 'File path' })
  @IsOptional()
  @IsString()
  filePath?: string;
}
