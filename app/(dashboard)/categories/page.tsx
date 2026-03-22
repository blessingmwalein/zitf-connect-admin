"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ZITF_CATEGORIES } from "@/lib/constants/categories";

export default function CategoriesPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ZITF_CATEGORIES;
    const q = search.trim().toLowerCase();
    return ZITF_CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="ZITF exhibitor categories and industry classifications"
      />

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="h-11 rounded-xl bg-secondary/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="secondary" className="shrink-0">
          {filtered.length} categories
        </Badge>
      </div>

      <div className="rounded-2xl border bg-card shadow-ios">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Category Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-mono text-muted-foreground">
                  {cat.id}
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-24 text-center text-muted-foreground"
                >
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
