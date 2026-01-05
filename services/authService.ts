import { User } from "../types";

const USERS_KEY = 'decyra_users';
const CURRENT_USER_KEY = 'decyra_current_user';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Simple mock auth (in production, never store passwords in plain text or localStorage)
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error("Credenciales incorrectas");
    }

    const { password: _, ...safeUser } = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];

    if (users.find((u: any) => u.email === email)) {
      throw new Error("El usuario ya existe");
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password // Mock only
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password: _, ...safeUser } = newUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
};