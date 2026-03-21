"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { Exhibitor } from "@/types/database.types";
import type { ExhibitorStatus } from "@/lib/constants";
import { EXHIBITOR_STATUS_CONFIG } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export const columns: ColumnDef<Exhibitor>[] = [
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row }) => {
      const exhibitor = row.original;
      const initials = exhibitor.company_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {exhibitor.logo_url ? (
              <AvatarImage
                src={exhibitor.logo_url}
                alt={exhibitor.company_name}
              />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">
            {exhibitor.company_name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "contact_person",
    header: "Contact",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "contact_email",
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<ExhibitorStatus>();
      const config = EXHIBITOR_STATUS_CONFIG[status];
      return (
        <Badge variant="secondary" className={config.color}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {getValue<string | null>() ?? "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const exhibitor = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={<Link href={`/exhibitors/${exhibitor.id}`} />}
            >
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
