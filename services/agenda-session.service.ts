"use server";

import { createClient } from "@/lib/supabase/server";
import type { AgendaSessionInsert, AgendaSessionUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

// This is the conference-agenda/schedule feature (talks/sessions that happen
// during a fair), not the top-level multi-event "Event" (fair edition)
// entity — see services/event.service.ts for that. The underlying table was
// renamed from `events` to `agenda_sessions` to free the `events` name for
// the real tenant entity (see the multi-event architecture plan). This file
// and its route (`/programme`, was `/events`) complete that rename on the
// frontend.

export async function getAgendaSessions(opts?: {
  hallId?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("agenda_sessions")
    .select("*, halls(name)")
    .order("start_time");

  if (opts?.hallId) query = query.eq("hall_id", opts.hallId);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.from) query = query.gte("start_time", opts.from);
  if (opts?.to) query = query.lte("start_time", opts.to);

  return query;
}

export async function getAgendaSessionById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("agenda_sessions")
    .select("*, halls(name)")
    .eq("id", id)
    .single();
}

export async function createAgendaSession(data: AgendaSessionInsert) {
  const supabase = await createClient();
  const result = await supabase
    .from("agenda_sessions")
    .insert(data as never)
    .select()
    .single();
  if (!result.error) revalidatePath("/programme");
  return result;
}

export async function updateAgendaSession(id: string, data: AgendaSessionUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("agenda_sessions")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/programme");
  return result;
}

export async function deleteAgendaSession(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("agenda_sessions").delete().eq("id", id);
  if (!result.error) revalidatePath("/programme");
  return result;
}
