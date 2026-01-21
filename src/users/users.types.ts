type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};
