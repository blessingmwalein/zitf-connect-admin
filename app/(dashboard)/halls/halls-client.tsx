"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Users, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface HallItem {
  id: string;
  name: string;
  description: string;
  capacity: number;
  stand_count: number;
  is_active: boolean;
  display_order: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface HallsClientProps {
  halls: HallItem[];
}

export function HallsClient({ halls }: HallsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return halls.filter((hall) => {
      const matchesSearch = hall.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? hall.is_active
            : !hall.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [halls, search, statusFilter]);

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search halls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val ?? "all")}
        >
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
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <p className="text-headline text-muted-foreground">No halls found</p>
          <p className="mt-1 text-footnote text-muted-foreground">
            {halls.length === 0
              ? "Create your first hall to get started."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hall) => (
            <Link key={hall.id} href={`/halls/${hall.id}`} className="group">
              <Card className="ios-card transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-headline">{hall.name}</CardTitle>
                    <Badge
                      className={cn(
                        "shrink-0",
                        hall.is_active
                          ? "bg-ios-green/15 text-ios-green"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {hall.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-footnote">
                    {hall.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-footnote text-muted-foreground">
                      <Users className="size-3.5" />
                      <span>
                        Capacity:{" "}
                        <span className="font-medium text-foreground">
                          {hall.capacity?.toLocaleString() ?? "N/A"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-footnote text-muted-foreground">
                      <MapPin className="size-3.5" />
                      <span>
                        Stands:{" "}
                        <span className="font-medium text-foreground">
                          {hall.stand_count}
                        </span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
