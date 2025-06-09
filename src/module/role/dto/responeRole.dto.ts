import { Expose } from 'class-transformer';

export class ResponseRoleDto {
  @Expose()
  id: string;

  @Expose()
  roleName: string;

  @Expose()
  description: string;
}
