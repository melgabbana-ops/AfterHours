import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const world = readFileSync(new URL("../src/CinematicWorld.tsx", import.meta.url), "utf8");
const runInvitation = world.slice(
  world.indexOf("async function createRunInvitation"),
  world.indexOf("function dismissIncomingInvitation"),
);
const draftInvitation = world.slice(
  world.indexOf("async function createInvitation"),
  world.indexOf("async function drawSpecificRitualCard"),
);

describe("invitation account isolation", () => {
  it("checks the owner and STOP state before exposing a run invitation", () => {
    expect(runInvitation).toContain("isInvitationOwnerAttemptCurrent");
    expect(runInvitation).toContain("await refreshData(ownerId, isActionCurrent)");
    expect(runInvitation).toContain("if (!isActionCurrent())");
  });

  it("revokes a newly created invitation when its owner or STOP context becomes stale", () => {
    expect(runInvitation).toContain("revokeExperienceInvitation(invitationId, ownerId)");
    expect(runInvitation).toContain("await revokeCreatedInvitation()");
  });

  it("does not share or update a draft after its owner changes", () => {
    expect(draftInvitation).toContain("if (!isOwnerCurrent()) return;");
    expect(draftInvitation).toContain("await navigator.share");
    expect(draftInvitation).toContain("await persist(\"invitation\", key");
  });
});
