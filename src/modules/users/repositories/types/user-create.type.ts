import { RoleType } from '../../enums/role.enum';

export interface UserCreateData {
  name: string;
  email: string;
  username: string;
  password?: string;
  role: RoleType;
  isActive?: boolean;
}
