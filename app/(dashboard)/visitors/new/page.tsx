"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { VisitorForm } from "@/components/features/visitors/visitor-form";
import { createVisitor } from "@/services/visitor.service";
import type { VisitorFormData } from "@/lib/validators/visitor";
import { Card, CardContent } from "@/components/ui/card";

export default function NewVisitorPage() {
  const router = useRouter();

  async function handleSubmit(data: VisitorFormData) {
    try {
      const result = await createVisitor(data);
      if (result.error) {
        toast.error("Failed to create visitor", {
          description: result.error.message,
        });
        return;
      }
      toast.success("Visitor created successfully");
      router.push("/visitors");
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Visitor"
        description="Register a new visitor for the trade fair"
      />

      <Card className="rounded-2xl border bg-card shadow-ios">
        <CardContent className="p-6">
          <VisitorForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
