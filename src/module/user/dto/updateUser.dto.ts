import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class updateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của người dùng',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'johndoe', description: 'Tên người dùng' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Id of role' })
  @IsString()
  role?: string;
}
