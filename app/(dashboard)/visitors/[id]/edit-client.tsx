"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VisitorForm } from "@/components/features/visitors/visitor-form";
import { updateVisitor } from "@/services/visitor.service";
import type { Visitor } from "@/types/database.types";
import type { VisitorFormData } from "@/lib/validators/visitor";

interface EditVisitorClientProps {
  visitor: Visitor;
}

export function EditVisitorClient({ visitor }: EditVisitorClientProps) {
  const router = useRouter();

  async function handleSubmit(data: VisitorFormData) {
    try {
      const result = await updateVisitor(visitor.id, data);
      if (result.error) {
        toast.error("Failed to update visitor", {
          description: result.error.message,
        });
        return;
      }
      toast.success("Visitor updated successfully");
      router.push(`/visitors/${visitor.id}`);
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    }
  }

  return <VisitorForm initialData={visitor} onSubmit={handleSubmit} />;
}
