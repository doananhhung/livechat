import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  RegisterResponseDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from "@live-chat/shared-dtos";
import type { User } from "@live-chat/shared-types";

// ========================================================================
// API FUNCTIONS
// ========================================================================

const loginUser = async (credentials: LoginDto): Promise<AuthResponseDto> => {
  const { data } = await api.post<AuthResponseDto>("/auth/login", credentials);
  return data;
};

const registerUser = async (
  userData: RegisterDto
): Promise<RegisterResponseDto> => {
  const { data } = await api.post<RegisterResponseDto>(
    "/auth/register",
    userData
  );
  return data;
};

/**
 * Verifies a user's email using the token from the verification email.
 * @param token - The verification token from the email link
 * @returns {Promise<{ message: string; invitationToken?: string }>} Success message and optional invitation token
 */
export const verifyEmail = async (
  token: string
): Promise<{ message: string; invitationToken?: string }> => {
  const { data } = await api.get<{
    message: string;
    invitationToken?: string;
  }>(`/auth/verify-email?token=${token}`);
  return data;
};

/**
 * Resends the verification email to the user.
 * @param email - The user's email address
 * @returns {Promise<{ message: string }>} Success message
 */
export const resendVerificationEmail = async (
  email: string
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>(
    "/auth/resend-verification",
    { email }
  );
  return data;
};

// --- NEW FUNCTION ---
/**
 * Sends the 2FA code to the backend for authentication and to complete login.
 * @param code - The 6-digit code from the authenticator app.
 * @returns {Promise<AuthResponseDto>} Full user data and access token.
 */
export const verify2FA = async (code: string): Promise<AuthResponseDto> => {
  const { data } = await api.post<AuthResponseDto>("/2fa/authenticate", {
    code,
  });
  return data;
};

export const exchangeCodeForToken = async (
  code: string
): Promise<AuthResponseDto> => {
  const { data } = await api.post<AuthResponseDto>("/auth/exchange-code", {
    code,
  });
  return data;
};

/**
 * Sends a password reset email to the user.
 * @param email - The user's email address
 * @returns {Promise<{ message: string; isOAuthUser?: boolean }>} Success message and OAuth status
 */
export const forgotPassword = async (
  email: string
): Promise<{ message: string; isOAuthUser?: boolean }> => {
  const { data } = await api.post<{ message: string; isOAuthUser?: boolean }>(
    "/auth/forgot-password",
    { email }
  );
  return data;
};

/**
 * Resets the user's password using the token from the reset email.
 * @param token - The reset token from the email link
 * @param newPassword - The new password
 * @returns {Promise<{ message: string }>} Success message
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>("/auth/reset-password", {
    token,
    newPassword,
  });
  return data;
};

// ========================================================================
// CUSTOM HOOKS
// ========================================================================

export const useExchangeCodeForTokenMutation = (
  options?: Omit<
    UseMutationOptions<AuthResponseDto, Error, string>,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: exchangeCodeForToken,
    ...options,
  });
};

export const useLoginMutation = (
  options?: Omit<
    UseMutationOptions<AuthResponseDto, Error, LoginDto>,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: loginUser,
    ...options,
  });
};

export const useRegisterMutation = (
  options?: Omit<
    UseMutationOptions<RegisterResponseDto, Error, RegisterDto>,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: registerUser,
    ...options,
  });
};

export const useForgotPasswordMutation = (
  options?: Omit<
    UseMutationOptions<
      { message: string; isOAuthUser?: boolean },
      Error,
      string
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: forgotPassword,
    ...options,
  });
};

export const useResetPasswordMutation = (
  options?: Omit<
    UseMutationOptions<
      { message: string },
      Error,
      { token: string; newPassword: string }
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: ({ token, newPassword }) => resetPassword(token, newPassword),
    ...options,
  });
};
