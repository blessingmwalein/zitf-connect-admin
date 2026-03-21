"use server";

import { createClient } from "@/lib/supabase/server";
import type { StandInsert, StandUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getStands(opts?: { hallId?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("stands")
    .select("*, exhibitors(id, company_name, logo_url), halls(name)")
    .order("stand_number");

  if (opts?.hallId) query = query.eq("hall_id", opts.hallId);
  return query;
}

export async function getStandsByHall(hallId: string) {
  const supabase = await createClient();
  return supabase
    .from("stands")
    .select("*, exhibitors(id, company_name, logo_url)")
    .eq("hall_id", hallId)
    .order("stand_number");
}

export async function getStandById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("stands")
    .select("*, exhibitors(id, company_name, logo_url), halls(name)")
    .eq("id", id)
    .single();
}

export async function createStand(data: StandInsert) {
  const supabase = await createClient();
  const result = await supabase.from("stands").insert(data as never).select().single();
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function updateStand(id: string, data: StandUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function deleteStand(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("stands").delete().eq("id", id);
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function assignExhibitorToStand(
  standId: string,
  exhibitorId: string
) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .update({ exhibitor_id: exhibitorId, status: "booked" as const } as never)
    .eq("id", standId)
    .select()
    .single();
  if (!result.error) {
    revalidatePath("/stands");
    revalidatePath("/exhibitors");
  }
  return result;
}

export async function unassignStand(standId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .update({ exhibitor_id: null, status: "available" as const } as never)
    .eq("id", standId)
    .select()
    .single();
  if (!result.error) revalidatePath("/stands");
  return result;
}
