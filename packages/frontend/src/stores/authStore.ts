// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import { AxiosError } from "axios";
import { queryClient } from "../lib/queryClient";
import type { User, UserResponse } from "@live-chat/shared-types";

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (userData: UserResponse, token: string) => void;
  logout: () => void;
  setUser: (userData: UserResponse) => void;
  setState: (state: Partial<AuthState>) => void;
  setAuthData: (data: { accessToken: string; user: any }) => void;
  setAccessToken: (token: string | null) => void;
  verifySessionAndFetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (userData, token) =>
        set({ user: userData, accessToken: token, isAuthenticated: true }),

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (error) {
          console.error(
            "Logout API call failed, proceeding with client-side cleanup:",
            error
          );
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false });
          queryClient.clear();
        }
      },
      setState: (state) => set((s) => ({ ...s, ...state })),
      setAuthData: (data) => {
        localStorage.setItem("accessToken", data.accessToken);
        set({
          isAuthenticated: true,
          user: data.user,
          accessToken: data.accessToken,
        });
      },

      setUser: (userData) => set((state) => ({ ...state, user: userData })),
      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: !!token }),

      verifySessionAndFetchUser: async () => {
        try {
          const { data: user } = await api.get<UserResponse>("/user/me");

          if (user && user.id) {
            const accessToken = get().accessToken;

            if (accessToken) {
              get().login(user, accessToken);
              return;
            }
          }

          throw new Error("Invalid session data from server");
        } catch (error) {
          const axiosError = error as AxiosError;
          if (
            axiosError.response?.status === 401 &&
            (axiosError.response?.data as any)?.message ===
              "Two factor authentication required"
          ) {
            return Promise.reject({ requires2FA: true });
          }
          set({ user: null, accessToken: null, isAuthenticated: false });
          queryClient.clear();
          return Promise.reject({ requires2FA: false });
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
