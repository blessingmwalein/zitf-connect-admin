import {
  LayoutDashboard,
  Building2,
  MapPin,
  Calendar,
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
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
    description: "Dashboard overview",
  },
  {
    title: "Exhibitors",
    href: "/exhibitors",
    icon: Users,
    description: "Manage exhibitors",
  },
  {
    title: "Visitors",
    href: "/visitors",
    icon: UserCheck,
    description: "Manage visitors",
  },
  {
    title: "Halls",
    href: "/halls",
    icon: Building2,
    description: "Manage halls",
  },
  {
    title: "Stands",
    href: "/stands",
    icon: MapPin,
    description: "Manage stands",
  },
  {
    title: "Stand Features",
    href: "/stands/features",
    icon: Puzzle,
    description: "Manage stand addons & features",
  },
  {
    title: "Events",
    href: "/events",
    icon: Calendar,
    description: "Schedule events",
  },
  {
    title: "Venue Map",
    href: "/venue-map",
    icon: Map,
    description: "Interactive venue map",
  },
  {
    title: "Tickets",
    href: "/tickets",
    icon: Ticket,
    description: "Manage ticket types & pricing",
  },
  {
    title: "Billing",
    href: "/billing",
    icon: CreditCard,
    description: "Orders & payment logs",
  },
  {
    title: "Heatmap",
    href: "/heatmap",
    icon: Flame,
    description: "Real-time proximity heatmap",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Reports & analytics",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Admin settings",
  },
];

/* Tab bar items (mobile) - limited to 5 */
export const TAB_BAR_ITEMS: NavItem[] = [
  NAV_ITEMS[0], // Overview
  NAV_ITEMS[1], // Exhibitors
  NAV_ITEMS[6], // Events
  NAV_ITEMS[3], // Halls
  NAV_ITEMS[8], // Analytics
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

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export const EVENT_STATUS_CONFIG: Record<
  EventStatus,
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
