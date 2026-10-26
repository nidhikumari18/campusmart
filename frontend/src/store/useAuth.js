
import { create } from "zustand";
import { authAPI } from "../api/auth";

export const useAuth = create((set) => ({
  user: null,
  loading: true,
  error: null,

  checkAuth: async () => {
    set({ loading: true });

    try {
      const data = await authAPI.me();

      set({
        user: data.user,
        loading: false,
        error: null,
      });
    } catch {
      set({
        user: null,
        loading: false,
      });
    }
  },

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

  logout: async () => {
    await authAPI.logout();

    set({
      user: null,
      error: null,
    });
  },
}));
