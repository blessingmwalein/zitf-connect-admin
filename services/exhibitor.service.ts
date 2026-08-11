"use server";

import { createClient } from "@/lib/supabase/server";
import type { ExhibitorInsert, ExhibitorUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";

// NOTE: the old `exhibitors.stands(...)` embed relied on stands.exhibitor_id,
// which was renamed to _deprecated_exhibitor_id (multi-event migration
// phase1c) and is no longer kept up to date by assignExhibitorToStand()/
// unassignStand() (those now write stand_assignments exclusively). Fetching
// via event_exhibitors/stand_assignments instead so this doesn't silently
// go stale the first time a stand is (re)assigned after the migration.

export async function getExhibitors(opts?: {
  status?: string;
  search?: string;
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
    .from("exhibitors")
    .select("*, halls(id, name)", { count: "exact" })
    .order("company_name")
    .range(from, to);

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.search) query = query.ilike("company_name", `%${opts.search}%`);

  const { data, count, error } = await query;
  if (error || !data) return { data, count, error };

  const exhibitorIds = data.map((e: { id: string }) => e.id);
  const { data: assignments } = await supabase
    .from("stand_assignments")
    .select("exhibitor_id, stand_id, stands(id, stand_number, hall_id)")
    .eq("event_id", eventId)
    .eq("status", "active")
    .in("exhibitor_id", exhibitorIds);
  const standByExhibitor = new Map((assignments ?? []).map((a: any) => [a.exhibitor_id, a.stands]));

  return {
    data: data.map((e: any) => ({ ...e, stands: standByExhibitor.get(e.id) ? [standByExhibitor.get(e.id)] : [] })),
    count,
    error: null,
  } as { data: Record<string, unknown>[] | null; count: number | null; error: unknown };
}

export async function getExhibitorById(id: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exhibitor, error } = await (supabase as any)
    .from("exhibitors")
    .select("*, halls(id, name)")
    .eq("id", id)
    .single();
  if (error || !exhibitor) return { data: exhibitor, error };

  const { data: assignment } = await supabase
    .from("stand_assignments")
    .select("stands(*, halls(name))")
    .eq("event_id", eventId)
    .eq("exhibitor_id", id)
    .eq("status", "active")
    .maybeSingle();

  return {
    data: { ...exhibitor, stands: assignment?.stands ? [assignment.stands] : [] },
    error: null,
  } as { data: Record<string, unknown> | null; error: unknown };
}

export async function createExhibitor(data: ExhibitorInsert, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  const result = await supabase
    .from("exhibitors")
    .insert(data as never)
    .select()
    .single();

  if (!result.error && result.data) {
    // Every exhibitor needs an event_exhibitors row for this event before
    // anything else (stand reservations/assignments, leads) can reference
    // them — see the composite FK requirements added in phase1b/phase1c.
    await supabase.from("event_exhibitors").insert({
      event_id: eventId,
      exhibitor_id: (result.data as { id: string }).id,
      application_status: data.status === "approved" || data.status === "active" ? "approved" : "applied",
    } as never);
    revalidatePath("/exhibitors");
  }
  return result;
}

export async function updateExhibitor(id: string, data: ExhibitorUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("exhibitors")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/exhibitors");
  return result;
}

export async function deleteExhibitor(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("exhibitors").delete().eq("id", id);
  if (!result.error) revalidatePath("/exhibitors");
  return result;
}

/** Lightweight list for dropdowns — returns id + company_name only */
export async function getExhibitorsList() {
  const supabase = await createClient();
  return supabase
    .from("exhibitors")
    .select("id, company_name")
    .order("company_name");
}

export async function getExhibitorLeads(exhibitorId: string, eventId: string = DEFAULT_EVENT_ID) {
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
      visitors (
        full_name,
        email,
        phone,
        company,
        job_title,
        country
      )
    `
    )
    .eq("exhibitor_id", exhibitorId)
    .eq("event_id", eventId)
    .order("captured_at", { ascending: false }) as Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
}
