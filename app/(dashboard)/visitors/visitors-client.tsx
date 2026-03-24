"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteVisitor } from "@/services/visitor.service";
import type { Visitor } from "@/types/database.types";

type SortField = "full_name" | "company" | "country" | "registered_at";
type SortDirection = "asc" | "desc";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

export function VisitorsClient({
  visitors,
}: {
  visitors: Visitor[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sort, setSort] = useState<SortConfig>({
    field: "full_name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const countries = useMemo(() => {
    const unique = new Set<string>();
    for (const v of visitors) {
      if (v.country) unique.add(v.country);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [visitors]);

  const countryOptions = useMemo(
    () => [
      { value: "all", label: "All Countries" },
      ...countries.map((c) => ({ value: c, label: c })),
    ],
    [countries],
  );

  const processedVisitors = useMemo(() => {
    let list = visitors;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.full_name.toLowerCase().includes(q) ||
          (v.email && v.email.toLowerCase().includes(q)) ||
          (v.company && v.company.toLowerCase().includes(q)),
      );
    }

    if (countryFilter !== "all") {
      list = list.filter((v) => v.country === countryFilter);
    }

    list = [...list].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      switch (sort.field) {
        case "full_name":
          aVal = a.full_name.toLowerCase();
          bVal = b.full_name.toLowerCase();
          break;
        case "company":
          aVal = (a.company ?? "").toLowerCase();
          bVal = (b.company ?? "").toLowerCase();
          break;
        case "country":
          aVal = (a.country ?? "").toLowerCase();
          bVal = (b.country ?? "").toLowerCase();
          break;
        case "registered_at":
          aVal = a.registered_at;
          bVal = b.registered_at;
          break;
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [visitors, search, countryFilter, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedVisitors.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    processedVisitors.length,
  );
  const paginatedVisitors = processedVisitors.slice(startIndex, endIndex);

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleCountryFilter(value: string | null) {
    setCountryFilter(value ?? "all");
    setCurrentPage(1);
  }

  function handleSort(field: SortField) {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
    setCurrentPage(1);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const result = await deleteVisitor(deleteId);
      if (result.error) {
        toast.error("Failed to delete visitor", {
          description: result.error.message,
        });
        return;
      }
      toast.success("Visitor deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sort.field !== field) {
      return <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />;
    }
    return sort.direction === "asc" ? (
      <ChevronUp className="size-3.5" />
    ) : (
      <ChevronDown className="size-3.5" />
    );
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search visitors..."
            className="h-11 rounded-xl bg-secondary/50 pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <Select value={countryFilter} onValueChange={handleCountryFilter}>
          <SelectTrigger className="h-9 min-w-[140px]">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card shadow-ios">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("full_name")}
                >
                  Name
                  <SortIcon field="full_name" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("company")}
                >
                  Company
                  <SortIcon field="company" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("country")}
                >
                  Country
                  <SortIcon field="country" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("registered_at")}
                >
                  Registered
                  <SortIcon field="registered_at" />
                </button>
              </TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVisitors.map((visitor) => {
              const initials = visitor.full_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <TableRow key={visitor.id}>
                  <TableCell>
                    <Link
                      href={`/visitors/${visitor.id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {visitor.full_name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {visitor.email ?? "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {visitor.company ?? "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {visitor.country ?? "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(visitor.registered_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/visitors/${visitor.id}`)
                          }
                        >
                          <Eye className="mr-2 size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/visitors/${visitor.id}/edit`)
                          }
                        >
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(visitor.id)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedVisitors.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No visitors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {processedVisitors.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}&ndash;{endIndex} of{" "}
              {processedVisitors.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Visitor"
        description="Are you sure you want to delete this visitor? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
