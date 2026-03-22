"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ExhibitorForm } from "@/components/features/exhibitors/exhibitor-form";
import { createExhibitor } from "@/services/exhibitor.service";
import { getHalls } from "@/services/hall.service";
import type { ExhibitorFormData } from "@/lib/validators/exhibitor";
import type { Hall } from "@/types/database.types";
import { Card, CardContent } from "@/components/ui/card";

export default function NewExhibitorPage() {
  const router = useRouter();
  const [halls, setHalls] = useState<Pick<Hall, "id" | "name">[]>([]);

  useEffect(() => {
    getHalls().then((res) => {
      if (res.data) {
        setHalls(res.data.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name })));
      }
    });
  }, []);

  async function handleSubmit(data: ExhibitorFormData) {
    try {
      const result = await createExhibitor(data);
      if (result.error) {
        toast.error("Failed to create exhibitor", {
          description: result.error.message,
        });
        return;
      }
      toast.success("Exhibitor created successfully");
      router.push("/exhibitors");
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Exhibitor"
        description="Register a new exhibitor for the trade fair"
      />

      <Card className="rounded-2xl border bg-card shadow-ios">
        <CardContent className="p-6">
          <ExhibitorForm halls={halls} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
