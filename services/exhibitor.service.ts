"use server";

import { createClient } from "@/lib/supabase/server";
import type { ExhibitorInsert, ExhibitorUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getExhibitors(opts?: {
  status?: string;
  search?: string;
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
    .from("exhibitors")
    .select("*, stands(id, stand_number, hall_id), halls(id, name)", { count: "exact" })
    .order("company_name")
    .range(from, to);

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.search) query = query.ilike("company_name", `%${opts.search}%`);

  return query as Promise<{ data: Record<string, unknown>[] | null; count: number | null; error: unknown }>;
}

export async function getExhibitorById(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from("exhibitors")
    .select("*, stands(*, halls(name)), halls(id, name)")
    .eq("id", id)
    .single() as Promise<{ data: Record<string, unknown> | null; error: unknown }>;
}

export async function createExhibitor(data: ExhibitorInsert) {
  const supabase = await createClient();
  const result = await supabase
    .from("exhibitors")
    .insert(data as never)
    .select()
    .single();
  if (!result.error) revalidatePath("/exhibitors");
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

export async function getExhibitorLeads(exhibitorId: string) {
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
    .order("captured_at", { ascending: false }) as Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
}
