import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "./clipboard";

afterEach(() => vi.unstubAllGlobals());

describe("copyTextToClipboard", () => {
  it("returns true when the browser confirms the copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("AFTER HOURS")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("AFTER HOURS");
  });

  it("returns false when clipboard access is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(copyTextToClipboard("AFTER HOURS")).resolves.toBe(false);
  });

  it("returns false when the browser rejects the copy", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard unavailable"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("AFTER HOURS")).resolves.toBe(false);
  });
});
