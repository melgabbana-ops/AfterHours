import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MaintenanceBootstrap from "./MaintenanceBootstrap";
import { fetchMaintenanceConfig } from "./maintenanceBootstrap";

describe("maintenance bootstrap", () => {
  it("renders the application shell before the optional config request resolves", () => {
    const markup = renderToStaticMarkup(
      <MaintenanceBootstrap>
        {(config) => <main>{config.enabled ? "maintenance" : "app-ready"}</main>}
      </MaintenanceBootstrap>,
    );

    expect(markup).toContain("app-ready");
  });

  it("loads a valid maintenance configuration", async () => {
    const request = vi.fn(async () => new Response(
      JSON.stringify({ enabled: true, messageNL: "Gepland onderhoud" }),
      { status: 200 },
    ));

    await expect(fetchMaintenanceConfig(request as typeof fetch, "/maintenance.json", 100))
      .resolves.toEqual({ enabled: true, messageNL: "Gepland onderhoud" });
  });

  it("fails open for unavailable, invalid, or malformed configuration", async () => {
    const unavailable = vi.fn(async () => new Response("", { status: 503 }));
    const malformed = vi.fn(async () => new Response("not-json", { status: 200 }));

    await expect(fetchMaintenanceConfig(unavailable as typeof fetch, "/maintenance.json", 100))
      .resolves.toEqual({});
    await expect(fetchMaintenanceConfig(malformed as typeof fetch, "/maintenance.json", 100))
      .resolves.toEqual({});
  });

  it("aborts a maintenance request that exceeds its time budget", async () => {
    let signal: AbortSignal | undefined;
    const request = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      signal = init?.signal as AbortSignal | undefined;
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));

    await expect(fetchMaintenanceConfig(request as typeof fetch, "/maintenance.json", 5)).resolves.toEqual({});
    expect(signal?.aborted).toBe(true);
  });
});
