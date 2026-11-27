import { afterEach, describe, expect, it, vi } from "vitest";
import { createPrivateMediaUrlExpiryTimer, PRIVATE_MEDIA_URL_DISPLAY_MS } from "./privateMediaUrlExpiry";

describe("private media signed URL expiry", () => {
  afterEach(() => vi.useRealTimers());

  it("expires the displayed link before the server-side 60-second limit", () => {
    vi.useFakeTimers();
    const expiry = createPrivateMediaUrlExpiryTimer();
    const onExpire = vi.fn();

    expiry.schedule(onExpire);
    vi.advanceTimersByTime(PRIVATE_MEDIA_URL_DISPLAY_MS - 1);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledOnce();
    expiry.clear();
  });

  it("replaces the previous expiry timer when a new link is opened", () => {
    vi.useFakeTimers();
    const expiry = createPrivateMediaUrlExpiryTimer();
    const first = vi.fn();
    const second = vi.fn();

    expiry.schedule(first);
    vi.advanceTimersByTime(20_000);
    expiry.schedule(second);
    vi.advanceTimersByTime(PRIVATE_MEDIA_URL_DISPLAY_MS - 1);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expiry.clear();
  });

  it("cancels expiry when the private vault clears its link", () => {
    vi.useFakeTimers();
    const expiry = createPrivateMediaUrlExpiryTimer();
    const onExpire = vi.fn();

    expiry.schedule(onExpire);
    expiry.clear();
    vi.advanceTimersByTime(PRIVATE_MEDIA_URL_DISPLAY_MS);

    expect(onExpire).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
