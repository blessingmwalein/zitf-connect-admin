"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { assignExhibitorToStand, unassignStand } from "@/services/stand.service";

interface StandInfo {
  id: string;
  stand_number: string;
  hall_name: string | null;
}

interface Props {
  exhibitorId: string;
  assignedStands: StandInfo[];
  availableStands: StandInfo[];
}

export function ExhibitorStandAssign({ exhibitorId, assignedStands, availableStands }: Props) {
  const router = useRouter();
  const [assigned, setAssigned] = useState<StandInfo[]>(assignedStands);
  const [loading, setLoading] = useState<string | null>(null);

  // Filter out already-assigned stands from the available list
  const assignedIds = new Set(assigned.map((s) => s.id));
  const unassigned = availableStands.filter((s) => !assignedIds.has(s.id));

  async function handleAssign(standId: string) {
    setLoading(standId);
    try {
      const result = await assignExhibitorToStand(standId, exhibitorId) as any;
      if (result.error) {
        toast.error("Failed to assign stand", { description: result.error.message });
      } else {
        const stand = availableStands.find((s) => s.id === standId);
        if (stand) setAssigned((prev) => [...prev, stand]);
        toast.success("Stand assigned");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleUnassign(standId: string) {
    setLoading(standId);
    try {
      const result = await unassignStand(standId) as any;
      if (result.error) {
        toast.error("Failed to unassign stand", { description: result.error.message });
      } else {
        setAssigned((prev) => prev.filter((s) => s.id !== standId));
        toast.success("Stand unassigned");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="rounded-2xl border bg-card shadow-ios">
      <CardHeader>
        <CardTitle className="text-headline">Stand Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currently assigned stands */}
        {assigned.length > 0 ? (
          <div className="space-y-2">
            <p className="text-caption-1 font-medium text-muted-foreground">
              Assigned Stands ({assigned.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {assigned.map((stand) => (
                <Badge
                  key={stand.id}
                  variant="secondary"
                  className="gap-1.5 py-1.5 pl-3 pr-1.5 text-sm"
                >
                  <MapPin className="size-3.5" />
                  {stand.stand_number}
                  {stand.hall_name && (
                    <span className="text-muted-foreground">({stand.hall_name})</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleUnassign(stand.id)}
                    disabled={loading === stand.id}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    {loading === stand.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-footnote text-muted-foreground">
            No stands assigned to this exhibitor.
          </p>
        )}

        {/* Add stand dropdown */}
        {unassigned.length > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <p className="text-caption-1 font-medium text-muted-foreground">Add Stand</p>
              <Select
                value=""
                onValueChange={(val) => val && handleAssign(val)}
                disabled={loading !== null}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a stand to assign..." />
                </SelectTrigger>
                <SelectContent>
                  {unassigned.map((stand) => (
                    <SelectItem key={stand.id} value={stand.id}>
                      {stand.stand_number}
                      {stand.hall_name ? ` (${stand.hall_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {unassigned.length === 0 && assigned.length > 0 && (
          <p className="text-caption-1 text-muted-foreground">
            No more available stands to assign.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
