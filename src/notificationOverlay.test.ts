import { describe, expect, it } from "vitest";
import { isNotificationBackdropClick } from "./notificationOverlay";

describe("notification overlay backdrop clicks", () => {
  it("closes when the backdrop itself is clicked", () => {
    const backdrop = new EventTarget();
    expect(isNotificationBackdropClick(backdrop, backdrop)).toBe(true);
  });

  it("does not close when a click bubbles from the notification button", () => {
    const backdrop = new EventTarget();
    const button = new EventTarget();
    expect(isNotificationBackdropClick(button, backdrop)).toBe(false);
  });

  it("does not treat a missing target as a backdrop click", () => {
    const backdrop = new EventTarget();
    expect(isNotificationBackdropClick(null, backdrop)).toBe(false);
  });
});
