"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getStands, bulkAssignStandsToHall } from "@/services/stand.service";

interface StandOption {
  id: string;
  stand_number: string;
  hall_name: string | null;
}

interface BulkStandAssignProps {
  hallId: string;
  hallName: string;
}

export function BulkStandAssign({ hallId, hallName }: BulkStandAssignProps) {
  const [stands, setStands] = useState<StandOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await getStands() as any;
        if (result?.data) {
          // Show stands not assigned to this hall
          const unassigned = result.data
            .filter((s: any) => s.hall_id !== hallId)
            .map((s: any) => ({
              id: s.id,
              stand_number: s.stand_number,
              hall_name: s.halls?.name ?? null,
            }));
          setStands(unassigned);
        }
      } catch {
        // failed to load
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hallId]);

  function toggleStand(standId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(standId)) next.delete(standId);
      else next.add(standId);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === stands.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(stands.map((s) => s.id)));
    }
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setAssigning(true);
    try {
      const result = await bulkAssignStandsToHall(Array.from(selected), hallId);
      if (result.error) {
        toast.error("Failed to assign stands", { description: result.error.message });
        return;
      }
      toast.success(`${selected.size} stand(s) assigned to ${hallName}`);
      // Remove assigned stands from list
      setStands((prev) => prev.filter((s) => !selected.has(s.id)));
      setSelected(new Set());
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <Card className="ios-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-headline">Bulk Stand Assignment</CardTitle>
            <CardDescription>
              Assign unassigned stands to this hall
            </CardDescription>
          </div>
          {selected.size > 0 && (
            <Button onClick={handleAssign} disabled={assigning} className="gap-1.5">
              {assigning ? (
                <><Loader2 className="size-4 animate-spin" /> Assigning...</>
              ) : (
                <><CheckSquare className="size-4" /> Assign {selected.size} Stand(s)</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : stands.length === 0 ? (
          <p className="py-8 text-center text-subheadline text-muted-foreground">
            All stands are already assigned to halls.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                checked={selected.size === stands.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-footnote text-muted-foreground">
                Select all ({stands.length} available)
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stands.map((stand) => (
                <label
                  key={stand.id}
                  className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={selected.has(stand.id)}
                    onCheckedChange={() => toggleStand(stand.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-subheadline font-medium">{stand.stand_number}</p>
                    {stand.hall_name && (
                      <Badge variant="secondary" className="text-caption-2 mt-0.5">
                        Currently: {stand.hall_name}
                      </Badge>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
