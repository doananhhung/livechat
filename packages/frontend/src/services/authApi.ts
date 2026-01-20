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
  ResendVerificationDto,
  ExchangeCodeDto,
  TurnOn2faDto,
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
  userData: RegisterDto,
): Promise<RegisterResponseDto> => {
  const { data } = await api.post<RegisterResponseDto>(
    "/auth/register",
    userData,
  );
  return data;
};

/**
 * Verifies a user's email using the token from the verification email.
 * @param token - The verification token from the email link
 * @returns {Promise<{ message: string; invitationToken?: string }>} Success message and optional invitation token
 */
export const verifyEmail = async (
  token: string,
): Promise<{ message: string; invitationToken?: string }> => {
  const { data } = await api.get<{
    message: string;
    invitationToken?: string;
  }>(`/auth/verify-email?token=${token}`);
  return data;
};

/**
 * Resends the verification email to the user.
 * @param payload - The email address to resend verification to
 * @returns {Promise<{ message: string }>} Success message
 */
export const resendVerificationEmail = async (
  payload: ResendVerificationDto,
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>(
    "/auth/resend-verification",
    payload,
  );
  return data;
};

/**
 * Sends the 2FA code to the backend for authentication and to complete login.
 * @param payload - The 6-digit code from the authenticator app.
 * @returns {Promise<AuthResponseDto>} Full user data and access token.
 */
export const verify2FA = async (
  payload: TurnOn2faDto,
): Promise<AuthResponseDto> => {
  const { data } = await api.post<AuthResponseDto>(
    "/2fa/authenticate",
    payload,
  );
  return data;
};

/**
 * Exchanges a one-time code for an access token.
 * @param payload - The code received from OAuth callback.
 * @returns {Promise<AuthResponseDto>} Full user data and access token.
 */
export const exchangeCodeForToken = async (
  payload: ExchangeCodeDto,
): Promise<AuthResponseDto> => {
  const { data } = await api.post<AuthResponseDto>(
    "/auth/exchange-code",
    payload,
  );
  return data;
};

/**
 * Sends a password reset email to the user.
 * @param payload - The user's email address
 * @returns {Promise<{ message: string; isOAuthUser?: boolean }>} Success message and OAuth status
 */
export const forgotPassword = async (
  payload: ForgotPasswordDto,
): Promise<{ message: string; isOAuthUser?: boolean }> => {
  const { data } = await api.post<{ message: string; isOAuthUser?: boolean }>(
    "/auth/forgot-password",
    payload,
  );
  return data;
};

/**
 * Resets the user's password using the token from the reset email.
 * @param payload - The reset token and new password.
 * @returns {Promise<{ message: string }>} Success message
 */
export const resetPassword = async (
  payload: ResetPasswordDto,
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>(
    "/auth/reset-password",
    payload,
  );
  return data;
};

// ========================================================================
// CUSTOM HOOKS
// ========================================================================

export const useExchangeCodeForTokenMutation = (
  options?: Omit<
    UseMutationOptions<AuthResponseDto, Error, ExchangeCodeDto>,
    "mutationFn"
  >,
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
  >,
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
  >,
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
      ForgotPasswordDto
    >,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: forgotPassword,
    ...options,
  });
};

export const useResetPasswordMutation = (
  options?: Omit<
    UseMutationOptions<{ message: string }, Error, ResetPasswordDto>,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: resetPassword,
    ...options,
  });
};
