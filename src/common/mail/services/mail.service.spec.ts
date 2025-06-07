/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { InternalServerErrorException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('MailService', () => {
  let service: MailService;
  let mailerService: DeepMocked<MailerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendMail', () => {
    it('should forward options to MailerService.sendMail', async () => {
      const mailOptions: ISendMailOptions = {
        to: 'test@example.com',
        subject: 'Hello',
        text: 'Test email',
        html: '<h1>Test email</h1>',
      };
      mailerService.sendMail.mockResolvedValueOnce({});
      await service.sendMail(mailOptions);

      expect(mailerService.sendMail).toHaveBeenCalledWith(mailOptions);
    });

    it('should throw InternalServerErrorException if MailerService fails', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP failed'));

      try {
        await service.sendMail({});
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect((error as InternalServerErrorException).message).toEqual(
          'Server could not communicate with mailer service',
        );
      }
    });
  });

  describe('sendPasswordResetMail', () => {
    it('should format password reset message and call sendMail()', async () => {
      const email = 'reset@example.com';
      const url = 'https://reset-link.com/token123';

      const expectedMessage: ISendMailOptions = {
        to: email,
        subject: 'Password Reset',
        text: `Go to the following link to reset your password: ${url}`,
        html: `<b>Go to the following link to reset your password:</b> ${url}`,
      };

      mailerService.sendMail.mockResolvedValueOnce({});

      await service.sendPasswordResetMail(email, url);

      expect(mailerService.sendMail).toHaveBeenCalledWith(expectedMessage);
    });

    it('should propagate error from sendMail()', async () => {
      mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP failed'));

      try {
        await service.sendPasswordResetMail(
          'im-gonna-fail@example.com',
          'https://fail',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect((error as InternalServerErrorException).message).toEqual(
          'Server could not communicate with mailer service',
        );
      }
    });
  });
});
