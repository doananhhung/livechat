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
      } ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`
    );
    console.error("Error Response:", error.response?.data);
    console.error("Original Request:", originalRequest);
    console.groupEnd();
    // --- END LOGGING ---

    const isAuthEndpoint =
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register") ||
      originalRequest.url.includes("/2fa/authenticate") ||
      originalRequest.url.includes("/exchange-code") ||
      originalRequest.url.includes("/auth/refresh") ||
      originalRequest.url.includes("/auth/logout");

    // Existing refresh token handling logic
    if (
      error.response.status === 401 &&
      error.response.data.errorCode === "TOKEN_INVALID" &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        console.log("Access Token expired. Attempting to refresh...");
        const { data } = await api.get("/auth/refresh");

        useAuthStore.getState().setAccessToken(data.accessToken);
        console.log("Token refreshed successfully.");

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        console.log("Retrying original request...");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token. Logging out.", refreshError);
        useAuthStore.getState().setState({
          isAuthenticated: false,
          accessToken: null,
          user: null,
        });

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
