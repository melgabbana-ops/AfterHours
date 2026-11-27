import { describe, expect, it, vi } from "vitest";
import { createMediaPreviewUrlRegistry } from "./mediaPreviewUrls";

describe("private media preview URL lifecycle", () => {
  it("releases a preview at most once", () => {
    let nextId = 0;
    const api = {
      createObjectURL: vi.fn(() => `blob:preview-${++nextId}`),
      revokeObjectURL: vi.fn(),
    };
    const registry = createMediaPreviewUrlRegistry(api);
    const url = registry.create(new Blob(["private preview"]));

    expect(registry.size()).toBe(1);
    expect(registry.revoke(url)).toBe(true);
    expect(registry.revoke(url)).toBe(false);
    expect(api.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(url);
    expect(registry.size()).toBe(0);
  });

  it("releases every active preview when the vault is backgrounded or unmounted", () => {
    let nextId = 0;
    const api = {
      createObjectURL: vi.fn(() => `blob:preview-${++nextId}`),
      revokeObjectURL: vi.fn(),
    };
    const registry = createMediaPreviewUrlRegistry(api);
    const first = registry.create(new Blob(["first"]));
    const second = registry.create(new Blob(["second"]));

    registry.revokeAll();
    registry.revokeAll();

    expect(api.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(api.revokeObjectURL).toHaveBeenNthCalledWith(1, first);
    expect(api.revokeObjectURL).toHaveBeenNthCalledWith(2, second);
    expect(registry.size()).toBe(0);
  });

  it("keeps a failed release registered so cleanup can retry", () => {
    const api = {
      createObjectURL: vi.fn(() => "blob:private-preview"),
      revokeObjectURL: vi.fn()
        .mockImplementationOnce(() => { throw new Error("temporary release failure"); })
        .mockImplementation(() => undefined),
    };
    const registry = createMediaPreviewUrlRegistry(api);
    const url = registry.create(new Blob(["private preview"]));

    expect(registry.revoke(url)).toBe(false);
    expect(registry.size()).toBe(1);
    registry.revokeAll();
    expect(api.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(registry.size()).toBe(0);
  });
});
