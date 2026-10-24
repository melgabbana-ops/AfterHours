export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
