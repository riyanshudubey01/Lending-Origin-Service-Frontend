import type { LoginRequest, User } from '../../types';
import { storage } from '../../utils/storage';

const MOCK_USERS: User[] = [
  { id: 1, username: 'sales1', role: 'SALES' },
  { id: 2, username: 'credit1', role: 'CREDIT_OFFICER' },
  { id: 3, username: 'disb1', role: 'DISBURSEMENT_OFFICER' },
];

export const authService = {
  async login(credentials: LoginRequest): Promise<User | null> {
    const user = MOCK_USERS.find(
      (member) =>
        member.username.toLowerCase() === credentials.username.trim().toLowerCase() &&
        credentials.password === 'password',
    );

    if (!user) {
      return null;
    }

    storage.set('los_user', user);
    storage.set('los_is_logged_in', true);

    return user;
  },

  getCurrentUser(): User | null {
    return storage.get<User>('los_user');
  },

  isAuthenticated(): boolean {
    return Boolean(storage.get<boolean>('los_is_logged_in'));
  },

  logout(): void {
    storage.remove('los_user');
    storage.remove('los_is_logged_in');
  },
};
