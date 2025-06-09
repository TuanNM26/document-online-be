import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './createRole.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Unique name of the role',
    example: 'admin',
  })
  @IsString()
  roleName: string;
}
