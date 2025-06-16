import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserDocument } from '../../module/user/user.schema';
import { ConfigService } from '@nestjs/config';
import { UserResponseDto } from 'src/module/user/dto/responseUser.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { MailService } from '../../module/mail/mailService';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
export declare class AuthService {
    private userModel;
    private readonly jwtService;
    private readonly mailService;
    private readonly configService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService, mailService: MailService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<UserResponseDto>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshAccessToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    verifyAccount(key: string): Promise<string>;
    forgotPassword({ email }: ForgotPasswordDto): Promise<void>;
    resetPassword(dto: ResetPasswordDto): Promise<void>;
}
