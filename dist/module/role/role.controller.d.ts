import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/createRole.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { ResponseRoleDto } from './dto/responeRole.dto';
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    create(createRoleDto: CreateRoleDto): Promise<import("./role.schema").Role>;
    getAllRoles(): Promise<ResponseRoleDto[]>;
    getRole(id: string): Promise<ResponseRoleDto>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<import("./role.schema").Role>;
    remove(id: string): Promise<void>;
}
