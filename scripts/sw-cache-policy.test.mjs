import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const policySource = readFileSync(new URL("../public/sw-cache-policy.js", import.meta.url), "utf8");
const workerSource = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://example.test";
const basePath = "/after-hours/";
const scope = {};
vm.runInNewContext(policySource, { self: scope });
const policy = scope.AFTER_HOURS_SW_CACHE_POLICY;

function request({
  method = "GET",
  mode = "cors",
  destination = "",
  cache = "default",
  authorization = "",
  cacheControl = "",
  pragma = "",
} = {}) {
  const values = { Authorization: authorization, "Cache-Control": cacheControl, Pragma: pragma };
  return {
    method,
    mode,
    destination,
    cache,
    headers: { get: (name) => values[name] || null },
  };
}

const url = (path) => new URL(path, origin);

describe("AFTER HOURS service-worker cache privacy boundary", () => {
  it("allows only the clean app-shell navigation for offline fallback", () => {
    expect(policy.shouldCacheRequest(request({ mode: "navigate", destination: "document" }), url(basePath), basePath, origin)).toBe(true);
    expect(policy.shouldCacheRequest(request({ mode: "navigate", destination: "document" }), url(basePath + "index.html"), basePath, origin)).toBe(true);
    expect(policy.shouldCacheRequest(request({ mode: "navigate", destination: "document" }), url(basePath + "?invite=secret"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ mode: "navigate", destination: "document" }), url(basePath + "invite/secret"), basePath, origin)).toBe(false);
  });

  it("allows static Vite bundles but not arbitrary same-origin fetches", () => {
    for (const destination of ["script", "style", "font", "image"]) {
      expect(policy.shouldCacheRequest(request({ destination }), url(basePath + "assets/app-123.js"), basePath, origin)).toBe(true);
    }
    expect(policy.shouldCacheRequest(request(), url(basePath + "api/profile"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request(), url(basePath + "private/media.json"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ destination: "image" }), url(basePath + "private/photo.jpg"), basePath, origin)).toBe(false);
  });

  it("rejects cross-origin, out-of-scope, query-bearing and authenticated requests", () => {
    expect(policy.shouldCacheRequest(request({ destination: "script" }), url("https://cdn.example.test/after-hours/assets/app.js"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ destination: "script" }), url("/assets/app.js"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ destination: "script" }), url(basePath + "assets/app.js?v=2"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ destination: "script", authorization: "Bearer secret" }), url(basePath + "assets/app.js"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ destination: "script", cacheControl: "private, no-store" }), url(basePath + "assets/app.js"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ destination: "script", pragma: "no-cache" }), url(basePath + "assets/app.js"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ destination: "script", cache: "reload" }), url(basePath + "assets/app.js"), basePath, origin)).toBe(false);
    expect(policy.shouldCacheRequest(request({ method: "POST", destination: "script" }), url(basePath + "assets/app.js"), basePath, origin)).toBe(false);
  });

  it("keeps response-level private and revalidation directives out of Cache API", () => {
    const response = (cacheControl = "", vary = "") => ({
      ok: true,
      headers: { get: (name) => name === "Cache-Control" ? cacheControl : name === "Vary" ? vary : null },
    });
    expect(policy.shouldCacheResponse(response("public, max-age=31536000"))).toBe(true);
    for (const directive of ["private", "no-store", "no-cache", "must-revalidate", "max-age=0"]) {
      expect(policy.shouldCacheResponse(response(directive))).toBe(false);
    }
    expect(policy.shouldCacheResponse(response("", "*"))).toBe(false);
    expect(policy.shouldCacheResponse({ ok: false, headers: response().headers })).toBe(false);
  });

  it("loads the tested policy and invalidates the previous broad cache version", () => {
    expect(workerSource).toContain('importScripts(asset("sw-cache-policy.js"))');
    expect(workerSource).toContain("shouldCacheRequest(request, url, BASE_PATH, self.location.origin)");
    expect(workerSource).toContain('const CACHE_NAME = "after-hours-v23"');
    expect(workerSource).toContain('asset("sw-cache-policy.js")');
  });
});
