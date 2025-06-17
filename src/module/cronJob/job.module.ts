import { Module } from '@nestjs/common';
import { DeleteUnverifiedUsersTask } from './deleteUnverifiedUsers';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [DeleteUnverifiedUsersTask],
  exports: [DeleteUnverifiedUsersTask],
})
export class JobModule {}
