"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getHalls } from "@/services/hall.service";
import { bulkCreateStands } from "@/services/stand.service";
import type { StandInsert } from "@/types/database.types";

interface HallOption {
  id: string;
  name: string;
}

export default function NewStandsPage() {
  const router = useRouter();
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk mode
  const [hallId, setHallId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [startNum, setStartNum] = useState(1);
  const [count, setCount] = useState(10);
  const [defaultArea, setDefaultArea] = useState<number | undefined>(undefined);
  const [defaultPrice, setDefaultPrice] = useState<number | undefined>(undefined);

  // Single mode
  const [singleStands, setSingleStands] = useState<{ stand_number: string; area_sqm?: number; price?: number }[]>([
    { stand_number: "" },
  ]);

  useEffect(() => {
    getHalls().then((res) => {
      if (res.data) {
        setHalls(res.data.map((h: any) => ({ id: h.id, name: h.name })));
      }
    });
  }, []);

  function generatePreview(): StandInsert[] {
    if (!hallId) return [];
    return Array.from({ length: count }, (_, i) => ({
      hall_id: hallId,
      stand_number: `${prefix}${String(startNum + i).padStart(2, "0")}`,
      area_sqm: defaultArea ?? null,
      price: defaultPrice ?? null,
      status: "available" as const,
    }));
  }

  async function handleBulkCreate() {
    const stands = generatePreview();
    if (stands.length === 0 || !hallId) {
      toast.error("Please select a hall and configure the stands");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await bulkCreateStands(stands);
      if (result.error) {
        toast.error("Failed to create stands", { description: result.error.message });
        return;
      }
      toast.success(`${stands.length} stands created successfully`);
      router.push("/stands");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSingleCreate() {
    if (!hallId) {
      toast.error("Please select a hall");
      return;
    }
    const valid = singleStands.filter((s) => s.stand_number.trim());
    if (valid.length === 0) {
      toast.error("Please add at least one stand");
      return;
    }
    const stands: StandInsert[] = valid.map((s) => ({
      hall_id: hallId,
      stand_number: s.stand_number.trim(),
      area_sqm: s.area_sqm ?? null,
      price: s.price ?? null,
      status: "available" as const,
    }));
    setIsSubmitting(true);
    try {
      const result = await bulkCreateStands(stands);
      if (result.error) {
        toast.error("Failed to create stands", { description: result.error.message });
        return;
      }
      toast.success(`${stands.length} stand(s) created`);
      router.push("/stands");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  function addSingleRow() {
    setSingleStands([...singleStands, { stand_number: "" }]);
  }

  function removeSingleRow(index: number) {
    setSingleStands(singleStands.filter((_, i) => i !== index));
  }

  function updateSingleRow(index: number, field: string, value: string | number) {
    setSingleStands(
      singleStands.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  const preview = generatePreview();

  return (
    <div className="space-y-6">
      <PageHeader title="Create Stands" description="Add one or multiple stands at once">
        <Link href="/stands">
          <Button variant="outline"><ArrowLeft className="size-4" /> Back</Button>
        </Link>
      </PageHeader>

      {/* Hall Selection */}
      <Card className="ios-card">
        <CardHeader>
          <CardTitle className="text-headline">Select Hall</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Label>Hall *</Label>
            <Select value={hallId} onValueChange={(v) => setHallId(v ?? "")}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a hall" /></SelectTrigger>
              <SelectContent>
                {halls.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bulk">
        <TabsList>
          <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* Bulk Generate */}
        <TabsContent value="bulk">
          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="text-headline">Generate Stand Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Prefix</Label>
                  <Input placeholder="e.g. A-" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Start Number</Label>
                  <Input type="number" min={1} value={startNum} onChange={(e) => setStartNum(parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label>Count</Label>
                  <Input type="number" min={1} max={100} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label>Area (m²)</Label>
                  <Input type="number" min={0} placeholder="Optional" value={defaultArea ?? ""} onChange={(e) => setDefaultArea(e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-subheadline font-medium mb-3">Preview ({preview.length} stands)</p>
                    <div className="max-h-[200px] overflow-y-auto rounded-xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stand #</TableHead>
                            <TableHead>Area</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.slice(0, 20).map((s, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{s.stand_number}</TableCell>
                              <TableCell>{s.area_sqm ?? "-"}</TableCell>
                              <TableCell>Available</TableCell>
                            </TableRow>
                          ))}
                          {preview.length > 20 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                ...and {preview.length - 20} more
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={handleBulkCreate} disabled={isSubmitting || !hallId || count < 1}>
                  {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Creating...</> : `Create ${count} Stands`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry */}
        <TabsContent value="manual">
          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="text-headline">Manual Stand Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {singleStands.map((stand, i) => (
                <div key={i} className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label>Stand #{i + 1}</Label>
                    <Input
                      placeholder="Stand number"
                      value={stand.stand_number}
                      onChange={(e) => updateSingleRow(i, "stand_number", e.target.value)}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label>Area</Label>
                    <Input
                      type="number"
                      placeholder="m²"
                      value={stand.area_sqm ?? ""}
                      onChange={(e) => updateSingleRow(i, "area_sqm", e.target.value ? parseFloat(e.target.value) : "")}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      placeholder="USD"
                      value={stand.price ?? ""}
                      onChange={(e) => updateSingleRow(i, "price", e.target.value ? parseFloat(e.target.value) : "")}
                    />
                  </div>
                  {singleStands.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeSingleRow(i)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addSingleRow} className="gap-1.5">
                <Plus className="size-4" /> Add Row
              </Button>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSingleCreate} disabled={isSubmitting || !hallId}>
                  {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Creating...</> : `Create ${singleStands.filter(s => s.stand_number.trim()).length} Stand(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
