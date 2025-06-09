import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/createRole.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    create(createRoleDto: CreateRoleDto): Promise<import("./role.schema").Role>;
    findAll(): Promise<import("./role.schema").Role[]>;
    findOne(id: string): Promise<import("./role.schema").Role>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<import("./role.schema").Role>;
    remove(id: string): Promise<void>;
}
