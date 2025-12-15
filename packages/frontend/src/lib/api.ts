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

// --- Interceptor 1: Log and attach Access Token for each Request ---

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // --- LOGGING ---
    console.groupCollapsed(
      `[API Request] >> ${config.method?.toUpperCase()} ${config.url}`
    );
    console.log("Headers:", config.headers);
    if (config.data) {
      console.log("Body:", config.data);
    }
    console.groupEnd();
    // --- END LOGGING ---

    return config;
  },
  (error) => {
    // --- LOGGING ---
    console.error("[API Request Error]", error);
    // --- END LOGGING ---
    return Promise.reject(error);
  }
);

// --- Interceptor 2: Log and handle Response/Error ---
api.interceptors.response.use(
  (response) => {
    // --- LOGGING ---
    console.groupCollapsed(
      `[API Response] << ${
        response.status
      } ${response.config.method?.toUpperCase()} ${response.config.url}`
    );
    console.log("Data:", response.data);
    console.groupEnd();
    // --- END LOGGING ---

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // --- LOGGING ---
    // Log error before processing
    console.groupCollapsed(
      `[API Error] << ${
        error.response?.status
      } ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`
    );
    console.error("Error Response:", error.response?.data);
    console.error("Original Request:", originalRequest);
    console.groupEnd();
    // --- END LOGGING ---

    // Check if error response exists
    if (!error.response) {
      console.error("❌ No error.response - Network error or CORS issue");
      return Promise.reject(error);
    }

    // Check if originalRequest exists
    if (!originalRequest) {
      console.error("❌ No originalRequest in error.config");
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/2fa/authenticate") ||
      originalRequest.url?.includes("/exchange-code") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout");

    console.log("🔍 [DEBUG] Checking refresh conditions:");
    console.log("  - Status:", error.response?.status);
    console.log("  - Error Code:", error.response?.data?.errorCode);
    console.log("  - Already retried:", originalRequest._retry);
    console.log("  - Is auth endpoint:", isAuthEndpoint);

    // Handle 429 Too Many Requests - Browser rate limiting
    if (error.response?.status === 429) {
      console.warn(
        "⚠️ [RATE LIMIT] 429 Too Many Requests - Browser blocked the request"
      );
      console.warn(
        "⚠️ [RATE LIMIT] This happens during hot-reload when too many requests are sent"
      );
      console.warn(
        "⚠️ [RATE LIMIT] Rejecting without retry to prevent infinite loop"
      );
      return Promise.reject(error);
    }

    console.log(
      "  - Should refresh:",
      error.response?.status === 401 &&
        error.response?.data?.errorCode === "TOKEN_INVALID" &&
        !originalRequest._retry &&
        !isAuthEndpoint
    );

    // Existing refresh token handling logic
    if (
      error.response?.status === 401 &&
      error.response?.data?.errorCode === "TOKEN_INVALID" &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      console.log("🔄 [REFRESH] Detected 401 TOKEN_INVALID error");
      console.log("🔄 [REFRESH] Original request URL:", originalRequest.url);
      console.log("🔄 [REFRESH] isRefreshing:", isRefreshing);
      console.log("🔄 [REFRESH] refreshPromise exists:", !!refreshPromise);

      originalRequest._retry = true;

      // If already refreshing, wait for that refresh to complete
      if (isRefreshing && refreshPromise) {
        console.log(
          "⏳ [REFRESH] Token refresh already in progress. Waiting for completion..."
        );
        try {
          const data = await refreshPromise;
          console.log("✅ [REFRESH] Got refreshed token from queue");
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          console.log(
            "🔄 [REFRESH] Retrying original request with new token..."
          );
          return api(originalRequest);
        } catch (refreshError) {
          console.error(
            "❌ [REFRESH] Refresh failed in queue. Logging out.",
            refreshError
          );
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
      console.log("🚀 [REFRESH] Starting NEW refresh token request...");
      console.log("🚀 [REFRESH] Calling GET /auth/refresh");

      refreshPromise = api
        .get("/auth/refresh")
        .then((response) => {
          console.log("✅ [REFRESH] Refresh request successful!");
          console.log("✅ [REFRESH] Response data:", response.data);
          const newAccessToken = response.data.accessToken;
          useAuthStore.getState().setAccessToken(newAccessToken);
          console.log("✅ [REFRESH] New access token saved to store");
          return { accessToken: newAccessToken };
        })
        .catch((refreshError) => {
          console.error("❌ [REFRESH] Refresh request FAILED!");
          console.error("❌ [REFRESH] Error details:", refreshError);
          console.error(
            "❌ [REFRESH] Error response:",
            refreshError.response?.data
          );
          console.error(
            "❌ [REFRESH] Error status:",
            refreshError.response?.status
          );
          console.log("🚪 [REFRESH] Logging out user...");
          useAuthStore.getState().setState({
            isAuthenticated: false,
            accessToken: null,
            user: null,
          });
          throw refreshError;
        })
        .finally(() => {
          console.log(
            "🏁 [REFRESH] Refresh process completed. Resetting flags."
          );
          isRefreshing = false;
          refreshPromise = null;
        });

      try {
        const data = await refreshPromise;
        console.log("✅ [REFRESH] Got new token from refresh promise");
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        console.log(
          "🔄 [REFRESH] Retrying original request:",
          originalRequest.url
        );
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ [REFRESH] Failed to retry original request");
        return Promise.reject(refreshError);
      }
    }

    console.log(
      "⏭️  [REFRESH] Skipping refresh - conditions not met, rejecting error"
    );
    return Promise.reject(error);
  }
);

export default api;
