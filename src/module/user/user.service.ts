import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/createUser.dto';
import { updateUserDto } from './dto/updateUser.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/responseUser.dto';
import {
  paginate,
  PaginationResult,
} from 'src/common/interface/pagination.interface';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<PaginationResult<UserResponseDto>> {
    const result = await paginate<User>(
      this.userModel,
      page,
      limit,
      {},
      { createdAt: -1 },
    );

    const users = result.data;

    return {
      ...result,
      data: plainToInstance(UserResponseDto, users, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return plainToInstance(UserResponseDto, user.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async updateById(
    id: string,
    updateData: updateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return plainToInstance(UserResponseDto, updatedUser.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
