import { AuthGuard } from '@nestjs/passport';

export class ResetPasswordTokenGuard extends AuthGuard('jwt-reset-password') {}
