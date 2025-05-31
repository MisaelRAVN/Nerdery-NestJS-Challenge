import { UserPayload } from './user-payload.entity';

export type UserWithRefreshTokenPayload = UserPayload & {
  refreshToken: string;
};
