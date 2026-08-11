"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadExhibitorLogo(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { url: null, error: "No file provided" };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `logos/${fileName}`;

  const { error } = await supabase.storage
    .from("exhibitors")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { url: null, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("exhibitors").getPublicUrl(path);

  return { url: publicUrl, error: null };
}

// Event logo/cover uploads reuse the "exhibitors" storage bucket rather than
// a dedicated "events" bucket — creating a new bucket requires a Storage
// policy migration that needs to be applied against the live project, which
// isn't available here. The existing bucket's `logos/`/`banners/` prefix
// policies already permit authenticated uploads, so event assets are stored
// under those same prefixes. Revisit with a dedicated bucket if this ever
// becomes confusing in practice.

export async function uploadEventLogo(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { url: null, error: "No file provided" };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `logos/${fileName}`;

  const { error } = await supabase.storage
    .from("exhibitors")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { url: null, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("exhibitors").getPublicUrl(path);

  return { url: publicUrl, error: null };
}

export async function uploadEventCoverImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { url: null, error: "No file provided" };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `banners/${fileName}`;

  const { error } = await supabase.storage
    .from("exhibitors")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { url: null, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("exhibitors").getPublicUrl(path);

  return { url: publicUrl, error: null };
}
