"use server";

import { createClient } from "@/lib/supabase/server";
import type { EventInsert, EventUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getEvents(opts?: {
  hallId?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*, halls(name)")
    .order("start_time");

  if (opts?.hallId) query = query.eq("hall_id", opts.hallId);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.from) query = query.gte("start_time", opts.from);
  if (opts?.to) query = query.lte("start_time", opts.to);

  return query;
}

export async function getEventById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("events")
    .select("*, halls(name)")
    .eq("id", id)
    .single();
}

export async function createEvent(data: EventInsert) {
  const supabase = await createClient();
  const result = await supabase
    .from("events")
    .insert(data as never)
    .select()
    .single();
  if (!result.error) revalidatePath("/events");
  return result;
}

export async function updateEvent(id: string, data: EventUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("events")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/events");
  return result;
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("events").delete().eq("id", id);
  if (!result.error) revalidatePath("/events");
  return result;
}
