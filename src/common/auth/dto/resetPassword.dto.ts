import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email người dùng' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password mới' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ description: 'code verify' })
  @IsString()
  @Length(6, 6)
  code: string;
}
