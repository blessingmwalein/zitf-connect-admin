"use server";

import { createClient } from "@/lib/supabase/server";
import type { HallInsert, HallUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

// NOTE: halls are a reusable venue asset, not owned by a single event (see
// the "Multi-event architecture refactor" plan, B3) — a physical room gets
// reused edition after edition. `getHalls`/`getHallById` below intentionally
// stay unscoped (they're the global "Venues & Halls" list). Which halls are
// actually in service for a given edition is a separate, event-scoped
// question — see `getHallsForEvent` below, added for that surface once it
// exists as its own page.

export async function getHalls() {
  const supabase = await createClient();
  return supabase
    .from("halls")
    .select("*, stands(count)")
    .order("display_order");
}

/** Halls in use for a given event edition, via the `event_halls` join. */
export async function getHallsForEvent(eventId: string) {
  const supabase = await createClient();
  return supabase
    .from("event_halls")
    .select("is_active, display_order_override, capacity_override, halls(*, stands(count))")
    .eq("event_id", eventId)
    .order("display_order_override", { ascending: true, nullsFirst: false });
}

export async function getHallById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("halls")
    .select("*, stands(*, exhibitors(id, company_name, logo_url))")
    .eq("id", id)
    .single();
}

export async function createHall(data: HallInsert) {
  const supabase = await createClient();
  const result = await supabase.from("halls").insert(data as never).select().single();
  if (!result.error) revalidatePath("/halls");
  return result;
}

export async function updateHall(id: string, data: HallUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("halls")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/halls");
  return result;
}

export async function deleteHall(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("halls").delete().eq("id", id);
  if (!result.error) revalidatePath("/halls");
  return result;
}
