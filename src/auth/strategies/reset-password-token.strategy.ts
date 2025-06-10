import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserPayload } from '../entities/user-payload.entity';

@Injectable()
export class ResetPasswordTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-reset-password',
) {
  constructor(public configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('resetPasswordToken'),
      secretOrKey: configService.getOrThrow('PASSWORD_RESET_TOKEN_SECRET'),
    });
  }

  validate(payload: UserPayload) {
    return payload;
  }
}
