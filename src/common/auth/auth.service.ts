import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
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

    const createdUser = new this.userModel({
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
      role: registerDto.roleId,
    });

    const savedUser = await createdUser.save();

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

  async resetPassword(email: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel.updateOne({ email }, { password: hashedPassword });

    return { message: MESSAGES.RESET_PASSWORD_SUCCESS };
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
}
