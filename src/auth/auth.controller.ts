import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LogInDto } from './dto/login-auth.dto';
import { SignUpDto } from './dto/signup-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password-auth.dto';
import { ResetPasswordDto } from './dto/reset-password-auth.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserWithRefreshTokenPayload } from './entities/user-refresh-payload.entity';
import { UserPayload } from './entities/user-payload.entity';
import { AccessTokenGuard } from './guards/access-token.guard';
import { ResetPasswordTokenGuard } from './guards/reset-password-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() logInDto: LogInDto) {
    return this.authService.login(logInDto.email, logInDto.password);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('logout')
  logout(@CurrentUser() user: UserPayload) {
    return this.authService.logout(user.id);
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@CurrentUser() user: UserWithRefreshTokenPayload) {
    const { id: userId, refreshToken } = user;
    return this.authService.getNewTokens(userId, refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @UseGuards(ResetPasswordTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(
    @CurrentUser() { id: userId }: UserPayload,
    @Body() { newPassword }: ResetPasswordDto,
  ) {
    console.log(userId, newPassword);
    return this.authService.resetPassword(userId, newPassword);
  }
}
