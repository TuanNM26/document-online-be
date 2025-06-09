import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique name of the role',
    example: 'admin',
  })
  @IsString()
  roleName: string;

  @ApiProperty({
    description: 'Array of permissions assigned to the role',
    type: [String],
    example: ['create_user', 'delete_document'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({
    description: 'Description of the role',
    example: 'System administrator role with full permissions',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
