import { Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { updateUserDto } from './dto/updateUser.dto';
import { UserResponseDto } from './dto/responseUser.dto';
import { PaginationResult } from 'src/common/interface/pagination.interface';
export declare class UserService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findAll(page?: number, limit?: number): Promise<PaginationResult<UserResponseDto>>;
    findById(id: string): Promise<UserResponseDto>;
    deleteById(id: string): Promise<void>;
    updateById(id: string, updateData: updateUserDto): Promise<UserResponseDto>;
}
