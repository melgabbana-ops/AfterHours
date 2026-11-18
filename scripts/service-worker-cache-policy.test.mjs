import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const workerSource = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function startWorker(response) {
  const handlers = new Map();
  const request = {
    method: "GET",
    mode: "cors",
    url: "https://app.example/AfterHours/private-resource",
  };
  const cache = {
    put: vi.fn(async () => undefined),
    delete: vi.fn(async () => true),
    match: vi.fn(async () => undefined),
  };
  const self = {
    location: {
      href: "https://app.example/AfterHours/sw.js",
      origin: "https://app.example",
    },
    addEventListener: (type, handler) => handlers.set(type, handler),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn(), matchAll: vi.fn(async () => []), openWindow: vi.fn() },
    registration: { showNotification: vi.fn() },
  };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => []),
    delete: vi.fn(async () => true),
  };
  runInNewContext(workerSource, { self, caches, fetch: vi.fn(async () => response), URL });
  const waits = [];
  let responsePromise;
  handlers.get("fetch")({
    request,
    respondWith: (promise) => { responsePromise = promise; },
    waitUntil: (promise) => waits.push(promise),
  });
  return {
    request,
    cache,
    complete: async () => {
      const result = await responsePromise;
      await Promise.all(waits);
      return result;
    },
  };
}

function makeResponse(headers = {}, ok = true) {
  const normalized = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const response = {
    ok,
    headers: { get: (name) => normalized.get(name.toLowerCase()) ?? null },
    clone: () => ({ cloned: true }),
  };
  return response;
}

describe("AFTER HOURS service-worker cache privacy", () => {
  it("caches successful public responses", async () => {
    const worker = startWorker(makeResponse({
      "Cache-Control": "public, max-age=3600",
      Vary: "Accept-Encoding",
    }));

    await worker.complete();

    expect(worker.cache.put).toHaveBeenCalledWith(worker.request, { cloned: true });
    expect(worker.cache.delete).not.toHaveBeenCalled();
  });

  it.each([
    ["private directive", "private, max-age=0"],
    ["no-store directive", "public, no-store"],
    ["combined directives", "max-age=0, private, no-store"],
  ])("does not cache %s and removes an older cached copy", async (_label, cacheControl) => {
    const worker = startWorker(makeResponse({ "Cache-Control": cacheControl }));

    await worker.complete();

    expect(worker.cache.put).not.toHaveBeenCalled();
    expect(worker.cache.delete).toHaveBeenCalledWith(worker.request);
  });

  it("does not cache responses with Vary: *", async () => {
    const worker = startWorker(makeResponse({
      "Cache-Control": "public, max-age=3600",
      Vary: "*",
    }));

    await worker.complete();

    expect(worker.cache.put).not.toHaveBeenCalled();
    expect(worker.cache.delete).toHaveBeenCalledWith(worker.request);
  });
});
