// src/services/settingsApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  ChangePasswordDto,
  SetPasswordDto,
  EmailChangeDto,
  UpdateUserDto,
} from "@live-chat/shared-dtos";
import type { User, UserIdentity } from "@live-chat/shared-types";

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

interface LinkGoogleAccountResponse {
  redirectUrl: string;
}

interface UnlinkOAuthAccountPayload {
  provider: string;
}

// === QUERY KEYS ===

export const changePassword = async (
  payload: ChangePasswordDto
): Promise<ChangePasswordResponse> => {
  const response = await api.post("/auth/change-password", payload);
  return response.data;
};

export const setPassword = async (
  payload: SetPasswordDto
): Promise<ChangePasswordResponse> => {
  const response = await api.post("/auth/set-password", payload);
  return response.data;
};

export const requestEmailChange = async (
  payload: EmailChangeDto
): Promise<{ message: string; warning?: string }> => {
  const response = await api.post("/user/request-email-change", payload);
  return response.data;
};

export const getPendingEmailChange = async (): Promise<{
  newEmail: string;
  expiresAt: string;
} | null> => {
  const response = await api.get("/user/pending-email-change");
  return response.data;
};

export const cancelEmailChange = async (): Promise<{ message: string }> => {
  const response = await api.post("/user/cancel-email-change");
  return response.data;
};

const settingsKeys = {
  profile: ["me"] as const, // Change to 'me' to match other files
  connectedPages: ["connectedPages"] as const,
  linkedAccounts: ["linkedAccounts"] as const,
  pendingEmailChange: ["pendingEmailChange"] as const,
};

// === API FUNCTIONS ===
// Separate API call logic into individual functions
export const fetchUserProfile = async (): Promise<User> => {
  const response = await api.get("/user/me");
  return response.data;
};

export const updateProfile = async (payload: UpdateUserDto): Promise<User> => {
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

// Linked Accounts API functions
export const initiateLinkGoogleAccount =
  async (): Promise<LinkGoogleAccountResponse> => {
    const response = await api.get("/auth/link-google");
    return response.data;
  };

export const unlinkOAuthAccount = async (
  payload: UnlinkOAuthAccountPayload
): Promise<{ message: string }> => {
  const response = await api.post("/auth/unlink-oauth", payload);
  return response.data;
};

export const fetchLinkedAccounts = async (): Promise<UserIdentity[]> => {
  const response = await api.get("/auth/linked-accounts");
  return response.data;
};

// === REACT QUERY HOOKS ===
// These hooks will use the API functions above

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: changePassword,
  });
};

export const useSetPasswordMutation = () => {
  return useMutation({
    mutationFn: setPassword,
  });
};

export const useRequestEmailChangeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestEmailChange,
    onSuccess: () => {
      // Invalidate pending email change query to refresh the status
      queryClient.invalidateQueries({
        queryKey: settingsKeys.pendingEmailChange,
      });
    },
  });
};

export const usePendingEmailChangeQuery = () => {
  return useQuery<{ newEmail: string; expiresAt: string } | null>({
    queryKey: settingsKeys.pendingEmailChange,
    queryFn: getPendingEmailChange,
  });
};

export const useCancelEmailChangeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelEmailChange,
    onSuccess: () => {
      // Invalidate pending email change query to refresh the status
      queryClient.invalidateQueries({
        queryKey: settingsKeys.pendingEmailChange,
      });
    },
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

// Linked Accounts hooks
export const useLinkedAccountsQuery = () => {
  return useQuery<UserIdentity[]>({
    queryKey: settingsKeys.linkedAccounts,
    queryFn: fetchLinkedAccounts,
  });
};

export const useInitiateLinkGoogleMutation = () => {
  return useMutation<LinkGoogleAccountResponse>({
    mutationFn: initiateLinkGoogleAccount,
  });
};

export const useUnlinkOAuthAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, UnlinkOAuthAccountPayload>({
    mutationFn: unlinkOAuthAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.linkedAccounts });
    },
  });
};
