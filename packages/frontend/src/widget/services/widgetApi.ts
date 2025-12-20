// src/widget/services/widgetApi.ts
import type { WidgetSettingsDto } from "@live-chat/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetches the public widget settings for a given project from the backend.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to the widget configuration.
 * @throws An error if the request fails.
 */
export async function getWidgetSettings(
  projectId: string
): Promise<WidgetSettingsDto> {
  const url = `${API_BASE_URL}/public/projects/${projectId}/settings`;

  // Only log in development
  if (import.meta.env.DEV) {
    console.log(`[Widget] Fetching settings for project: ${projectId}`);
  }

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");

      if (import.meta.env.DEV) {
        console.error(
          `[Widget] Failed to fetch settings: ${response.status} ${errorText}`
        );
      }

      if (response.status === 404) {
        throw new Error(
          `Project not found. Please check your project ID: ${projectId}`
        );
      }

      if (response.status >= 500) {
        throw new Error(
          "Server error. Please try again later or contact support."
        );
      }

      throw new Error("Could not retrieve widget configuration.");
    }

    const data: WidgetSettingsDto = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Request timeout. Please check your internet connection."
        );
      }
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching settings.");
  }
}
