import { UserRole } from 'src/users/users.types';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    role: UserRole;
  };
}
