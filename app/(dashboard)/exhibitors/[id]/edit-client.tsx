"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExhibitorForm } from "@/components/features/exhibitors/exhibitor-form";
import { updateExhibitor } from "@/services/exhibitor.service";
import type { Exhibitor, Hall } from "@/types/database.types";
import type { ExhibitorFormData } from "@/lib/validators/exhibitor";

interface EditExhibitorClientProps {
  exhibitor: Exhibitor;
  halls?: Pick<Hall, "id" | "name">[];
}

export function EditExhibitorClient({ exhibitor, halls = [] }: EditExhibitorClientProps) {
  const router = useRouter();

  async function handleSubmit(data: ExhibitorFormData) {
    try {
      const result = await updateExhibitor(exhibitor.id, data);
      if (result.error) {
        toast.error("Failed to update exhibitor", {
          description: result.error.message,
        });
        return;
      }
      toast.success("Exhibitor updated successfully");
      router.push(`/exhibitors/${exhibitor.id}`);
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    }
  }

  return <ExhibitorForm initialData={exhibitor} halls={halls} onSubmit={handleSubmit} />;
}
