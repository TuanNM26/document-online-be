import { UserService } from './user.service';
import { User } from './user.schema';
import { updateUserDto } from './dto/updateUser.dto';
import { UserResponseDto } from './dto/responseUser.dto';
import { PaginationResult } from 'src/common/interface/pagination.interface';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getAllUsers(page?: number, limit?: number): Promise<PaginationResult<UserResponseDto>>;
    getUserById(id: string): Promise<Partial<User>>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    updateUser(id: string, updateData: updateUserDto): Promise<UserResponseDto>;
}
