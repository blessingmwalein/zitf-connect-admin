import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getExhibitorById } from "@/services/exhibitor.service";
import { ExhibitorBadge } from "@/components/features/exhibitors/exhibitor-badge";

interface BadgePageProps {
  params: Promise<{ id: string }>;
}

export default async function BadgePage({ params }: BadgePageProps) {
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let exhibitor: any = null;

  try {
    const result = await getExhibitorById(id);
    if (result?.data) exhibitor = result.data;
  } catch {
    // query failed
  }

  if (!exhibitor) notFound();

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="print:hidden">
        <PageHeader
          title="Exhibitor Badge"
          description={`Badge for ${exhibitor.company_name}`}
        >
          <Link href={`/exhibitors/${id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </Link>
        </PageHeader>
      </div>

      <ExhibitorBadge
        exhibitor={exhibitor}
        stands={exhibitor.stands ?? []}
      />
    </div>
  );
}
