"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveExhibitor(exhibitorId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("exhibitors")
    .update({ status: "approved" } as never)
    .eq("id", exhibitorId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/exhibitors");
  return { success: true };
}

export async function rejectExhibitor(exhibitorId: string, reason?: string) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status: "rejected" };
  if (reason) {
    updateData.notes = reason;
  }

  const { error } = await supabase
    .from("exhibitors")
    .update(updateData as never)
    .eq("id", exhibitorId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/exhibitors");
  return { success: true };
}

// TODO: Enable invite functionality once SUPABASE_SERVICE_ROLE_KEY is configured
// import { createAdminClient } from "@/lib/supabase/admin";
// export async function inviteExhibitor(exhibitorId: string, email: string) { ... }
// export async function resendInvite(exhibitorId: string) { ... }
