import Link from "next/link";
import { Plus } from "lucide-react";
import { getHalls } from "@/services/hall.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { HallsClient } from "./halls-client";

interface HallItem {
  id: string;
  name: string;
  description: string;
  capacity: number;
  stand_count: number;
  is_active: boolean;
  display_order: number;
}

export default async function HallsPage() {
  let halls: HallItem[] = [];
  try {
    const { data } = await getHalls();
    if (data && data.length > 0) {
      halls = data.map((h: any) => ({
        id: h.id,
        name: h.name,
        description: h.description ?? "",
        capacity: h.capacity ?? 0,
        stand_count: h.stands?.[0]?.count ?? 0,
        is_active: h.is_active,
        display_order: h.display_order,
      }));
    }
  } catch {
    // Supabase query failed
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Halls" description="Manage exhibition halls and spaces">
        <Link href="/halls/new">
          <Button>
            <Plus className="size-4" />
            Add Hall
          </Button>
        </Link>
      </PageHeader>

      <HallsClient halls={halls} />
    </div>
  );
}
