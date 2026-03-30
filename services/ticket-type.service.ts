"use server";

import { createClient } from "@/lib/supabase/server";
import type { TicketTypeInsert, TicketTypeUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getTicketTypes(opts?: { activeOnly?: boolean }) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("ticket_types")
    .select("*")
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

export async function createTicketType(data: TicketTypeInsert) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("ticket_types")
    .insert(data)
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
