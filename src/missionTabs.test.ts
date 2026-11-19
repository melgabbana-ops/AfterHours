import { describe, expect, it } from "vitest";
import { getNextMissionTab } from "./missionTabs";

describe("mission category keyboard navigation", () => {
  it("moves right and wraps from the final tab to the first", () => {
    expect(getNextMissionTab("daily", "ArrowRight")).toBe("weekly");
    expect(getNextMissionTab("weekly", "ArrowRight")).toBe("special");
    expect(getNextMissionTab("special", "ArrowRight")).toBe("daily");
  });

  it("moves left and wraps from the first tab to the final tab", () => {
    expect(getNextMissionTab("special", "ArrowLeft")).toBe("weekly");
    expect(getNextMissionTab("weekly", "ArrowLeft")).toBe("daily");
    expect(getNextMissionTab("daily", "ArrowLeft")).toBe("special");
  });

  it("supports Home and End shortcuts", () => {
    expect(getNextMissionTab("weekly", "Home")).toBe("daily");
    expect(getNextMissionTab("daily", "End")).toBe("special");
  });

  it("ignores unrelated keys", () => {
    expect(getNextMissionTab("daily", "Enter")).toBeNull();
    expect(getNextMissionTab("daily", "Tab")).toBeNull();
  });
});
