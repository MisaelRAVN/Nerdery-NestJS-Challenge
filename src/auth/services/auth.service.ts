import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from '../dto/signup-auth.dto';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '../entities/user-payload.entity';
import { Role } from '../enums/role.enum';
import { MailService } from 'src/common/mail/services/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No user with such email exists', {
        description: 'An account with the provided email does not exist.',
      });
    }
    const passwordsMatch = await this.usersService.comparePassword(
      pass,
      user.password,
    );
    if (!passwordsMatch) {
      throw new UnauthorizedException('Invalid credentials', {
        description: 'Credentials provided are incorrect',
      });
    }

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role.role as Role,
      cartId: user.cart?.id,
    };
    const tokens = this.generateTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async signup(signUpDto: SignUpDto) {
    const user = await this.usersService.create(signUpDto);
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role.role as Role,
      cartId: user.cart?.id,
    };
    const tokens = this.generateTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { ...tokens, user };
  }

  async logout(userId: string) {
    await this.usersService.destroyRefreshToken(userId);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const token = this.jwtService.sign(
        { id: user.id, email, role: user.role.role as Role },
        {
          expiresIn: this.configService.get<string>(
            'PASSWORD_RESET_TOKEN_EXPIRES_IN',
          ),
          secret: this.configService.get<string>('PASSWORD_RESET_TOKEN_SECRET'),
        },
      );
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const resetPasswordUrl = `${frontendUrl}/reset-password?token=${token}`;
      await this.mailService.sendPasswordResetMail(
        user.email,
        resetPasswordUrl,
      );
    }

    return {
      message: 'A password-reset link has been sent to the email you specified',
    };
  }

  async resetPassword(userId: string, newPassword: string) {
    await this.usersService.updatePassword(userId, newPassword);
    return { message: 'Password reset was successful' };
  }

  generateTokens(payload: UserPayload) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN'),
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
    });
    const refreshToken = this.jwtService.sign(
      { ...payload, accessToken },
      {
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      },
    );
    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.usersService.updateRefreshToken(userId, refreshToken);
  }

  async getNewTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied', {
        description: 'Cannot perform action.',
      });
    }
    const tokensMatch = await this.usersService.comparePassword(
      refreshToken,
      user.refreshToken,
    );

    if (!tokensMatch) {
      throw new ForbiddenException('Access denied', {
        description: 'Cannot perform action.',
      });
    }

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role.role as Role,
      cartId: user.cart?.id,
    };

    const tokens = this.generateTokens(payload);
    await this.usersService.updateRefreshToken(user.id, refreshToken);
    return tokens;
  }
}
