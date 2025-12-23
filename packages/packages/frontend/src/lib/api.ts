
// src/lib/api.ts
import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL;
if (!apiBaseURL) {
  throw new Error("VITE_API_BASE_URL is not defined in environment variables");
}
const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

// --- Refresh Token Management ---
// Prevent multiple simultaneous refresh token requests
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// --- Interceptor 1: Attach Access Token ---

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Interceptor 2: Handle Response/Error ---
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error response exists
    if (!error.response) {
      // Network error or CORS issue
      return Promise.reject(error);
    }

    // Check if originalRequest exists
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/2fa/authenticate") ||
      originalRequest.url?.includes("/exchange-code") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout");

    // Handle 429 Too Many Requests - Browser rate limiting
    if (error.response?.status === 429) {
      return Promise.reject(error);
    }

    // Existing refresh token handling logic
    if (
      error.response?.status === 401 &&
      error.response?.data?.errorCode === "TOKEN_INVALID" &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      // If already refreshing, wait for that refresh to complete
      if (isRefreshing && refreshPromise) {
        try {
          const data = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().setState({
            isAuthenticated: false,
            accessToken: null,
            user: null,
          });
          return Promise.reject(refreshError);
        }
      }

      // Start a new refresh process
      isRefreshing = true;

      refreshPromise = api
        .get("/auth/refresh")
        .then((response) => {
          const newAccessToken = response.data.accessToken;
          useAuthStore.getState().setAccessToken(newAccessToken);
          return { accessToken: newAccessToken };
        })
        .catch((refreshError) => {
          useAuthStore.getState().setState({
            isAuthenticated: false,
            accessToken: null,
            user: null,
          });
          throw refreshError;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });

      try {
        const data = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
