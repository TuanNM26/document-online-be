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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
const class_transformer_1 = require("class-transformer");
const responseUser_dto_1 = require("./dto/responseUser.dto");
const pagination_interface_1 = require("../../common/interface/pagination.interface");
let UserService = class UserService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async findAll(page = 1, limit = 10) {
        const result = await (0, pagination_interface_1.paginate)(this.userModel, page, limit, {}, { createdAt: -1 });
        const users = result.data;
        return {
            ...result,
            data: (0, class_transformer_1.plainToInstance)(responseUser_dto_1.UserResponseDto, users, {
                excludeExtraneousValues: true,
            }),
        };
    }
    async findById(id) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        return (0, class_transformer_1.plainToInstance)(responseUser_dto_1.UserResponseDto, user.toObject(), {
            excludeExtraneousValues: true,
        });
    }
    async deleteById(id) {
        const result = await this.userModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
    }
    async updateById(id, updateData) {
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!updatedUser) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        return (0, class_transformer_1.plainToInstance)(responseUser_dto_1.UserResponseDto, updatedUser.toObject(), {
            excludeExtraneousValues: true,
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserService);
//# sourceMappingURL=user.service.js.map