import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getExhibitorById } from "@/services/exhibitor.service";
import { getHalls } from "@/services/hall.service";
import { getAvailableStands } from "@/services/stand.service";
import type { Exhibitor } from "@/types/database.types";
import { EditExhibitorClient } from "../edit-client";
import { ExhibitorStandAssign } from "@/components/features/exhibitors/exhibitor-stand-assign";

interface EditExhibitorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExhibitorPage({
  params,
}: EditExhibitorPageProps) {
  const { id } = await params;
  let exhibitor: Exhibitor | null = null;
  let halls: { id: string; name: string }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let availableStands: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let assignedStands: any[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await getExhibitorById(id);
    if (result?.data) {
      exhibitor = result.data as Exhibitor;
      // Extract assigned stands from the exhibitor data
      assignedStands = (result.data.stands ?? []).map((s: any) => ({
        id: s.id,
        stand_number: s.stand_number,
        hall_name: s.halls?.name ?? null,
      }));
    }
  } catch {
    // Supabase query failed
  }

  if (!exhibitor) {
    notFound();
  }

  try {
    const [hallsResult, standsResult] = await Promise.all([
      getHalls(),
      getAvailableStands(id),
    ]);
    if (hallsResult?.data) {
      halls = hallsResult.data.map((h: { id: string; name: string }) => ({
        id: h.id,
        name: h.name,
      }));
    }
    if (standsResult?.data) {
      availableStands = standsResult.data.map((s: any) => ({
        id: s.id,
        stand_number: s.stand_number,
        hall_name: s.halls?.name ?? null,
      }));
    }
  } catch {
    // query failed
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Exhibitor"
        description={`Editing ${exhibitor.company_name}`}
      />

      <Card className="rounded-2xl border bg-card shadow-ios">
        <CardContent className="p-6">
          <EditExhibitorClient exhibitor={exhibitor} halls={halls} />
        </CardContent>
      </Card>

      <ExhibitorStandAssign
        exhibitorId={id}
        assignedStands={assignedStands}
        availableStands={availableStands}
      />
    </div>
  );
}
