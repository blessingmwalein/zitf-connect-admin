"use server";

import { createClient } from "@/lib/supabase/server";
import type { TicketTypeInsert, TicketTypeUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";

export async function getTicketTypes(opts?: { activeOnly?: boolean; eventId?: string }) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("ticket_types")
    .select("*")
    .eq("event_id", opts?.eventId ?? DEFAULT_EVENT_ID)
    .order("created_at", { ascending: false });

  if (opts?.activeOnly) {
    query = query.eq("is_active", true);
  }

  return query as Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
}

export async function getTicketTypeById(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from("ticket_types")
    .select("*")
    .eq("id", id)
    .single() as Promise<{ data: Record<string, unknown> | null; error: unknown }>;
}

export async function createTicketType(data: TicketTypeInsert, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("ticket_types")
    .insert({ ...data, event_id: eventId })
    .select()
    .single();

  revalidatePath("/tickets");
  return result as { data: Record<string, unknown> | null; error: unknown };
}

export async function updateTicketType(id: string, data: TicketTypeUpdate) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("ticket_types")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  revalidatePath("/tickets");
  return result as { data: Record<string, unknown> | null; error: unknown };
}

export async function deleteTicketType(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("ticket_types")
    .delete()
    .eq("id", id);

  revalidatePath("/tickets");
  return result as { error: unknown };
}
