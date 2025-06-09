import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique name of the role',
    example: 'admin',
  })
  @IsString()
  roleName: string;

  @ApiPropertyOptional({
    description: 'Description of the role',
    example: 'System administrator role with full permissions',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
