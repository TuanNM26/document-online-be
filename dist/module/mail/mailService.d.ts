import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../user/user.schema';
export declare class MailService {
    private readonly mailerService;
    constructor(mailerService: MailerService);
    sendVerificationEmail(email: string, key: string): Promise<void>;
    sendForgotPasswordEmail(user: User, code: string): Promise<void>;
}
