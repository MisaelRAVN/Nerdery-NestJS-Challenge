import { Role } from '../enums/role.enum';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
  cartId?: string;
}
