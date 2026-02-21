import { RoleType } from 'src/modules/users/enums/role.enum';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  username: string;
  role: RoleType;
  iat?: number;
  exp?: number;
}
