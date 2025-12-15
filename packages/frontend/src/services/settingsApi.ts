// src/services/settingsApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
  ChangePasswordDto,
  EmailChangeDto,
  UpdateUserDto,
  User,
} from "@social-commerce/shared";

// === TYPES ===
// Define data types for request and response

// Backend data returned when creating QR code
interface Generate2FAResponse {
  qrCodeDataURL: string;
}

// Backend data returned when 2FA is successfully enabled
interface TurnOn2FAResponse {
  message: string;
  recoveryCodes: string[];
}

interface ConnectedPage {
  id: string;
  facebookPageId: string;
  pageName: string;
  createdAt: string;
}

interface ChangePasswordResponse {
  message: string;
  accessToken: string;
}

// === QUERY KEYS ===

export const changePassword = async (
  payload: ChangePasswordDto
): Promise<ChangePasswordResponse> => {
  const response = await api.post("/auth/change-password", payload);
  return response.data;
};

export const requestEmailChange = async (
  payload: EmailChangeDto
): Promise<{ message: string }> => {
  const response = await api.post("/user/request-email-change", payload);
  return response.data;
};

const settingsKeys = {
  profile: ["me"] as const, // Change to 'me' to match other files
  connectedPages: ["connectedPages"] as const,
};

// === API FUNCTIONS ===
// Separate API call logic into individual functions
export const fetchUserProfile = async (): Promise<User> => {
  const response = await api.get("/user/me");
  return response.data;
};

export const updateProfile = async (
  payload: UpdateUserDto
): Promise<User> => {
  const response = await api.patch("/user/me", payload);
  return response.data;
};

export const generate2FASecret = async (): Promise<Generate2FAResponse> => {
  const response = await api.post("/2fa/generate");
  return response.data;
};

export const turnOn2FA = async (code: string): Promise<TurnOn2FAResponse> => {
  const response = await api.post("/2fa/turn-on", { code });
  return response.data;
};

export const disable2FA = async (
  code: string
): Promise<{ message: string }> => {
  const response = await api.post("/2fa/turn-off", { code });
  return response.data;
};

export const fetchConnectedPages = async (): Promise<ConnectedPage[]> => {
  const response = await api.get("/connected-pages");
  return response.data;
};

export const disconnectPage = async (pageId: string): Promise<void> => {
  await api.delete(`/connected-pages/${pageId}`);
};

// === REACT QUERY HOOKS ===
// These hooks will use the API functions above

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: changePassword,
  });
};

export const useRequestEmailChangeMutation = () => {
  return useMutation({
    mutationFn: requestEmailChange,
  });
};

export const useUserProfileQuery = () => {
  return useQuery<User>({
    queryKey: settingsKeys.profile,
    queryFn: fetchUserProfile,
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile });
    },
  });
};

export const useGenerate2faMutation = () => {
  return useMutation<Generate2FAResponse>({
    mutationFn: generate2FASecret,
  });
};

export const useTurnOn2faMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<TurnOn2FAResponse, Error, string>({
    // <TData, TError, TVariables>
    mutationFn: (code: string) => turnOn2FA(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile });
    },
  });
};

export const useDisable2faMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (code: string) => disable2FA(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile });
    },
  });
};

export const useConnectedPagesQuery = () => {
  return useQuery<ConnectedPage[]>({
    queryKey: settingsKeys.connectedPages,
    queryFn: fetchConnectedPages,
  });
};

export const useDisconnectPageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.connectedPages });
    },
  });
};