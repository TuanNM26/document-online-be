import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from '../../module/user/user.schema';
import { MESSAGES } from '../constant/message';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from 'src/module/user/dto/responseUser.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import * as crypto from 'crypto';
import { MailService } from '../../module/mail/mailService';
import { types } from 'util';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { addMinutes } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException(MESSAGES.EMAIL_EXIST);
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationKey = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const createdUser = new this.userModel({
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
      role: new Types.ObjectId('684668708bfa41d5dc6b1547'),
      isActive: false,
      verificationKey,
      verificationExpires,
    });

    const savedUser = await createdUser.save();

    await this.mailService.sendVerificationEmail(
      savedUser.email!,
      verificationKey,
    );

    return plainToInstance(UserResponseDto, savedUser.toObject(), {
      excludeExtraneousValues: true,
    });
  }
  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .populate('role', 'roleName');
    if (!user) {
      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is not verified. Please check your email.',
      );
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(MESSAGES.INVALID_DATA);
    }
    const payload = {
      sub: user._id,
      email: user.email,
      username: user.username,
      role: {
        id: (user.role as any)._id.toString(),
        roleName: user.role.roleName,
      },
    };
    console.log(payload);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'refresh-secret',
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async refreshAccessToken(dto: RefreshTokenDto) {
    const { refreshToken } = dto;
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const accessToken = this.jwtService.sign(
      { sub: payload.sub, username: payload.username },
      {
        expiresIn: '15m',
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );
    return {
      accessToken,
    };
  }

  async verifyAccount(key: string): Promise<string> {
    const user = await this.userModel.findOne({
      verificationKey: key,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn');
    }

    user.isActive = true;
    user.verificationKey = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return 'Tài khoản đã được kích hoạt thành công';
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email });
    if (!user) return;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = addMinutes(new Date(), 15);

    user.resetToken = code;
    user.resetTokenExpiry = expiry;
    await user.save();

    await this.mailService.sendForgotPasswordEmail(user, code);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, newPassword, code } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user || user.resetToken !== code) {
      throw new BadRequestException(
        'Mã xác nhận không đúng hoặc email chưa chính xác',
      );
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Mã xác nhận đã hết hạn');
    }
    if (user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Mã xác nhận đã hết hạn');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
  }
}
