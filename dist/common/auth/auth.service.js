"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const user_schema_1 = require("../../module/user/user.schema");
const message_1 = require("../constant/message");
const config_1 = require("@nestjs/config");
const class_transformer_1 = require("class-transformer");
const responseUser_dto_1 = require("../../module/user/dto/responseUser.dto");
let AuthService = class AuthService {
    userModel;
    jwtService;
    configService;
    constructor(userModel, jwtService, configService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerDto) {
        const existingUser = await this.userModel.findOne({
            email: registerDto.email,
        });
        if (existingUser) {
            throw new common_1.ConflictException(message_1.MESSAGES.EMAIL_EXIST);
        }
        const hashedPassword = await bcrypt_1.default.hash(registerDto.password, 10);
        const createdUser = new this.userModel({
            email: registerDto.email,
            username: registerDto.username,
            password: hashedPassword,
            role: registerDto.role,
        });
        const savedUser = await createdUser.save();
        return (0, class_transformer_1.plainToInstance)(responseUser_dto_1.UserResponseDto, savedUser.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async login(dto) {
        const user = await this.userModel
            .findOne({ email: dto.email })
            .populate('role', 'roleName');
        if (!user) {
            throw new common_1.NotFoundException(message_1.MESSAGES.USER_NOT_FOUND);
        }
        const isPasswordValid = await bcrypt_1.default.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException(message_1.MESSAGES.INVALID_DATA);
        }
        const payload = {
            sub: user._id,
            email: user.email,
            username: user.username,
            role: {
                id: user.role._id.toString(),
                roleName: user.role.roleName,
            },
        };
        console.log(payload);
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN') || '1d',
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') ||
                'refresh-secret',
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
        };
    }
    async resetPassword(email, newPassword) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.NotFoundException(message_1.MESSAGES.USER_NOT_FOUND);
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await this.userModel.updateOne({ email }, { password: hashedPassword });
        return { message: message_1.MESSAGES.RESET_PASSWORD_SUCCESS };
    }
    async refreshAccessToken(dto) {
        const { refreshToken } = dto;
        const payload = this.jwtService.verify(refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
        });
        const accessToken = this.jwtService.sign({ sub: payload.sub, username: payload.username }, {
            expiresIn: '15m',
            secret: this.configService.get('JWT_SECRET'),
        });
        return {
            accessToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map