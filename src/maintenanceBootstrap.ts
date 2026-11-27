import type { MaintenanceConfig } from "./maintenance";

export const MAINTENANCE_CONFIG_TIMEOUT_MS = 2_500;

/**
 * Fetches optional maintenance configuration without making the app shell
 * depend on a successful network request. A timeout or invalid response
 * fails open so the safety interface can still render.
 */
export async function fetchMaintenanceConfig(
  request: typeof fetch,
  url: string,
  timeoutMs = MAINTENANCE_CONFIG_TIMEOUT_MS,
): Promise<MaintenanceConfig> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));

  try {
    const response = await request(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return {};

    const value: unknown = await response.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as MaintenanceConfig;
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}
