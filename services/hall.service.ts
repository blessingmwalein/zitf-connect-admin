"use server";

import { createClient } from "@/lib/supabase/server";
import type { HallInsert, HallUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getHalls() {
  const supabase = await createClient();
  return supabase
    .from("halls")
    .select("*, stands(count)")
    .order("display_order");
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
