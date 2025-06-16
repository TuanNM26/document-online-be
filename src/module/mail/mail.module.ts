import { Module } from '@nestjs/common';
import { MailService } from './mailService';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
