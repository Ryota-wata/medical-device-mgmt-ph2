import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/lib/types/user';

interface UserStoreState {
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      users: [],

      setUsers: (users) => set({ users }),

      addUser: (user) => set((state) => ({
        users: [...state.users, user]
      })),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map((user) =>
          user.id === id
            ? { ...user, ...updates, updatedAt: new Date().toISOString() }
            : user
        )
      })),

      deleteUser: (id) => set((state) => ({
        users: state.users.filter((user) => user.id !== id)
      })),

      getUserById: (id) => get().users.find((user) => user.id === id),
    }),
    {
      name: 'user-storage',
    }
  )
);
