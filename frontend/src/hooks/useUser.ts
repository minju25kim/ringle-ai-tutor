
import { create } from 'zustand';
import { User } from '@/types';

interface UserState {
  currentUser: User;
  setUserId: (userId: string) => void;
}

const B2C_USER: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  customer_type: 'B2C',
};

const B2B_USER: User = {
  id: 'user-2',
  name: 'Jane Smith',
  email: 'jane@company.com',
  customer_type: 'B2B',
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: B2C_USER, // Default user
  setUserId: (userId: string) => {
    if (userId === B2C_USER.id) {
      set({ currentUser: B2C_USER });
    } else if (userId === B2B_USER.id) {
      set({ currentUser: B2B_USER });
    } else {
      // Fallback or error handling for unknown user ID
      console.warn(`Unknown user ID: ${userId}. Defaulting to B2C user.`);
      set({ currentUser: B2C_USER });
    }
  },
}));
