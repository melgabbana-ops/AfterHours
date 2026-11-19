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

  it.each([401, 403, 500])("removes an older cached copy when the server returns non-cacheable HTTP %i", async (status) => {
    const response = makeResponse({ "Cache-Control": "private, no-store" }, false);
    response.status = status;
    const worker = startWorker(response);

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


function startPushWorker(payload) {
  const handlers = new Map();
  const showNotification = vi.fn(async () => undefined);
  const self = {
    location: {
      href: "https://app.example/AfterHours/sw.js",
      origin: "https://app.example",
    },
    addEventListener: (type, handler) => handlers.set(type, handler),
    registration: { showNotification },
    clients: { claim: vi.fn(), matchAll: vi.fn(async () => []), openWindow: vi.fn() },
    skipWaiting: vi.fn(),
  };
  runInNewContext(workerSource, { self, URL });
  let completion;
  handlers.get("push")({
    data: { json: () => payload },
    waitUntil: (promise) => { completion = promise; },
  });
  return { showNotification, complete: () => completion };
}

describe("AFTER HOURS push notification haptics", () => {
  it.each([
    ["message", [70, 40, 70]],
    ["checkin", [70, 45, 110]],
    ["safety", [120, 70, 240, 70, 360]],
  ])("uses the distinct %s vibration pattern", async (kind, expectedPattern) => {
    const worker = startPushWorker({ kind, title: "AFTER HOURS", body: "Test" });

    await worker.complete();

    expect(worker.showNotification).toHaveBeenCalledWith(
      "AFTER HOURS",
      expect.objectContaining({ vibrate: expectedPattern }),
    );
  });

  it("keeps a safe default vibration for older push payloads", async () => {
    const worker = startPushWorker({ title: "AFTER HOURS", body: "Test" });

    await worker.complete();

    expect(worker.showNotification).toHaveBeenCalledWith(
      "AFTER HOURS",
      expect.objectContaining({ vibrate: [70, 40, 70] }),
    );
  });
});



describe("AFTER HOURS push notification navigation safety", () => {
  const home = "https://app.example/AfterHours/";
  const targetFor = async (url) => {
    const worker = startPushWorker({ url });
    await worker.complete();
    return worker.showNotification.mock.calls[0][1].data.url;
  };

  it.each([
    ["root-relative screen link", "/?screen=profile", "https://app.example/AfterHours/?screen=profile"],
    ["already scoped screen link", "/AfterHours/?screen=radio", "https://app.example/AfterHours/?screen=radio"],
    ["same-origin absolute app link", "https://app.example/AfterHours/?screen=game", "https://app.example/AfterHours/?screen=game"],
  ])("keeps the %s inside the GitHub Pages app path", async (_label, input, expected) => {
    await expect(targetFor(input)).resolves.toBe(expected);
  });

  it.each([
    ["external absolute URL", "https://evil.example/path"],
    ["protocol-relative URL", "//evil.example/path"],
    ["root path traversal", "/../../outside"],
    ["scoped path traversal", "/AfterHours/../../outside"],
    ["encoded path traversal", "/AfterHours/%2e%2e/%2e%2e/outside"],
    ["backslash URL separator", "/\\\\evil.example/path"],
    ["script URL", "javascript:alert(1)"],
  ])("falls back to the app home for an unsafe %s", async (_label, input) => {
    await expect(targetFor(input)).resolves.toBe(home);
  });
});


describe("AFTER HOURS offline intro shell", () => {
  it("pre-caches the transparent teaser logo and local cinematic backgrounds", () => {
    expect(workerSource).toContain('const CACHE_NAME = "after-hours-v21"');
    expect(workerSource).toContain('asset("after-hours-brand-logo-transparent.svg")');
    expect(workerSource).toContain('asset("visuals/ah-grand-candlelit-chamber.svg")');
    expect(workerSource).toContain('asset("visuals/ah-cinematic-background.svg")');
    expect(workerSource).toContain('asset("visuals/ah-cinematic-hero.svg")');
    for (const visual of [
      "reference-home.svg",
      "reference-consent.svg",
      "reference-experience.svg",
      "reference-aftercare.svg",
      "reference-completion.svg",
      "reference-tarot.svg",
      "reference-horoscope.svg",
      "reference-radio.svg",
      "reference-profile.svg",
    ]) {
      expect(workerSource).toContain(`asset("visuals/${visual}")`);
    }
  });
});
