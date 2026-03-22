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
