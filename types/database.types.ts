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
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type ExhibitorStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "inactive";

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
          booth_size: string | null;
          notes: string | null;
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
          booth_size?: string | null;
          notes?: string | null;
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
          booth_size?: string | null;
          notes?: string | null;
        };
      };
      stands: {
        Row: {
          id: string;
          hall_id: string;
          exhibitor_id: string | null;
          stand_number: string;
          label: string | null;
          polygon: Json | null;
          geo_polygon: Json | null;
          status: StandStatus;
          area_sqm: number | null;
          price: number | null;
          notes: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hall_id: string;
          exhibitor_id?: string | null;
          stand_number: string;
          label?: string | null;
          polygon?: Json | null;
          geo_polygon?: Json | null;
          status?: StandStatus;
          area_sqm?: number | null;
          price?: number | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          hall_id?: string;
          exhibitor_id?: string | null;
          stand_number?: string;
          label?: string | null;
          polygon?: Json | null;
          geo_polygon?: Json | null;
          status?: StandStatus;
          area_sqm?: number | null;
          price?: number | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          hall_id: string | null;
          start_time: string;
          end_time: string;
          status: EventStatus;
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
          status?: EventStatus;
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
          status?: EventStatus;
          speaker?: string | null;
          capacity?: number | null;
          image_url?: string | null;
        };
      };
      visitors: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          job_title: string | null;
          country: string | null;
          badge_id: string | null;
          registered_at: string;
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
          badge_id?: string | null;
        };
        Update: {
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          job_title?: string | null;
          country?: string | null;
          badge_id?: string | null;
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
      v_event_participation: {
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
      event_status: EventStatus;
      exhibitor_status: ExhibitorStatus;
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
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Visitor = Database["public"]["Tables"]["visitors"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type EventAttendance = Database["public"]["Tables"]["event_attendance"]["Row"];
export type EngagementLog = Database["public"]["Tables"]["engagement_logs"]["Row"];

export type ExhibitorInsert = Database["public"]["Tables"]["exhibitors"]["Insert"];
export type ExhibitorUpdate = Database["public"]["Tables"]["exhibitors"]["Update"];
export type HallInsert = Database["public"]["Tables"]["halls"]["Insert"];
export type HallUpdate = Database["public"]["Tables"]["halls"]["Update"];
export type StandInsert = Database["public"]["Tables"]["stands"]["Insert"];
export type StandUpdate = Database["public"]["Tables"]["stands"]["Update"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type LeadsPerExhibitor = Database["public"]["Views"]["v_leads_per_exhibitor"]["Row"];
export type EventParticipation = Database["public"]["Views"]["v_event_participation"]["Row"];
export type DailyEngagement = Database["public"]["Views"]["v_daily_engagement"]["Row"];
