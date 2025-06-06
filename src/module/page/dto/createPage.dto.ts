import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({ description: 'DocumentID' })
  @IsNotEmpty()
  @IsString()
  documentId: string;
}
