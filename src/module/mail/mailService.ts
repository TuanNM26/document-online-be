// mail.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../user/user.schema';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, key: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Xác minh tài khoản',
      template: './verify',
      context: {
        key,
      },
    });
  }

  async sendForgotPasswordEmail(user: User, code: string) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Mã xác nhận đặt lại mật khẩu',
      template: 'forgot-password',
      context: {
        name: user.username || user.email,
        code,
      },
    });
  }
}
