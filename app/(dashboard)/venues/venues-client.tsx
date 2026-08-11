"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteVenue } from "@/services/venue.service";

export interface VenueItem {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

interface VenuesClientProps {
  venues: VenueItem[];
}

export function VenuesClient({ venues }: VenuesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return venues.filter((venue) =>
      venue.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [venues, search]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const result = await deleteVenue(deleteId);
      if (result.error) {
        toast.error("Failed to delete venue", { description: result.error.message });
        return;
      }
      toast.success("Venue deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <p className="text-headline text-muted-foreground">
            {venues.length === 0 ? "No venues yet." : "No venues found"}
          </p>
          <p className="mt-1 text-footnote text-muted-foreground">
            {venues.length === 0
              ? "Create your first venue to get started."
              : "Try adjusting your search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((venue) => (
            <Card key={venue.id} className="ios-card relative transition-shadow hover:shadow-lg">
              {/* Action menu */}
              <div className="absolute right-3 top-3 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="size-8 bg-background/80 backdrop-blur-sm">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/venues/${venue.id}`)}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(venue.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/venues/${venue.id}`} className="group">
                <CardHeader>
                  <div className="flex items-start justify-between pr-10">
                    <CardTitle className="text-headline">{venue.name}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 text-footnote">
                    {venue.address || "No address on file"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Separator className="mb-4" />
                  <div className="flex items-center gap-2 text-footnote text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span>
                      {[venue.city, venue.country].filter(Boolean).join(", ") ||
                        "Location not set"}
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Venue"
        description="Are you sure you want to delete this venue? Events referencing this venue may be affected."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
