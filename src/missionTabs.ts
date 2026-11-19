export type MissionTabKey = "daily" | "weekly" | "special";

const MISSION_TABS: readonly MissionTabKey[] = ["daily", "weekly", "special"];

/** Return the next tab for the standard horizontal tablist keyboard controls. */
export function getNextMissionTab(current: MissionTabKey, key: string): MissionTabKey | null {
  const currentIndex = MISSION_TABS.indexOf(current);
  if (currentIndex < 0) return null;

  if (key === "Home") return MISSION_TABS[0];
  if (key === "End") return MISSION_TABS[MISSION_TABS.length - 1];
  if (key === "ArrowRight") return MISSION_TABS[(currentIndex + 1) % MISSION_TABS.length];
  if (key === "ArrowLeft") return MISSION_TABS[(currentIndex - 1 + MISSION_TABS.length) % MISSION_TABS.length];
  return null;
}
