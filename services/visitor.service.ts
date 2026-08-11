"use server";

import { createClient } from "@/lib/supabase/server";
import type { VisitorInsert, VisitorUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";

// NOTE: visitors.badge_id/registered_at were renamed to
// _deprecated_badge_id/_deprecated_registered_at (multi-event migration
// phase1d) — per-edition facts now live on event_visitors. The functions
// below re-attach them under their original field names (badge_id,
// registered_at) from event_visitors for the given event, so the existing
// Visitors list/detail/form pages that read `visitor.badge_id` directly
// don't need to change.

async function attachEventVisitorFields<T extends { id: string }>(
  visitors: T[],
  eventId: string
) {
  if (visitors.length === 0) return [];
  const supabase = await createClient();
  const { data: eventVisitors } = await supabase
    .from("event_visitors")
    .select("visitor_id, badge_id, registered_at, checked_in_at")
    .eq("event_id", eventId)
    .in(
      "visitor_id",
      visitors.map((v) => v.id)
    );

  const byVisitor = new Map((eventVisitors ?? []).map((ev) => [ev.visitor_id, ev]));

  return visitors.map((v) => {
    const ev = byVisitor.get(v.id);
    return {
      ...v,
      badge_id: ev?.badge_id ?? null,
      registered_at: ev?.registered_at ?? null,
      checked_in_at: ev?.checked_in_at ?? null,
    };
  });
}

export async function getVisitors(opts?: {
  search?: string;
  country?: string;
  page?: number;
  pageSize?: number;
  eventId?: string;
}) {
  const supabase = await createClient();
  const eventId = opts?.eventId ?? DEFAULT_EVENT_ID;
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("visitors")
    .select("*", { count: "exact" })
    .order("full_name")
    .range(from, to);

  if (opts?.country) query = query.eq("country", opts.country);
  if (opts?.search) query = query.ilike("full_name", `%${opts.search}%`);

  const { data, count, error } = await query;
  if (error || !data) return { data, count, error };

  return {
    data: await attachEventVisitorFields(data, eventId),
    count,
    error: null,
  } as { data: Record<string, unknown>[] | null; count: number | null; error: unknown };
}

export async function getVisitorById(id: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("visitors")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return { data, error };

  const [hydrated] = await attachEventVisitorFields([data], eventId);
  return { data: hydrated, error: null } as {
    data: Record<string, unknown> | null;
    error: unknown;
  };
}

export async function createVisitor(data: VisitorInsert, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  // badge_id may be passed in from the form (visitor.form.tsx) targeting the
  // old flat column — pull it out and route it to event_visitors instead.
  const { badge_id, ...visitorFields } = data as VisitorInsert & { badge_id?: string | null };

  const result = await supabase
    .from("visitors")
    .insert(visitorFields as never)
    .select()
    .single();

  if (!result.error && result.data) {
    await supabase.from("event_visitors").insert({
      event_id: eventId,
      visitor_id: (result.data as { id: string }).id,
      badge_id: badge_id ?? null,
    } as never);
    revalidatePath("/visitors");
  }
  return result;
}

export async function updateVisitor(
  id: string,
  data: VisitorUpdate,
  eventId: string = DEFAULT_EVENT_ID
) {
  const supabase = await createClient();
  const { badge_id, ...visitorFields } = data as VisitorUpdate & { badge_id?: string | null };

  const result = await supabase
    .from("visitors")
    .update(visitorFields as never)
    .eq("id", id)
    .select()
    .single();

  if (!result.error && badge_id !== undefined) {
    await supabase
      .from("event_visitors")
      .upsert(
        { event_id: eventId, visitor_id: id, badge_id } as never,
        { onConflict: "event_id,visitor_id" }
      );
  }
  if (!result.error) revalidatePath("/visitors");
  return result;
}

export async function deleteVisitor(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("visitors").delete().eq("id", id);
  if (!result.error) revalidatePath("/visitors");
  return result;
}

/** Lightweight list for dropdowns — returns id + full_name only */
export async function getVisitorsList() {
  const supabase = await createClient();
  return supabase
    .from("visitors")
    .select("id, full_name")
    .order("full_name");
}

export async function getVisitorLeads(visitorId: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from("leads")
    .select(
      `
      captured_at,
      source,
      is_qualified,
      notes,
      exhibitors (
        id,
        company_name,
        contact_email,
        logo_url
      )
    `
    )
    .eq("visitor_id", visitorId)
    .eq("event_id", eventId)
    .order("captured_at", { ascending: false }) as Promise<{
    data: Record<string, unknown>[] | null;
    error: unknown;
  }>;
}

export async function getVisitorEventAttendance(visitorId: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from("event_attendance")
    .select(
      `
      checked_in_at,
      agenda_sessions (
        id,
        name,
        start_time,
        end_time,
        status,
        halls (name)
      )
    `
    )
    .eq("visitor_id", visitorId)
    .order("checked_in_at", { ascending: false }) as Promise<{
    data: Record<string, unknown>[] | null;
    error: unknown;
  }>;
}
