import { describe, expect, it, vi } from "vitest";
import {
  getTeaserVideoMotionSettings,
  subscribeToReducedMotionPreference,
} from "./teaserMotion";

describe("teaser video motion preferences", () => {
  it("keeps the cinematic autoplay for users who allow motion", () => {
    expect(getTeaserVideoMotionSettings(false)).toEqual({
      autoPlay: true,
      loop: true,
      controls: false,
      preload: "metadata",
    });
  });

  it("makes intro playback optional when reduced motion is requested", () => {
    expect(getTeaserVideoMotionSettings(true)).toEqual({
      autoPlay: false,
      loop: false,
      controls: true,
      preload: "none",
    });
  });

  it("reacts to modern MediaQueryList change events and removes the listener", () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      addEventListener: vi.fn((_type: string, callback: (event: MediaQueryListEvent) => void) => {
        listener = callback;
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    const onChange = vi.fn();

    const unsubscribe = subscribeToReducedMotionPreference(mediaQuery, onChange);
    listener?.({ matches: true } as MediaQueryListEvent);
    unsubscribe();

    expect(onChange).toHaveBeenCalledWith(true);
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith("change", listener);
  });

  it("supports the legacy Safari MediaQueryList listener API", () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      addListener: vi.fn((callback: (event: MediaQueryListEvent) => void) => {
        listener = callback;
      }),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList;
    const onChange = vi.fn();

    const unsubscribe = subscribeToReducedMotionPreference(mediaQuery, onChange);
    listener?.({ matches: false } as MediaQueryListEvent);
    unsubscribe();

    expect(onChange).toHaveBeenCalledWith(false);
    expect(mediaQuery.removeListener).toHaveBeenCalledWith(listener);
  });
});
