"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";

export async function getDashboardStats(eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();

  // NOTE: stands.status no longer exists (renamed to _deprecated_status,
  // multi-event migration phase1c) — "booked" stands are now counted via
  // active stand_assignments for this event instead. exhibitors/visitors
  // counts are scoped through their event junction tables rather than the
  // (now potentially multi-event) base tables.
  const [exhibitors, bookedStands, sessions, leads, visitors] = await Promise.all([
    supabase
      .from("event_exhibitors")
      .select("exhibitor_id", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase
      .from("stand_assignments")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "active"),
    supabase
      .from("agenda_sessions")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "published"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase
      .from("event_visitors")
      .select("visitor_id", { count: "exact", head: true })
      .eq("event_id", eventId),
  ]);

  return {
    totalExhibitors: exhibitors.count ?? 0,
    bookedStands: bookedStands.count ?? 0,
    upcomingEvents: sessions.count ?? 0,
    totalLeads: leads.count ?? 0,
    totalVisitors: visitors.count ?? 0,
  };
}

// NOTE: these three views (v_leads_per_exhibitor, v_agenda_session_participation,
// v_daily_engagement) are not yet event-scoped in their SQL definitions —
// they aggregate across ALL events' data. This is fine while only one event
// exists (today) but will blend data once a 2nd event is added. Flagged as a
// known follow-up rather than fixed here — see the "Multi-event architecture
// refactor" plan's Phase 2 notes.

export async function getLeadsPerExhibitor() {
  const supabase = await createClient();
  return supabase
    .from("v_leads_per_exhibitor")
    .select("*")
    .order("total_leads", { ascending: false });
}

export async function getEventParticipation() {
  const supabase = await createClient();
  return supabase
    .from("v_agenda_session_participation")
    .select("*")
    .order("start_time", { ascending: false });
}

export async function getDailyEngagement(days: number = 30) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  return supabase
    .from("v_daily_engagement")
    .select("*")
    .gte("day", since.toISOString().split("T")[0]);
}
