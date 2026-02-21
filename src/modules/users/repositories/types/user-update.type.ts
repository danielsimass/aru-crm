import { RoleType } from '../../enums/role.enum';

export interface UserUpdateData {
  name?: string;
  email?: string;
  username?: string;
  role?: RoleType;
  isActive?: boolean;
}
