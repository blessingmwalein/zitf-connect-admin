"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { STAND_STATUS_CONFIG, type StandStatus } from "@/lib/constants";
import { deleteStand } from "@/services/stand.service";
import type { StandItem } from "./page";

type SortKey = "stand_number" | "hall_name" | "status" | "area_sqm" | "price";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export function StandsClient({ stands }: { stands: StandItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hallFilter, setHallFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("stand_number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const hallNames = useMemo(() => {
    const names = Array.from(new Set(stands.map((s) => s.hall_name)));
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, [stands]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stands.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (hallFilter !== "all" && s.hall_name !== hallFilter) return false;
      if (
        q &&
        !s.stand_number.toLowerCase().includes(q) &&
        !(s.exhibitor_name ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [stands, search, statusFilter, hallFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "stand_number":
          cmp = a.stand_number.localeCompare(b.stand_number, undefined, { numeric: true });
          break;
        case "hall_name":
          cmp = a.hall_name.localeCompare(b.hall_name);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "area_sqm":
          cmp = a.area_sqm - b.area_sqm;
          break;
        case "price":
          cmp = a.price - b.price;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const pageItems = sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const showingFrom = sorted.length > 0 ? startIdx + 1 : 0;
  const showingTo = Math.min(startIdx + ITEMS_PER_PAGE, sorted.length);

  function resetPage() { setPage(1); }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const result = await deleteStand(deleteId);
      if (result.error) {
        toast.error("Failed to delete stand", { description: result.error.message });
        return;
      }
      toast.success("Stand deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column)
      return <ChevronUp className="ml-1 inline size-3.5 text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline size-3.5" />
    ) : (
      <ChevronDown className="ml-1 inline size-3.5" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by stand # or exhibitor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val ?? "all"); resetPage(); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STAND_STATUS_CONFIG) as [StandStatus, { label: string; color: string }][]).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={hallFilter} onValueChange={(val) => { setHallFilter(val ?? "all"); resetPage(); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Hall" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Halls</SelectItem>
            {hallNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card shadow-ios overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("stand_number")}>
                Stand # <SortIcon column="stand_number" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("hall_name")}>
                Hall <SortIcon column="hall_name" />
              </TableHead>
              <TableHead>Exhibitor</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>
                Status <SortIcon column="status" />
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort("area_sqm")}>
                Area (m&sup2;) <SortIcon column="area_sqm" />
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort("price")}>
                Price (USD) <SortIcon column="price" />
              </TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((stand) => {
              const statusConfig = STAND_STATUS_CONFIG[stand.status as StandStatus] ?? { label: stand.status, color: "bg-muted text-muted-foreground" };
              return (
                <TableRow key={stand.id}>
                  <TableCell>
                    <Link href={`/stands/${stand.id}`} className="text-headline text-ios-blue hover:underline">
                      {stand.stand_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/halls/${stand.hall_id}`} className="text-footnote text-muted-foreground hover:text-foreground">
                      {stand.hall_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-footnote">
                      {stand.exhibitor_name ?? <span className="text-muted-foreground">Unassigned</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {stand.features.map((feat, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 leading-tight bg-secondary/30 border-0 text-muted-foreground">
                          {feat}
                        </Badge>
                      ))}
                      {stand.features.length === 0 && <span className="text-muted-foreground/30 text-[10px]">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-caption-2", statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-footnote">{stand.area_sqm}</TableCell>
                  <TableCell className="text-right text-footnote font-medium">
                    {stand.price > 0 ? `$${stand.price.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/stands/${stand.id}`)}>
                          <Eye className="mr-2 size-4" />View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/stands/${stand.id}`)}>
                          <Pencil className="mr-2 size-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(stand.id)}>
                          <Trash2 className="mr-2 size-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No stands found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {showingFrom}-{showingTo} of {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Stand"
        description="Are you sure you want to delete this stand? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
