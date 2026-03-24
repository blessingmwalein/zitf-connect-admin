"use server";

import { createClient } from "@/lib/supabase/server";
import type { VisitorInsert, VisitorUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getVisitors(opts?: {
  search?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
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

  return query as Promise<{
    data: Record<string, unknown>[] | null;
    count: number | null;
    error: unknown;
  }>;
}

export async function getVisitorById(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from("visitors")
    .select("*")
    .eq("id", id)
    .single() as Promise<{
    data: Record<string, unknown> | null;
    error: unknown;
  }>;
}

export async function createVisitor(data: VisitorInsert) {
  const supabase = await createClient();
  const result = await supabase
    .from("visitors")
    .insert(data as never)
    .select()
    .single();
  if (!result.error) revalidatePath("/visitors");
  return result;
}

export async function updateVisitor(id: string, data: VisitorUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("visitors")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
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

export async function getVisitorLeads(visitorId: string) {
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
      events (
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
