"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import {
  EXHIBITOR_STATUS_CONFIG,
  type ExhibitorStatus,
} from "@/lib/constants";
import type { Exhibitor } from "@/types/database.types";

/* ============================================
   Types
   ============================================ */

type SortField = "company_name" | "status" | "country";
type SortDirection = "asc" | "desc";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(EXHIBITOR_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  })),
];

/* ============================================
   Component
   ============================================ */

export function ExhibitorsClient({
  exhibitors,
}: {
  exhibitors: Exhibitor[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sort, setSort] = useState<SortConfig>({
    field: "company_name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Derived: unique countries ---------- */
  const countries = useMemo(() => {
    const unique = new Set<string>();
    for (const e of exhibitors) {
      if (e.country) unique.add(e.country);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [exhibitors]);

  const countryOptions: { value: string; label: string }[] = useMemo(
    () => [
      { value: "all", label: "All Countries" },
      ...countries.map((c) => ({ value: c, label: c })),
    ],
    [countries],
  );

  /* ---------- Filtered + sorted list ---------- */
  const processedExhibitors = useMemo(() => {
    let list = exhibitors;

    // Search filter (company name)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        e.company_name.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }

    // Country filter
    if (countryFilter !== "all") {
      list = list.filter((e) => e.country === countryFilter);
    }

    // Sort
    list = [...list].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      switch (sort.field) {
        case "company_name":
          aVal = a.company_name.toLowerCase();
          bVal = b.company_name.toLowerCase();
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "country":
          aVal = (a.country ?? "").toLowerCase();
          bVal = (b.country ?? "").toLowerCase();
          break;
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [exhibitors, search, statusFilter, countryFilter, sort]);

  /* ---------- Pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(processedExhibitors.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, processedExhibitors.length);
  const paginatedExhibitors = processedExhibitors.slice(startIndex, endIndex);

  /* Reset to page 1 when filters change */
  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusFilter(value: string | null) {
    setStatusFilter(value ?? "all");
    setCurrentPage(1);
  }

  function handleCountryFilter(value: string | null) {
    setCountryFilter(value ?? "all");
    setCurrentPage(1);
  }

  /* ---------- Sort handler ---------- */
  function handleSort(field: SortField) {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
    setCurrentPage(1);
  }

  /* ---------- Sort icon ---------- */
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
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exhibitors..."
            className="h-11 rounded-xl bg-secondary/50 pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="h-9 min-w-[140px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Country filter */}
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
                  onClick={() => handleSort("company_name")}
                >
                  Company
                  <SortIcon field="company_name" />
                </button>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("status")}
                >
                  Status
                  <SortIcon field="status" />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedExhibitors.map((exhibitor) => {
              const statusConfig =
                EXHIBITOR_STATUS_CONFIG[exhibitor.status as ExhibitorStatus];
              const initials = exhibitor.company_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <TableRow key={exhibitor.id}>
                  <TableCell>
                    <Link
                      href={`/exhibitors/${exhibitor.id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {exhibitor.company_name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {exhibitor.contact_person}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {exhibitor.contact_email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(statusConfig.color)}
                    >
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {exhibitor.country ?? "\u2014"}
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedExhibitors.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No exhibitors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {processedExhibitors.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}&ndash;{endIndex} of{" "}
              {processedExhibitors.length}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
