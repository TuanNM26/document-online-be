import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './role.schema';
import { CreateRoleDto } from './dto/createRole.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { plainToInstance } from 'class-transformer';
import { ResponseRoleDto } from './dto/responeRole.dto';

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const createdRole = new this.roleModel(createRoleDto);
    return createdRole.save();
  }

  async findAll(): Promise<ResponseRoleDto[]> {
    const roles = await this.roleModel.find().exec();
    return plainToInstance(
      ResponseRoleDto,
      roles.map((role) => ({
        id: role.id.toString(),
        roleName: role.roleName,
        description: role.description,
      })),
    );
  }

  async findOne(id: string): Promise<ResponseRoleDto> {
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return plainToInstance(ResponseRoleDto, {
      id: role.id.toString(),
      roleName: role.roleName,
      description: role.description,
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .exec();

    if (!updatedRole) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return updatedRole;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.roleModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
  }
}
