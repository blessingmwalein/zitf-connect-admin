"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapSkeleton } from "@/components/maps/map-skeleton";
import { FullscreenMapWrapper } from "@/components/maps/fullscreen-map-wrapper";

const VenueMapInner = dynamic(
  () => import("./venue-map-inner").then((m) => m.VenueMapInner),
  { ssr: false, loading: () => <MapSkeleton className="h-[70vh]" /> }
);

interface Hall {
  id: string;
  name: string;
  geo_polygon: [number, number][] | null;
  geo_center: [number, number] | null;
}

interface Stand {
  id: string;
  stand_number: string;
  hall_id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  exhibitor_name: string | null;
  geo_polygon: [number, number][] | null;
}

interface VenueMapClientProps {
  halls: Hall[];
  stands: Stand[];
}

export function VenueMapClient({ halls, stands }: VenueMapClientProps) {
  const [search, setSearch] = useState("");
  const [selectedExhibitor, setSelectedExhibitor] = useState<Stand | null>(null);

  const exhibitorStands = useMemo(() => {
    return stands.filter((s) => s.exhibitor_name);
  }, [stands]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return exhibitorStands
      .filter((s) => s.exhibitor_name!.toLowerCase().includes(q))
      .slice(0, 8);
  }, [exhibitorStands, search]);

  function handleSelect(stand: Stand) {
    setSelectedExhibitor(stand);
    setSearch("");
  }

  function clearSelection() {
    setSelectedExhibitor(null);
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exhibitor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Search dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border bg-card shadow-lg max-h-[240px] overflow-y-auto">
            {searchResults.map((stand) => (
              <button
                key={stand.id}
                type="button"
                onClick={() => handleSelect(stand)}
                className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors text-sm border-b last:border-b-0"
              >
                <p className="font-medium">{stand.exhibitor_name}</p>
                <p className="text-caption-1 text-muted-foreground">
                  Stand {stand.stand_number}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedExhibitor && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
          <span className="text-sm font-medium text-primary">
            Navigating to: {selectedExhibitor.exhibitor_name} (Stand {selectedExhibitor.stand_number})
          </span>
          <Button variant="ghost" size="icon" className="size-6" onClick={clearSelection}>
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Map */}
      <FullscreenMapWrapper className="h-[70vh] rounded-xl overflow-hidden">
        <VenueMapInner
          halls={halls}
          stands={stands}
          selectedStand={selectedExhibitor}
        />
      </FullscreenMapWrapper>
    </div>
  );
}
