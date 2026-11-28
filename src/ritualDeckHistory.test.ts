import { describe, expect, it } from "vitest";
import { getRitualDrawHistory } from "./ritualDeckHistory";

const draw = (
  record_key: string,
  payload: unknown,
  created_at = "2026-11-28T12:00:00.000Z",
) => ({ record_key, payload, created_at });

describe("Ritual Deck draw history", () => {
  it("shows the newest valid draws first", () => {
    const history = getRitualDrawHistory([
      draw("draw:older", { title: "Older", text: "First prompt", drawnAt: "2026-11-27T10:00:00.000Z" }),
      draw("draw:newer", { title: "Newer", text: "Second prompt", drawnAt: "2026-11-28T10:00:00.000Z" }),
    ]);

    expect(history.map((item) => item.id)).toEqual(["draw:newer", "draw:older"]);
  });

  it("ignores custom cards and unrelated ritual records", () => {
    expect(getRitualDrawHistory([
      draw("card:custom", { title: "My card", text: "A prompt" }),
      draw("ritual:other", { title: "Other", text: "Not a draw" }),
    ])).toEqual([]);
  });

  it("ignores malformed payloads without exposing object values as text", () => {
    expect(getRitualDrawHistory([
      draw("draw:object", { title: { private: true }, text: "Prompt" }),
      draw("draw:null", null),
      draw("draw:array", []),
    ])).toEqual([]);
  });

  it("ignores draws with blank titles or prompts", () => {
    expect(getRitualDrawHistory([
      draw("draw:blank-title", { title: "   ", text: "Prompt" }),
      draw("draw:blank-text", { title: "Title", text: "  " }),
    ])).toEqual([]);
  });

  it("falls back to the saved record timestamp when the draw timestamp is invalid", () => {
    const history = getRitualDrawHistory([
      draw("draw:fallback", { title: "Saved draw", text: "Prompt", drawnAt: "not-a-date" }, "2026-11-28T12:30:00.000Z"),
    ]);

    expect(history[0].drawnAt).toBe("2026-11-28T12:30:00.000Z");
  });

  it("keeps undated entries after dated entries and preserves their relative order", () => {
    const history = getRitualDrawHistory([
      draw("draw:undated-a", { title: "A", text: "Prompt", drawnAt: "invalid" }, ""),
      draw("draw:dated", { title: "Dated", text: "Prompt", drawnAt: "2026-11-28T12:30:00.000Z" }),
      draw("draw:undated-b", { title: "B", text: "Prompt" }, ""),
    ]);

    expect(history.map((item) => item.id)).toEqual(["draw:dated", "draw:undated-a", "draw:undated-b"]);
    expect(history[1].drawnAt).toBe("");
  });
});
