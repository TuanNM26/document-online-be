import { Model } from 'mongoose';
import { Role } from './role.schema';
import { CreateRoleDto } from './dto/createRole.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { ResponseRoleDto } from './dto/responeRole.dto';
export declare class RoleService {
    private roleModel;
    constructor(roleModel: Model<Role>);
    create(createRoleDto: CreateRoleDto): Promise<Role>;
    findAll(): Promise<ResponseRoleDto[]>;
    findOne(id: string): Promise<ResponseRoleDto>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role>;
    remove(id: string): Promise<void>;
}
