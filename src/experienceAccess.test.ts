import { describe, expect, it } from "vitest";
import { getGuidedExperienceBlockReason } from "./experienceAccess";

describe("guided experience access", () => {
  const verifiedAccess = {
    consentActive: true,
    supabaseConfigured: true,
    authenticated: true,
    remoteStateVerified: true,
  };

  it("requires explicit consent before any guided game can start", () => {
    expect(getGuidedExperienceBlockReason({ ...verifiedAccess, consentActive: false })).toBe("consent");
  });

  it("prioritizes the consent requirement before account diagnostics", () => {
    expect(getGuidedExperienceBlockReason({
      consentActive: false,
      supabaseConfigured: true,
      authenticated: false,
      remoteStateVerified: false,
    })).toBe("consent");
  });

  it("allows a consented local-only experience without remote infrastructure", () => {
    expect(getGuidedExperienceBlockReason({
      consentActive: true,
      supabaseConfigured: false,
      authenticated: false,
      remoteStateVerified: false,
    })).toBeNull();
  });

  it("requires authentication when Supabase is configured", () => {
    expect(getGuidedExperienceBlockReason({ ...verifiedAccess, authenticated: false })).toBe("account");
  });

  it("requires verified server state before account-backed guided games", () => {
    expect(getGuidedExperienceBlockReason({ ...verifiedAccess, remoteStateVerified: false })).toBe("account");
  });

  it("allows guided games only after consent and account state are verified", () => {
    expect(getGuidedExperienceBlockReason(verifiedAccess)).toBeNull();
  });
});
