import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getVisitorById } from "@/services/visitor.service";
import type { Visitor } from "@/types/database.types";
import { EditVisitorClient } from "../edit-client";

interface EditVisitorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVisitorPage({
  params,
}: EditVisitorPageProps) {
  const { id } = await params;
  let visitor: Visitor | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await getVisitorById(id);
    if (result?.data) {
      visitor = result.data as Visitor;
    }
  } catch {
    // Supabase query failed
  }

  if (!visitor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Visitor"
        description={`Editing ${visitor.full_name}`}
      />

      <Card className="rounded-2xl border bg-card shadow-ios">
        <CardContent className="p-6">
          <EditVisitorClient visitor={visitor} />
        </CardContent>
      </Card>
    </div>
  );
}
