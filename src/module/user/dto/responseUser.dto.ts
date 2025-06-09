import { Exclude, Expose, Transform, Type } from 'class-transformer';

class RoleDto {
  @Expose({ name: '_id' })
  @Transform(({ obj }) => obj._id?.toString())
  id: string;

  @Expose()
  roleName: string;
}

@Exclude()
export class UserResponseDto {
  @Expose({ name: '_id' })
  @Transform(({ obj }) => obj._id.toString())
  id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  @Type(() => RoleDto)
  role?: RoleDto;
}
