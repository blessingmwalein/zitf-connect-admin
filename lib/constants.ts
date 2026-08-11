import {
  LayoutDashboard,
  Building2,
  MapPin,
  Calendar,
  CalendarRange,
  Landmark,
  BarChart3,
  Settings,
  Users,
  UserCheck,
  Map,
  Puzzle,
  Ticket,
  CreditCard,
  Flame,
  type LucideIcon,
} from "lucide-react";

/* ============================================
   Navigation Items
   ============================================ */

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** "global" = platform-wide page, not tied to one event.
   *  "event" = scoped to whichever fair/show is currently active. */
  section: "global" | "event";
}

export const NAV_ITEMS: NavItem[] = [
  /* ---- GLOBAL (platform-wide, not tied to one event) ---- */
  {
    title: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
    description: "Dashboard overview",
    section: "global",
  },
  {
    title: "Events",
    href: "/events",
    icon: CalendarRange,
    description: "Manage fair/show editions",
    section: "global",
  },
  {
    title: "Venues",
    href: "/venues",
    icon: Landmark,
    description: "Manage venue locations",
    section: "global",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Admin settings",
    section: "global",
  },

  /* ---- EVENT (scoped to the currently active fair/show) ---- */
  {
    title: "Exhibitors",
    href: "/exhibitors",
    icon: Users,
    description: "Manage exhibitors",
    section: "event",
  },
  {
    title: "Visitors",
    href: "/visitors",
    icon: UserCheck,
    description: "Manage visitors",
    section: "event",
  },
  {
    title: "Halls",
    href: "/halls",
    icon: Building2,
    description: "Manage halls",
    section: "event",
  },
  {
    title: "Stands",
    href: "/stands",
    icon: MapPin,
    description: "Manage stands",
    section: "event",
  },
  {
    title: "Stand Features",
    href: "/stands/features",
    icon: Puzzle,
    description: "Manage stand addons & features",
    section: "event",
  },
  {
    title: "Programme",
    href: "/programme",
    icon: Calendar,
    description: "Schedule events",
    section: "event",
  },
  {
    title: "Venue Map",
    href: "/venue-map",
    icon: Map,
    description: "Interactive venue map",
    section: "event",
  },
  {
    title: "Tickets",
    href: "/tickets",
    icon: Ticket,
    description: "Manage ticket types & pricing",
    section: "event",
  },
  {
    title: "Billing",
    href: "/billing",
    icon: CreditCard,
    description: "Orders & payment logs",
    section: "event",
  },
  {
    title: "Heatmap",
    href: "/heatmap",
    icon: Flame,
    description: "Real-time proximity heatmap",
    section: "event",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Reports & analytics",
    section: "event",
  },
];

/* Tab bar items (mobile) - limited to 5.
   Resolved by href/title match (not positional index) so reordering
   NAV_ITEMS above can never silently break the mobile tab bar. */
function requireNavItem(href: string): NavItem {
  const item = NAV_ITEMS.find((navItem) => navItem.href === href);
  if (!item) {
    throw new Error(`TAB_BAR_ITEMS: no NAV_ITEMS entry with href "${href}"`);
  }
  return item;
}

export const TAB_BAR_ITEMS: NavItem[] = [
  requireNavItem("/overview"), // Overview
  requireNavItem("/exhibitors"), // Exhibitors
  requireNavItem("/programme"), // Programme
  requireNavItem("/halls"), // Halls
  requireNavItem("/analytics"), // Analytics
];

/* ============================================
   Roles
   ============================================ */

export type AdminRole = "super_admin" | "admin" | "editor" | "viewer";

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export const ROLE_HIERARCHY: AdminRole[] = [
  "super_admin",
  "admin",
  "editor",
  "viewer",
];

/* ============================================
   Status Configs
   ============================================ */

export type ExhibitorStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "inactive";

export const EXHIBITOR_STATUS_CONFIG: Record<
  ExhibitorStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "bg-ios-orange/15 text-ios-orange" },
  approved: { label: "Approved", color: "bg-ios-blue/15 text-ios-blue" },
  rejected: { label: "Rejected", color: "bg-ios-red/15 text-ios-red" },
  active: { label: "Active", color: "bg-ios-green/15 text-ios-green" },
  inactive: { label: "Inactive", color: "bg-muted text-muted-foreground" },
};

export type StandStatus = "available" | "reserved" | "booked" | "unavailable";

export const STAND_STATUS_CONFIG: Record<
  StandStatus,
  { label: string; color: string }
> = {
  available: { label: "Available", color: "bg-ios-green/15 text-ios-green" },
  reserved: { label: "Reserved", color: "bg-ios-orange/15 text-ios-orange" },
  booked: { label: "Booked", color: "bg-ios-blue/15 text-ios-blue" },
  unavailable: { label: "Unavailable", color: "bg-muted text-muted-foreground" },
};

export type AgendaSessionStatus = "draft" | "published" | "cancelled" | "completed";

export const AGENDA_SESSION_STATUS_CONFIG: Record<
  AgendaSessionStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  published: { label: "Published", color: "bg-ios-green/15 text-ios-green" },
  cancelled: { label: "Cancelled", color: "bg-ios-red/15 text-ios-red" },
  completed: { label: "Completed", color: "bg-ios-blue/15 text-ios-blue" },
};

export type LeadSource = "qr_scan" | "nfc_tap" | "manual" | "app_checkin";

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  qr_scan: "QR Scan",
  nfc_tap: "NFC Tap",
  manual: "Manual",
  app_checkin: "App Check-in",
};

/* ============================================
   Billing / Payment Configs
   ============================================ */

export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "bg-ios-orange/15 text-ios-orange" },
  paid: { label: "Paid", color: "bg-ios-green/15 text-ios-green" },
  failed: { label: "Failed", color: "bg-ios-red/15 text-ios-red" },
  refunded: { label: "Refunded", color: "bg-ios-blue/15 text-ios-blue" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "bg-ios-orange/15 text-ios-orange" },
  paid: { label: "Paid", color: "bg-ios-green/15 text-ios-green" },
  failed: { label: "Failed", color: "bg-ios-red/15 text-ios-red" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  web: "Web (Paynow)",
  ecocash: "EcoCash",
  onemoney: "OneMoney",
};

export type TicketCategory = "visitor" | "exhibitor";

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  visitor: "Visitor",
  exhibitor: "Exhibitor",
};
