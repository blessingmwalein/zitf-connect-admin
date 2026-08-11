/**
 * Centralised app branding & configuration.
 *
 * Change these values to rebrand the entire admin dashboard.
 * Every user-visible string that mentions the event or app name
 * should import from here instead of hardcoding.
 */
export const APP_CONFIG = {
  /** Short app name shown in sidebar, tabs, headers */
  appName: "Agric Show",
  /** Full app name for titles and metadata */
  appNameFull: "Zimbabwe Agric Show",
  /** Name with "Connect" suffix for the platform */
  platformName: "Agric Show Connect",
  /** Admin portal label */
  adminName: "Agric Show Admin",
  /** Full legal / formal name */
  eventFullName: "Zimbabwe Agricultural Show",
  /** Short event abbreviation */
  eventAbbrev: "ZAS",
  /** App version */
  version: "1.0",
  /** Organisation / event description */
  description: "Zimbabwe Agricultural Show event management platform",
  /** Venue description for map pages */
  venueLabel: "Agric Show Exhibition Grounds",
  /** Order number prefix */
  orderPrefix: "ZAS",
  /** QR signing secret (must match backend + mobile) */
  qrSigningSecret: "zitf-connect-qr-signing-key-2025",
} as const;

export type AppConfig = typeof APP_CONFIG;

/**
 * Temporary bridging constant for the multi-event migration (see the
 * "Multi-event architecture refactor" plan). Every event-scoped service
 * function defaults to this event when no `eventId` is explicitly passed,
 * so existing pages keep behaving exactly as they do today (there's
 * currently only this one event's data in the database) without needing to
 * be touched before an event-switcher UI exists.
 *
 * Remove every reference to this once the active-event store
 * (`stores/active-event.store.ts`) and its UI (event switcher, `/events`
 * pages) are wired up everywhere — at that point every call site should be
 * passing a real selected event id instead of silently falling back here.
 */
export const DEFAULT_EVENT_ID = "b0000000-0000-0000-0000-000000000001";
