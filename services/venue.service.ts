"use server";

import { createClient } from "@/lib/supabase/server";
import type { VenueInsert, VenueUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getVenues() {
  const supabase = await createClient();
  return supabase.from("venues").select("*").order("name");
}

export async function getVenueById(id: string) {
  const supabase = await createClient();
  return supabase.from("venues").select("*").eq("id", id).single();
}

export async function createVenue(data: VenueInsert) {
  const supabase = await createClient();
  const result = await supabase.from("venues").insert(data as never).select().single();
  if (!result.error) revalidatePath("/venues");
  return result;
}

export async function updateVenue(id: string, data: VenueUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("venues")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/venues");
  return result;
}

export async function deleteVenue(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("venues").delete().eq("id", id);
  if (!result.error) revalidatePath("/venues");
  return result;
}
