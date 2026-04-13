"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, X, Flame, Users, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapSkeleton } from "@/components/maps/map-skeleton";
import { FullscreenMapWrapper } from "@/components/maps/fullscreen-map-wrapper";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

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

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export function VenueMapClient({ halls, stands }: VenueMapClientProps) {
  const [search, setSearch] = useState("");
  const [selectedExhibitor, setSelectedExhibitor] = useState<Stand | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPeople, setShowPeople] = useState(true);
  const [heatmapRadius, setHeatmapRadius] = useState(25);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;

    async function pollHeatmap() {
      if (!mounted) return;
      setIsPolling(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/tracking/heatmap/live`, {
          method: "GET",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!mounted) return;

        setHeatmapPoints(Array.isArray(data?.points) ? data.points : []);
        setLastUpdate(new Date().toISOString());
      } catch {
        // Keep existing points if polling fails temporarily.
      } finally {
        if (mounted) setIsPolling(false);
      }
    }

    pollHeatmap();
    const intervalId = window.setInterval(pollHeatmap, 10000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const lastUpdateLabel = useMemo(() => {
    if (!lastUpdate) return "Never";
    return new Date(lastUpdate).toLocaleTimeString();
  }, [lastUpdate]);

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

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setShowHeatmap((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption-1 font-medium transition-all ${
            showHeatmap
              ? "bg-ios-orange/10 text-ios-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          Heatmap
        </button>

        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption-1 font-medium transition-all ${
            showPeople
              ? "bg-ios-green/10 text-ios-green"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          People
        </button>

        <div className="flex items-center gap-2">
          <span className="text-caption-2 text-muted-foreground">Radius</span>
          <input
            type="range"
            min={10}
            max={50}
            value={heatmapRadius}
            onChange={(e) => setHeatmapRadius(parseInt(e.target.value, 10))}
            className="w-20 accent-primary"
          />
          <span className="w-6 text-caption-2 text-muted-foreground">{heatmapRadius}</span>
        </div>

        <div className="ml-auto flex items-center gap-2 text-caption-2 text-muted-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${isPolling ? "animate-spin" : ""}`} />
          {heatmapPoints.length} points
          <span className="text-border">•</span>
          Updated {lastUpdateLabel}
        </div>
      </div>

      {/* Map */}
      <FullscreenMapWrapper className="h-[70vh] rounded-xl overflow-hidden">
        <VenueMapInner
          halls={halls}
          stands={stands}
          selectedStand={selectedExhibitor}
          heatmapPoints={heatmapPoints}
          showHeatmap={showHeatmap}
          showPeopleMarkers={showPeople}
          heatmapRadius={heatmapRadius}
        />
      </FullscreenMapWrapper>
    </div>
  );
}
