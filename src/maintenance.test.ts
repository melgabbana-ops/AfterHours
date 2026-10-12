import { describe, expect, it } from "vitest";
import { formatMaintenanceDate, getMaintenanceStatus } from "./maintenance";

const starts = Date.parse("2026-10-20T12:00:00.000Z");
const ends = Date.parse("2026-10-20T14:00:00.000Z");

describe("getMaintenanceStatus", () => {
  it("activates maintenance inside a valid scheduled window", () => {
    const result = getMaintenanceStatus({ startsAt: new Date(starts).toISOString(), endsAt: new Date(ends).toISOString() }, starts + 1_000);
    expect(result.active).toBe(true);
    expect(result.warning).toBe(false);
  });

  it("shows the configured advance warning before the start time", () => {
    const result = getMaintenanceStatus({
      startsAt: new Date(starts).toISOString(),
      endsAt: new Date(ends).toISOString(),
      warningMinutes: 30,
      messageNL: "Aangepast onderhoudsbericht"
    }, starts - 15 * 60_000);
    expect(result.active).toBe(false);
    expect(result.warning).toBe(true);
    expect(result.messageNL).toBe("Aangepast onderhoudsbericht");
  });

  it("does not show a warning before the warning window", () => {
    const result = getMaintenanceStatus({
      startsAt: new Date(starts).toISOString(),
      endsAt: new Date(ends).toISOString(),
      warningMinutes: 30
    }, starts - 31 * 60_000);
    expect(result.warning).toBe(false);
  });

  it("supports a schedule with no configured end time", () => {
    const result = getMaintenanceStatus({ startsAt: new Date(starts).toISOString() }, starts + 10_000);
    expect(result.active).toBe(true);
    expect(result.endsAtMs).toBeNull();
  });

  it("rejects an invalid end that precedes the start", () => {
    const result = getMaintenanceStatus({
      startsAt: new Date(starts).toISOString(),
      endsAt: new Date(starts - 1).toISOString(),
      warningMinutes: 30
    }, starts + 1_000);
    expect(result.active).toBe(false);
    expect(result.warning).toBe(false);
  });

  it("lets an explicitly enabled maintenance window override dates", () => {
    const result = getMaintenanceStatus({ enabled: true, startsAt: null, endsAt: null }, starts);
    expect(result.active).toBe(true);
  });

  it("clamps invalid warning intervals and supplies safe default copy", () => {
    const result = getMaintenanceStatus({
      startsAt: new Date(starts).toISOString(),
      warningMinutes: Number.POSITIVE_INFINITY,
      messageEN: "   "
    }, starts - 10_000);
    expect(result.warningMinutes).toBe(30);
    expect(result.messageEN).toContain("Scheduled maintenance");
  });
});

describe("formatMaintenanceDate", () => {
  it("formats a valid date in the selected language", () => {
    expect(formatMaintenanceDate(starts, "nl")).toContain("2026");
    expect(formatMaintenanceDate(starts, "en")).toContain("2026");
  });
});
