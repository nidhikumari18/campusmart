
import { create } from "zustand";
import { authAPI } from "../api/auth";

export const useAuth = create((set) => ({
  user: null,
  loading: true,
  error: null,

  // Restore login session when page refreshes
  checkAuth: async () => {
    set({ loading: true });

    try {
      const data = await authAPI.me();

      set({
        user: data.user,
        loading: false,
        error: null,
      });

      return data.user;
    } catch (error) {
      console.error("Session check failed:", error);

      set({
        user: null,
        loading: false,
        error: error.message,
      });

      return null;
    }
  },

  // Create account
  register: async (form) => {
    set({ error: null });

    try {
      const data = await authAPI.register(form);

      set({
        user: data.user,
        error: null,
      });

      return data.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Login
  login: async (form) => {
    set({ error: null });

    try {
      const data = await authAPI.login(form);

      set({
        user: data.user,
        error: null,
      });

      return data.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await authAPI.logout();
    } finally {
      set({
        user: null,
        error: null,
      });
    }
  },
}));
