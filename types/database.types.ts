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
      ticket_types: {
        Row: {
          id: string;
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
export type VisitorInsert = Database["public"]["Tables"]["visitors"]["Insert"];
export type VisitorUpdate = Database["public"]["Tables"]["visitors"]["Update"];

export type StandFeature = Database["public"]["Tables"]["stand_features"]["Row"];
export type StandFeatureInsert = Database["public"]["Tables"]["stand_features"]["Insert"];
export type StandFeatureUpdate = Database["public"]["Tables"]["stand_features"]["Update"];
export type StandFeatureAssignment = Database["public"]["Tables"]["stand_feature_assignments"]["Row"];
export type StandFeatureAssignmentInsert = Database["public"]["Tables"]["stand_feature_assignments"]["Insert"];
export type StandFeatureAssignmentUpdate = Database["public"]["Tables"]["stand_feature_assignments"]["Update"];

export type LeadsPerExhibitor = Database["public"]["Views"]["v_leads_per_exhibitor"]["Row"];
export type EventParticipation = Database["public"]["Views"]["v_event_participation"]["Row"];
export type DailyEngagement = Database["public"]["Views"]["v_daily_engagement"]["Row"];

export type TicketType = Database["public"]["Tables"]["ticket_types"]["Row"];
export type TicketTypeInsert = Database["public"]["Tables"]["ticket_types"]["Insert"];
export type TicketTypeUpdate = Database["public"]["Tables"]["ticket_types"]["Update"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type IssuedTicket = Database["public"]["Tables"]["tickets"]["Row"];
