// src/widget/services/widgetApi.ts
import { type WidgetConfig } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log("API_BASE_URL:", API_BASE_URL);
/**
 * Fetches the public widget settings for a given project from the backend.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to the widget configuration.
 * @throws An error if the request fails.
 */
export async function getWidgetSettings(
  projectId: string
): Promise<WidgetConfig> {
  console.log(
    `Fetching settings for projectId: ${projectId} from ${API_BASE_URL}`
  );
  const response = await fetch(
    `${API_BASE_URL}/public/projects/${projectId}/settings`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to fetch widget settings for project ${projectId}: ${response.status} ${errorText}`
    );
    throw new Error("Could not retrieve widget configuration.");
  }

  const data: WidgetConfig = await response.json();
  return data;
}
