// Runtime caching is intentionally limited to public application resources.
// Do not broaden this to arbitrary same-origin fetches: cookies may authenticate
// requests even when no Authorization header is present.
(function attachAfterHoursCachePolicy(scope) {
  const BUNDLE_DESTINATIONS = new Set(["script", "style", "font", "image"]);

  function shouldCacheRequest(request, url, basePath, origin) {
    if (!request || request.method !== "GET" || !url) return false;
    if (url.origin !== origin || !url.pathname.startsWith(basePath) || url.search) return false;
    if (request.headers?.get("Authorization")) return false;

    const cacheControl = request.headers?.get("Cache-Control") || "";
    const pragma = request.headers?.get("Pragma") || "";
    if (/(?:^|,)\s*(?:no-store|no-cache)\b/i.test(cacheControl)) return false;
    if (/\bno-cache\b/i.test(pragma)) return false;
    if (["no-store", "no-cache", "reload"].includes(request.cache)) return false;

    if (request.mode === "navigate" || request.destination === "document") {
      return url.pathname === basePath || url.pathname === basePath + "index.html";
    }

    return BUNDLE_DESTINATIONS.has(request.destination)
      && url.pathname.startsWith(basePath + "assets/");
  }

  function shouldCacheResponse(response) {
    if (!response || !response.ok) return false;
    const cacheControl = response.headers.get("Cache-Control") || "";
    const directives = cacheControl.split(",").map((directive) => directive.trim().toLowerCase());
    const neverCache = new Set(["no-store", "private", "no-cache", "must-revalidate", "proxy-revalidate"]);
    if (directives.some((directive) => neverCache.has(directive.split("=", 1)[0].trim()))) return false;
    if (directives.some((directive) => /^max-age\s*=\s*"?0"?$/i.test(directive))) return false;
    if ((response.headers.get("Vary") || "").trim() === "*") return false;
    return true;
  }

  scope.AFTER_HOURS_SW_CACHE_POLICY = Object.freeze({ shouldCacheRequest, shouldCacheResponse });
})(self);
