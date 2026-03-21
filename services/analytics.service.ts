"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [exhibitors, stands, events, leads, visitors] = await Promise.all([
    supabase
      .from("exhibitors")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("stands")
      .select("id", { count: "exact", head: true })
      .eq("status", "booked"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("visitors")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    totalExhibitors: exhibitors.count ?? 0,
    bookedStands: stands.count ?? 0,
    upcomingEvents: events.count ?? 0,
    totalLeads: leads.count ?? 0,
    totalVisitors: visitors.count ?? 0,
  };
}

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
    .from("v_event_participation")
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
