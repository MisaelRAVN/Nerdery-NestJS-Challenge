/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../common/mail/services/mail.service';
import {
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: DeepMocked<UsersService>;
  let mockJwtService: DeepMocked<JwtService>;
  let mockConfigService: DeepMocked<ConfigService>;
  let mockMailService: DeepMocked<MailService>;

  beforeEach(async () => {
    mockUsersService = createMock<UsersService>();
    mockJwtService = createMock<JwtService>();
    mockConfigService = createMock<ConfigService>();
    mockMailService = createMock<MailService>();

    mockConfigService.get.mockImplementation((key: string) => {
      const configMap = {
        ACCESS_TOKEN_EXPIRES_IN: '30s',
        REFRESH_TOKEN_EXPIRES_IN: '1h',
        ACCESS_TOKEN_SECRET: 'access-secret',
        REFRESH_TOKEN_SECRET: 'refresh-secret',
        PASSWORD_RESET_TOKEN_SECRET: 'reset-secret',
        PASSWORD_RESET_TOKEN_EXPIRES_IN: '30m',
        FRONTEND_URL: 'https://app.example.com',
      };
      return configMap[key];
    });

    mockJwtService.sign.mockImplementation((payload, options) => {
      const secret = options?.secret ?? '';
      if (secret.includes('access')) return 'access-token';
      if (secret.includes('refresh')) return 'refresh-token';
      return 'reset-token';
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    const user = {
      id: 'user-id-1',
      email: 'john@example.com',
      password: 'hashedPassword',
      role: { role: 'client' },
      cart: { id: 'cart-id-1' },
    };

    it('should return access & refresh tokens when credentials are valid', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValueOnce(user);
      (mockUsersService.comparePassword as jest.Mock).mockResolvedValueOnce(
        true,
      );

      const actual = await service.login('john@example.com', 'plain');

      expect(actual).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-id-1',
        'refresh-token',
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login('no@mail.com', 'password'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw UnauthorizedException if password mismatch', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValueOnce(user);
      (mockUsersService.comparePassword as jest.Mock).mockResolvedValueOnce(
        false,
      );

      await expect(
        service.login('john@example.com', 'wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockUsersService.updateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('signup', () => {
    const dto = {
      email: 'new@mail.com',
      password: 'plain',
      firstName: 'New',
      lastName: 'User',
      phone: '123',
    };

    const newUser = {
      id: 'user-id-2',
      email: dto.email,
      role: { role: 'client' },
      cart: { id: 'cart-id-2' },
    };

    it('should create a user and return both tokens and user', async () => {
      (mockUsersService.create as jest.Mock).mockResolvedValueOnce(newUser);

      const actual = await service.signup(dto);

      expect(actual).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: newUser,
      });
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-id-2',
        'refresh-token',
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token', async () => {
      await service.logout('user-id-1');
      expect(mockUsersService.destroyRefreshToken).toHaveBeenCalledWith(
        'user-id-1',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email when user exists', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValueOnce({
        id: 'user-id-1',
        email: 'j@example.com',
      });

      const resp = await service.forgotPassword('j@example.com');

      expect(resp.message).toEqual(
        'A password-reset link has been sent to the email you specified',
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendPasswordResetMail).toHaveBeenCalledTimes(1);
    });

    it('should silently succeed and NOT send email when user missing', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await service.forgotPassword('no@example.com');

      expect(mockMailService.sendPasswordResetMail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(
        service.resetPassword('bad', 'newPassword'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockJwtService.verify.mockReturnValue({
        userId: 'non-existing-user',
        email: 'hi@example.com',
      });
      mockUsersService.findById.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword('reset-token', 'password'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockUsersService.updatePassword).not.toHaveBeenCalled();
    });

    it('should update password when token valid and user exists', async () => {
      (mockJwtService.verify as jest.Mock).mockReturnValue({
        userId: 'user-id-1',
        email: 'john@example.com',
      });
      (mockUsersService.findById as jest.Mock).mockResolvedValueOnce({
        id: 'user-id-1',
      });

      const msg = await service.resetPassword('reset-token', 'newPassword');

      expect(msg).toEqual({ message: 'Password reset was successful' });
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        'user-id-1',
        'newPassword',
      );
    });
  });

  describe('getNewTokens', () => {
    const user = {
      id: 'user-id-1',
      email: 'john@example.com',
      refreshToken: 'hashed(refresh)',
      role: { role: 'client' },
      cart: { id: 'cart-id-1' },
    };

    it('should return new tokens when refresh token matches', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValueOnce(user);
      (mockUsersService.comparePassword as jest.Mock).mockResolvedValueOnce(
        true,
      );

      const actual = await service.getNewTokens('user-id-1', 'refresh');

      expect(actual).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-id-1',
        'refresh',
      );
    });

    it('should throw ForbiddenException when user missing', async () => {
      mockUsersService.findById.mockResolvedValueOnce(null);

      await expect(
        service.getNewTokens('ghost', 'refresh-token'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockUsersService.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when token mismatch', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValueOnce(user);
      (mockUsersService.comparePassword as jest.Mock).mockResolvedValueOnce(
        false,
      );

      await expect(
        service.getNewTokens('user-id-1', 'bad'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateRefreshToken', () => {
    it('should forward to UsersService', async () => {
      await service.updateRefreshToken('user-id-1', 'refresh-token');
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-id-1',
        'refresh-token',
      );
    });
  });

  describe('generateTokens', () => {
    it('should call JwtService.sign twice and return tokens', () => {
      const tokens = service.generateTokens({
        id: 'user-id-1',
        email: 'john@example.com',
        role: Role.CLIENT,
        cartId: 'cart-id-1',
      });

      expect(tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
