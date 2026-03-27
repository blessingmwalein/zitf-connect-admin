"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  StandFeatureInsert,
  StandFeatureUpdate,
  StandFeatureAssignmentInsert,
  StandFeatureAssignmentUpdate,
} from "@/types/database.types";
import { revalidatePath } from "next/cache";

// ─── Stand Features (master list) ───

export async function getStandFeatures() {
  const supabase = await createClient();
  return supabase
    .from("stand_features")
    .select("*")
    .order("name");
}

export async function getActiveStandFeatures() {
  const supabase = await createClient();
  return supabase
    .from("stand_features")
    .select("*")
    .eq("is_active", true)
    .order("name");
}

export async function getStandFeatureById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("stand_features")
    .select("*")
    .eq("id", id)
    .single();
}

export async function createStandFeature(data: StandFeatureInsert) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_features")
    .insert(data as never)
    .select()
    .single();
  if (!result.error) revalidatePath("/stands/features");
  return result;
}

export async function updateStandFeature(id: string, data: StandFeatureUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_features")
    .update(data as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/stands/features");
  return result;
}

export async function deleteStandFeature(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_features")
    .delete()
    .eq("id", id);
  if (!result.error) revalidatePath("/stands/features");
  return result;
}

// ─── Stand Feature Assignments (link features to stands) ───

export async function getFeaturesByStandId(standId: string) {
  const supabase = await createClient();
  return supabase
    .from("stand_feature_assignments")
    .select("*, stand_features(id, name, description, default_price)")
    .eq("stand_id", standId)
    .order("created_at");
}

export async function assignFeatureToStand(data: StandFeatureAssignmentInsert) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_feature_assignments")
    .insert(data as never)
    .select("*, stand_features(id, name, description, default_price)")
    .single();
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function updateFeatureAssignment(
  id: string,
  data: StandFeatureAssignmentUpdate
) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_feature_assignments")
    .update(data as never)
    .eq("id", id)
    .select("*, stand_features(id, name, description, default_price)")
    .single();
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function removeFeatureFromStand(assignmentId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_feature_assignments")
    .delete()
    .eq("id", assignmentId);
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function bulkAssignFeaturesToStand(
  standId: string,
  features: { feature_id: string; custom_price?: number | null; quantity?: number }[]
) {
  const supabase = await createClient();
  const inserts = features.map((f) => ({
    stand_id: standId,
    feature_id: f.feature_id,
    custom_price: f.custom_price ?? null,
    quantity: f.quantity ?? 1,
  }));
  const result = await supabase
    .from("stand_feature_assignments")
    .insert(inserts as never[])
    .select("*, stand_features(id, name, description, default_price)");
  if (!result.error) revalidatePath("/stands");
  return result;
}
