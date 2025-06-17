import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../module/user/user.schema';

@Injectable()
export class DeleteUnverifiedUsersTask {
  private readonly logger = new Logger(DeleteUnverifiedUsersTask.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // @Cron(CronExpression.EVERY_5_MINUTES)
  @Cron('0 8 * * *')
  async handleCron() {
    const expiredUsers = await this.userModel.find({
      isActive: false,
      verificationExpires: { $lt: new Date() },
    });
    if (expiredUsers.length > 0) {
      const idsToDelete = expiredUsers.map((user) => user._id);
      await this.userModel.deleteMany({ _id: { $in: idsToDelete } });
    }
  }
}
