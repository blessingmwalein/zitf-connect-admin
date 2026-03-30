"use server";

import { createClient } from "@/lib/supabase/server";
import type { StandInsert, StandUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export async function getStands(opts?: { hallId?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("stands")
    .select("*, exhibitors(id, company_name, logo_url), halls(name), stand_feature_assignments(id, quantity, stand_features(name))")
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

export async function getUnassignedStands() {
  const supabase = await createClient();
  return supabase
    .from("stands")
    .select("*, halls(name)")
    .is("hall_id", null)
    .order("stand_number");
}

export async function bulkAssignStandsToHall(
  standIds: string[],
  hallId: string
) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .update({ hall_id: hallId } as never)
    .in("id", standIds)
    .select();
  if (!result.error) {
    revalidatePath("/stands");
    revalidatePath("/halls");
  }
  return result;
}

export async function bulkCreateStands(stands: StandInsert[]) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .insert(stands as never[])
    .select();
  if (!result.error) revalidatePath("/stands");
  return result;
}

/** Get stands available for assignment (no exhibitor) or already assigned to a specific exhibitor */
export async function getAvailableStands(currentExhibitorId?: string) {
  const supabase = await createClient();
  // Get stands with no exhibitor assigned
  let query = supabase
    .from("stands")
    .select("id, stand_number, hall_id, halls(name)")
    .is("exhibitor_id", null)
    .order("stand_number");

  const { data: available, error } = await query;
  if (error) return { data: null, error };

  // Also get stands currently assigned to this exhibitor
  if (currentExhibitorId) {
    const { data: assigned } = await supabase
      .from("stands")
      .select("id, stand_number, hall_id, halls(name)")
      .eq("exhibitor_id", currentExhibitorId)
      .order("stand_number");
    return { data: [...(available ?? []), ...(assigned ?? [])], error: null };
  }

  return { data: available, error: null };
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

export async function getPendingStandApplications() {
  const supabase = await createClient();
  return supabase
    .from("stands")
    .select("*, exhibitors(id, company_name, logo_url), halls(name)")
    .eq("status", "reserved")
    .order("updated_at", { ascending: false });
}

export async function approveStand(id: string) {
  const supabase = await createClient();
  
  // 1. Get the stand to find the exhibitor_id
  const { data: stand } = await supabase
    .from("stands")
    .select("exhibitor_id")
    .eq("id", id)
    .single();

  // 2. Update stand status
  const result = await supabase
    .from("stands")
    .update({ status: "booked" as const } as never)
    .eq("id", id)
    .select()
    .single();
  
  // 3. If exhibitor is linked, ensure they are also approved
  const exhibitorId = (stand as any)?.exhibitor_id;
  if (!result.error && exhibitorId) {
    await supabase
      .from("exhibitors")
      .update({ status: "approved" as const } as never)
      .eq("id", exhibitorId)
      .eq("status", "pending") // Only if they were pending
      .select();
    
    revalidatePath("/exhibitors");
  }
  
  if (!result.error) {
    revalidatePath("/stands");
    revalidatePath(`/stands/${id}`);
  }
  return result;
}

export async function rejectStand(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .update({ status: "available" as const, exhibitor_id: null } as never)
    .eq("id", id)
    .select()
    .single();
  
  if (!result.error) {
    revalidatePath("/stands");
    revalidatePath(`/stands/${id}`);
  }
  return result;
}
