const APP_SHELL_PATTERN = /const\\s+APP_SHELL\\s*=\\s*\\[([\\s\\S]*?)\\];/;

export function extractAppShellPaths(serviceWorkerSource) {
  const match = serviceWorkerSource.match(APP_SHELL_PATTERN);
  if (!match) throw new Error("Could not find the static APP_SHELL array in public/sw.js.");

  const block = match[1];
  const calls = [...block.matchAll(/\\basset\\s*\\(/g)];
  const literalCalls = [...block.matchAll(/\\basset\\s*\\(\\s*(?:"([^"]*)"|'([^']*)')\\s*\\)/g)];
  if (calls.length !== literalCalls.length) {
    throw new Error("Every APP_SHELL asset() entry must use a static quoted path.");
  }

  return literalCalls.map(([, doubleQuoted, singleQuoted]) => doubleQuoted ?? singleQuoted);
}

export function resolveAppShellFile(path) {
  if (path === "") return "index.html";
  if (typeof path !== "string" || path.startsWith("/") || path.includes("\\\\")) {
    throw new Error(`APP_SHELL path must be relative to the app base: ${String(path)}`);
  }

  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`APP_SHELL path contains an unsafe segment: ${path}`);
  }

  return `public/${path}`;
}

export function inspectAppShell(serviceWorkerSource, fileExists) {
  const paths = extractAppShellPaths(serviceWorkerSource);
  const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
  const files = paths.map(resolveAppShellFile);
  const missing = files.filter((file) => !fileExists(file));

  return { paths, files, duplicates: [...new Set(duplicates)], missing };
}
