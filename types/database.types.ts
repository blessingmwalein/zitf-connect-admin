/* ============================================
   Supabase Database Types
   Normally auto-generated via: npx supabase gen types typescript
   Manually defined for initial scaffold
   ============================================ */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminRole = "super_admin" | "admin" | "editor" | "viewer";
export type StandStatus = "available" | "reserved" | "booked" | "unavailable";
export type LeadSource = "qr_scan" | "nfc_tap" | "manual" | "app_checkin";
export type AgendaSessionStatus = "draft" | "published" | "cancelled" | "completed";
export type EventLifecycleStatus = "draft" | "published" | "active" | "completed" | "cancelled" | "archived";
export type ExhibitorStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "inactive";
export type ExhibitorApplicationStatus =
  | "invited"
  | "applied"
  | "under_review"
  | "approved"
  | "rejected"
  | "withdrawn";
export type ExhibitorPaymentStatus = "unpaid" | "partial" | "paid" | "waived" | "refunded";
export type StandReservationStatus = "pending" | "confirmed" | "expired" | "cancelled";
export type StandAssignmentStatus = "active" | "superseded" | "cancelled";

export interface PolygonPoint {
  x: number;
  y: number;
}

/** Geographic coordinate pair: [latitude, longitude] */
export type GeoPoint = [number, number];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: AdminRole;
          is_active: boolean;
          last_sign_in: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: AdminRole;
          is_active?: boolean;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
          role?: AdminRole;
          is_active?: boolean;
        };
      };
      halls: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          map_url: string | null;
          map_type: string | null;
          display_order: number;
          capacity: number | null;
          is_active: boolean;
          geo_polygon: Json | null;
          geo_center: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          map_url?: string | null;
          map_type?: string | null;
          display_order?: number;
          capacity?: number | null;
          is_active?: boolean;
          geo_polygon?: Json | null;
          geo_center?: Json | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          map_url?: string | null;
          map_type?: string | null;
          display_order?: number;
          capacity?: number | null;
          is_active?: boolean;
          geo_polygon?: Json | null;
          geo_center?: Json | null;
        };
      };
      exhibitors: {
        Row: {
          id: string;
          company_name: string;
          description: string | null;
          contact_person: string;
          contact_email: string;
          contact_phone: string | null;
          website: string | null;
          logo_url: string | null;
          status: ExhibitorStatus;
          country: string | null;
          industry: string | null;
          category_id: number | null;
          hall_id: string | null;
          booth_size: string | null;
          notes: string | null;
          auth_user_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          description?: string | null;
          contact_person: string;
          contact_email: string;
          contact_phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          status?: ExhibitorStatus;
          country?: string | null;
          industry?: string | null;
          category_id?: number | null;
          hall_id?: string | null;
          booth_size?: string | null;
          notes?: string | null;
          auth_user_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          company_name?: string;
          description?: string | null;
          contact_person?: string;
          contact_email?: string;
          contact_phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          status?: ExhibitorStatus;
          country?: string | null;
          industry?: string | null;
          category_id?: number | null;
          hall_id?: string | null;
          booth_size?: string | null;
          notes?: string | null;
          auth_user_id?: string | null;
        };
      };
      stands: {
        // NOTE: exhibitor_id/status were renamed to _deprecated_exhibitor_id/
        // _deprecated_status (multi-event migration phase1c) — a stand's
        // per-event occupancy now lives in stand_assignments/stand_reservations
        // instead, since the same physical stand can have a different (or no)
        // occupant each edition. `price` was renamed to `list_price` (now a
        // suggested default, not authoritative — see stand_reservations/
        // stand_assignments' own price columns).
        Row: {
          id: string;
          hall_id: string;
          _deprecated_exhibitor_id: string | null;
          stand_number: string;
          label: string | null;
          polygon: Json | null;
          geo_polygon: Json | null;
          _deprecated_status: StandStatus;
          area_sqm: number | null;
          list_price: number | null;
          notes: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hall_id: string;
          stand_number: string;
          label?: string | null;
          polygon?: Json | null;
          geo_polygon?: Json | null;
          area_sqm?: number | null;
          list_price?: number | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          hall_id?: string;
          stand_number?: string;
          label?: string | null;
          polygon?: Json | null;
          geo_polygon?: Json | null;
          area_sqm?: number | null;
          list_price?: number | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
      };
      agenda_sessions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          hall_id: string | null;
          start_time: string;
          end_time: string;
          status: AgendaSessionStatus;
          speaker: string | null;
          capacity: number | null;
          image_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          hall_id?: string | null;
          start_time: string;
          end_time: string;
          status?: AgendaSessionStatus;
          speaker?: string | null;
          capacity?: number | null;
          image_url?: string | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          hall_id?: string | null;
          start_time?: string;
          end_time?: string;
          status?: AgendaSessionStatus;
          speaker?: string | null;
          capacity?: number | null;
          image_url?: string | null;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          venue_id: string | null;
          start_date: string;
          end_date: string;
          status: EventLifecycleStatus;
          country: string | null;
          city: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          cover_image_url: string | null;
          logo_url: string | null;
          order_prefix: string;
          timezone: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          venue_id?: string | null;
          start_date: string;
          end_date: string;
          status?: EventLifecycleStatus;
          country?: string | null;
          city?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          cover_image_url?: string | null;
          logo_url?: string | null;
          order_prefix?: string;
          timezone?: string;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          venue_id?: string | null;
          start_date?: string;
          end_date?: string;
          status?: EventLifecycleStatus;
          country?: string | null;
          city?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          cover_image_url?: string | null;
          logo_url?: string | null;
          order_prefix?: string;
          timezone?: string;
        };
      };
      exhibitor_categories: {
        Row: {
          id: number;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          name: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          is_active?: boolean;
        };
      };
      event_halls: {
        Row: {
          event_id: string;
          hall_id: string;
          display_order_override: number | null;
          capacity_override: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          event_id: string;
          hall_id: string;
          display_order_override?: number | null;
          capacity_override?: number | null;
          is_active?: boolean;
        };
        Update: {
          display_order_override?: number | null;
          capacity_override?: number | null;
          is_active?: boolean;
        };
      };
      event_exhibitors: {
        Row: {
          event_id: string;
          exhibitor_id: string;
          application_status: ExhibitorApplicationStatus;
          payment_status: ExhibitorPaymentStatus;
          stand_id: string | null;
          booth_size_requested: string | null;
          notes: string | null;
          applied_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          exhibitor_id: string;
          application_status?: ExhibitorApplicationStatus;
          payment_status?: ExhibitorPaymentStatus;
          booth_size_requested?: string | null;
          notes?: string | null;
          applied_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: {
          application_status?: ExhibitorApplicationStatus;
          payment_status?: ExhibitorPaymentStatus;
          booth_size_requested?: string | null;
          notes?: string | null;
          applied_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
      };
      event_visitors: {
        Row: {
          event_id: string;
          visitor_id: string;
          badge_id: string | null;
          registered_at: string;
          ticket_id: string | null;
          checked_in_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          visitor_id: string;
          badge_id?: string | null;
          registered_at?: string;
          ticket_id?: string | null;
          checked_in_at?: string | null;
        };
        Update: {
          badge_id?: string | null;
          ticket_id?: string | null;
          checked_in_at?: string | null;
        };
      };
      stand_reservations: {
        Row: {
          id: string;
          event_id: string;
          stand_id: string;
          exhibitor_id: string;
          status: StandReservationStatus;
          quoted_price: number;
          requested_by: string | null;
          expires_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          stand_id: string;
          exhibitor_id: string;
          status?: StandReservationStatus;
          quoted_price: number;
          requested_by?: string | null;
          expires_at?: string | null;
          notes?: string | null;
        };
        Update: {
          status?: StandReservationStatus;
          quoted_price?: number;
          expires_at?: string | null;
          notes?: string | null;
        };
      };
      stand_assignments: {
        Row: {
          id: string;
          event_id: string;
          stand_id: string;
          exhibitor_id: string;
          reservation_id: string | null;
          agreed_price: number;
          assigned_by: string | null;
          assigned_at: string;
          unassigned_at: string | null;
          status: StandAssignmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          stand_id: string;
          exhibitor_id: string;
          reservation_id?: string | null;
          agreed_price: number;
          assigned_by?: string | null;
          status?: StandAssignmentStatus;
        };
        Update: {
          status?: StandAssignmentStatus;
          unassigned_at?: string | null;
        };
      };
      visitors: {
        // NOTE: badge_id/registered_at were renamed to
        // _deprecated_badge_id/_deprecated_registered_at (multi-event
        // migration phase1d) — per-edition facts now live on event_visitors.
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          job_title: string | null;
          country: string | null;
          _deprecated_badge_id: string | null;
          _deprecated_registered_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          job_title?: string | null;
          country?: string | null;
        };
        Update: {
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          job_title?: string | null;
          country?: string | null;
        };
      };
      leads: {
        Row: {
          id: string;
          exhibitor_id: string;
          visitor_id: string;
          source: LeadSource;
          notes: string | null;
          is_qualified: boolean;
          captured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          exhibitor_id: string;
          visitor_id: string;
          source?: LeadSource;
          notes?: string | null;
          is_qualified?: boolean;
        };
        Update: {
          source?: LeadSource;
          notes?: string | null;
          is_qualified?: boolean;
        };
      };
      event_attendance: {
        Row: {
          id: string;
          event_id: string;
          visitor_id: string;
          checked_in_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          visitor_id: string;
        };
        Update: Record<string, never>;
      };
      engagement_logs: {
        Row: {
          id: string;
          visitor_id: string;
          exhibitor_id: string | null;
          event_id: string | null;
          action: string;
          metadata: Json;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          exhibitor_id?: string | null;
          event_id?: string | null;
          action: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          metadata?: Json;
        };
      };
      stand_features: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          default_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          default_price?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          default_price?: number;
          is_active?: boolean;
        };
      };
      stand_feature_assignments: {
        Row: {
          id: string;
          stand_id: string;
          feature_id: string;
          custom_price: number | null;
          quantity: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          stand_id: string;
          feature_id: string;
          custom_price?: number | null;
          quantity?: number;
          notes?: string | null;
        };
        Update: {
          custom_price?: number | null;
          quantity?: number;
          notes?: string | null;
        };
      };
      ticket_types: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          price: number;
          currency: string;
          max_quantity: number | null;
          sold_count: number;
          ticket_category: "visitor" | "exhibitor";
          valid_from: string | null;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          price: number;
          currency?: string;
          max_quantity?: number | null;
          sold_count?: number;
          ticket_category: "visitor" | "exhibitor";
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          max_quantity?: number | null;
          sold_count?: number;
          ticket_category?: "visitor" | "exhibitor";
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          event_id: string;
          order_number: string;
          user_id: string | null;
          user_email: string;
          user_type: string;
          total_amount: number;
          currency: string;
          status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          user_email: string;
          user_type?: string;
          total_amount: number;
          currency?: string;
          status?: "pending" | "paid" | "failed" | "refunded" | "cancelled";
        };
        Update: {
          order_number?: string;
          user_email?: string;
          user_type?: string;
          total_amount?: number;
          currency?: string;
          status?: "pending" | "paid" | "failed" | "refunded" | "cancelled";
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          ticket_type_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          ticket_type_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string | null;
          paynow_reference: string | null;
          poll_url: string | null;
          redirect_url: string | null;
          amount: number;
          currency: string;
          payment_method: string;
          status: "pending" | "paid" | "failed" | "cancelled";
          payment_type: string;
          phone_number: string | null;
          instructions: string | null;
          metadata: Json | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          paynow_reference?: string | null;
          poll_url?: string | null;
          redirect_url?: string | null;
          amount: number;
          currency?: string;
          payment_method: string;
          status?: "pending" | "paid" | "failed" | "cancelled";
          payment_type?: string;
          phone_number?: string | null;
          instructions?: string | null;
          metadata?: Json | null;
        };
        Update: {
          paynow_reference?: string | null;
          poll_url?: string | null;
          amount?: number;
          currency?: string;
          payment_method?: string;
          status?: "pending" | "paid" | "failed" | "cancelled";
          paid_at?: string | null;
        };
      };
      tickets: {
        Row: {
          id: string;
          order_id: string;
          order_item_id: string | null;
          ticket_type_id: string;
          holder_name: string | null;
          holder_email: string | null;
          holder_type: string;
          qr_code_data: string | null;
          qr_code_url: string | null;
          is_used: boolean;
          used_at: string | null;
          downloaded: boolean;
          download_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          order_item_id?: string | null;
          ticket_type_id: string;
          holder_name?: string | null;
          holder_email?: string | null;
          holder_type?: string;
          qr_code_data?: string | null;
          qr_code_url?: string | null;
          is_used?: boolean;
          downloaded?: boolean;
          download_count?: number;
        };
        Update: {
          is_used?: boolean;
          used_at?: string | null;
          downloaded?: boolean;
          download_count?: number;
        };
      };
    };
    Views: {
      v_leads_per_exhibitor: {
        Row: {
          exhibitor_id: string;
          company_name: string;
          total_leads: number;
          qualified_leads: number;
          qr_leads: number;
          nfc_leads: number;
          manual_leads: number;
        };
      };
      v_agenda_session_participation: {
        Row: {
          event_id: string;
          event_name: string;
          start_time: string;
          hall_name: string | null;
          attendee_count: number;
          capacity: number | null;
          fill_rate_pct: number | null;
        };
      };
      v_daily_engagement: {
        Row: {
          day: string;
          action: string;
          total_actions: number;
          unique_visitors: number;
        };
      };
    };
    Enums: {
      admin_role: AdminRole;
      stand_status: StandStatus;
      lead_source: LeadSource;
      agenda_session_status: AgendaSessionStatus;
      event_lifecycle_status: EventLifecycleStatus;
      exhibitor_status: ExhibitorStatus;
    };
    Functions: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/* ============================================
   Convenience Type Aliases
   ============================================ */

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Exhibitor = Database["public"]["Tables"]["exhibitors"]["Row"];
export type Hall = Database["public"]["Tables"]["halls"]["Row"];
export type Stand = Database["public"]["Tables"]["stands"]["Row"];
export type AgendaSession = Database["public"]["Tables"]["agenda_sessions"]["Row"];
export type Visitor = Database["public"]["Tables"]["visitors"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type EventAttendance = Database["public"]["Tables"]["event_attendance"]["Row"];
export type EngagementLog = Database["public"]["Tables"]["engagement_logs"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Venue = Database["public"]["Tables"]["venues"]["Row"];
export type ExhibitorCategory = Database["public"]["Tables"]["exhibitor_categories"]["Row"];
export type EventHall = Database["public"]["Tables"]["event_halls"]["Row"];
export type EventExhibitor = Database["public"]["Tables"]["event_exhibitors"]["Row"];
export type EventVisitor = Database["public"]["Tables"]["event_visitors"]["Row"];
export type StandReservation = Database["public"]["Tables"]["stand_reservations"]["Row"];
export type StandAssignment = Database["public"]["Tables"]["stand_assignments"]["Row"];
export type EventExhibitorInsert = Database["public"]["Tables"]["event_exhibitors"]["Insert"];
export type EventExhibitorUpdate = Database["public"]["Tables"]["event_exhibitors"]["Update"];
export type StandReservationInsert = Database["public"]["Tables"]["stand_reservations"]["Insert"];
export type StandAssignmentInsert = Database["public"]["Tables"]["stand_assignments"]["Insert"];

export type ExhibitorInsert = Database["public"]["Tables"]["exhibitors"]["Insert"];
export type ExhibitorUpdate = Database["public"]["Tables"]["exhibitors"]["Update"];
export type HallInsert = Database["public"]["Tables"]["halls"]["Insert"];
export type HallUpdate = Database["public"]["Tables"]["halls"]["Update"];
export type StandInsert = Database["public"]["Tables"]["stands"]["Insert"];
export type StandUpdate = Database["public"]["Tables"]["stands"]["Update"];
export type AgendaSessionInsert = Database["public"]["Tables"]["agenda_sessions"]["Insert"];
export type AgendaSessionUpdate = Database["public"]["Tables"]["agenda_sessions"]["Update"];
export type VisitorInsert = Database["public"]["Tables"]["visitors"]["Insert"];
export type VisitorUpdate = Database["public"]["Tables"]["visitors"]["Update"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
export type VenueInsert = Database["public"]["Tables"]["venues"]["Insert"];
export type VenueUpdate = Database["public"]["Tables"]["venues"]["Update"];
export type ExhibitorCategoryInsert = Database["public"]["Tables"]["exhibitor_categories"]["Insert"];
export type ExhibitorCategoryUpdate = Database["public"]["Tables"]["exhibitor_categories"]["Update"];

export type StandFeature = Database["public"]["Tables"]["stand_features"]["Row"];
export type StandFeatureInsert = Database["public"]["Tables"]["stand_features"]["Insert"];
export type StandFeatureUpdate = Database["public"]["Tables"]["stand_features"]["Update"];
export type StandFeatureAssignment = Database["public"]["Tables"]["stand_feature_assignments"]["Row"];
export type StandFeatureAssignmentInsert = Database["public"]["Tables"]["stand_feature_assignments"]["Insert"];
export type StandFeatureAssignmentUpdate = Database["public"]["Tables"]["stand_feature_assignments"]["Update"];

export type LeadsPerExhibitor = Database["public"]["Views"]["v_leads_per_exhibitor"]["Row"];
export type EventParticipation = Database["public"]["Views"]["v_agenda_session_participation"]["Row"];
export type DailyEngagement = Database["public"]["Views"]["v_daily_engagement"]["Row"];

export type TicketType = Database["public"]["Tables"]["ticket_types"]["Row"];
export type TicketTypeInsert = Database["public"]["Tables"]["ticket_types"]["Insert"];
export type TicketTypeUpdate = Database["public"]["Tables"]["ticket_types"]["Update"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type IssuedTicket = Database["public"]["Tables"]["tickets"]["Row"];
