import { describe, expect, it } from "vitest";
import { formatRadioTime, getNextRadioTrackIndex } from "./radioAudio";
describe("radio audio helpers", () => {
  it("formats playback positions safely", () => {
    expect(formatRadioTime(0)).toBe("0:00");
    expect(formatRadioTime(65.9)).toBe("1:05");
    expect(formatRadioTime(Number.NaN)).toBe("0:00");
    expect(formatRadioTime(-3)).toBe("0:00");
  });
  it("advances sequentially and wraps", () => {
    expect(getNextRadioTrackIndex(0, 3)).toBe(1);
    expect(getNextRadioTrackIndex(2, 3)).toBe(0);
    expect(getNextRadioTrackIndex(-1, 3)).toBe(0);
  });
  it("repeats the selected track when repeat-one is enabled", () => {
    expect(getNextRadioTrackIndex(1, 3, { repeatOne: true })).toBe(1);
  });
  it("shuffles to a different track with an injectable random source", () => {
    expect(getNextRadioTrackIndex(1, 4, { shuffle: true }, () => 0)).toBe(0);
    expect(getNextRadioTrackIndex(1, 4, { shuffle: true }, () => 0.99)).toBe(3);
  });
  it("handles empty and one-track playlists", () => {
    expect(getNextRadioTrackIndex(0, 0)).toBe(-1);
    expect(getNextRadioTrackIndex(0, 1, { shuffle: true })).toBe(0);
  });
});
