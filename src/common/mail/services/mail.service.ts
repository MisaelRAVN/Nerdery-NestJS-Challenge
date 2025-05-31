import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(sendOptions: ISendMailOptions) {
    await this.mailerService.sendMail(sendOptions);
  }

  async sendPasswordResetMail(receiptEmail: string, resetPasswordUrl: string) {
    await this.sendMail({
      to: receiptEmail,
      subject: 'Password Reset',
      text: `Go to the following link to reset your password: ${resetPasswordUrl}`,
      html: `<b>Go to the following link to reset your password:</b> ${resetPasswordUrl}`,
    });
  }
}
