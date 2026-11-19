/** True only when the click lands on the notification backdrop itself. */
export function isNotificationBackdropClick(target: EventTarget | null, currentTarget: EventTarget | null): boolean {
  return target === currentTarget;
}
