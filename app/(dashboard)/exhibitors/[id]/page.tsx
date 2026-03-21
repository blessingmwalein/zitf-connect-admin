import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getExhibitorById } from "@/services/exhibitor.service";
import type { Exhibitor } from "@/types/database.types";
import { EditExhibitorClient } from "./edit-client";

interface EditExhibitorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExhibitorPage({
  params,
}: EditExhibitorPageProps) {
  const { id } = await params;
  let exhibitor: Exhibitor | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await getExhibitorById(id);
    if (result?.data) {
      exhibitor = result.data as Exhibitor;
    }
  } catch {
    // Supabase query failed
  }

  if (!exhibitor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Exhibitor"
        description={`Editing ${exhibitor.company_name}`}
      />

      <Card className="rounded-2xl border bg-card shadow-ios">
        <CardContent className="p-6">
          <EditExhibitorClient exhibitor={exhibitor} />
        </CardContent>
      </Card>
    </div>
  );
}
