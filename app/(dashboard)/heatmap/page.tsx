"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FullscreenMapWrapper } from "@/components/maps/fullscreen-map-wrapper";
import { HeatmapMap } from "@/components/maps/heatmap-map";
import { Loader2, Play, RefreshCw, Users } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface LiveHeatmapResponse {
  points: HeatmapPoint[];
  activeUsers?: number;
}

export default function HeatmapPage() {
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [showPeople, setShowPeople] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [heatmapRadius, setHeatmapRadius] = useState(25);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const pollHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tracking/heatmap/live`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) return;

      const data: LiveHeatmapResponse = await res.json();
      setHeatmapPoints(Array.isArray(data.points) ? data.points : []);
      setActiveUsers(data.activeUsers ?? 0);
      setLastUpdate(new Date().toISOString());
    } catch {
      // Keep current data when polling fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await pollHeatmap();
    };

    run();
    const intervalId = window.setInterval(run, 10000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [pollHeatmap]);

  const lastUpdateText = useMemo(() => {
    if (!lastUpdate) return "Never";
    return new Date(lastUpdate).toLocaleTimeString();
  }, [lastUpdate]);

  const handleSimulateBurst = useCallback(async () => {
    setSimulating(true);
    setSimMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tracking/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 80, spreadMeters: 200 }),
      });
      const data = await res.json();
      setSimMessage(`${data.injected ?? 0} visitors simulated`);
      await pollHeatmap();
    } catch {
      setSimMessage("Simulation failed. Check backend status.");
    } finally {
      setSimulating(false);
    }
  }, [pollHeatmap]);

  const handleSimulateWalk = useCallback(async () => {
    setSimulating(true);
    setSimMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tracking/simulate/continuous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 40,
          durationSeconds: 120,
          intervalMs: 2000,
        }),
      });
      const data = await res.json();
      setSimMessage(data.message || "Continuous simulation started");
      await pollHeatmap();
    } catch {
      setSimMessage("Simulation failed. Check backend status.");
    } finally {
      setSimulating(false);
    }
  }, [pollHeatmap]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-1 font-bold">Proximity Heatmap</h1>
        <p className="text-callout text-muted-foreground">
          Standalone heatmap test page with REST polling and simulation controls.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card p-3 shadow-sm">
        <button
          type="button"
          onClick={handleSimulateBurst}
          disabled={simulating}
          className="flex items-center gap-1.5 rounded-lg bg-ios-blue/10 px-3 py-1.5 text-caption-1 font-medium text-ios-blue transition-all hover:bg-ios-blue/20 disabled:opacity-50"
        >
          {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Simulate 80
        </button>

        <button
          type="button"
          onClick={handleSimulateWalk}
          disabled={simulating}
          className="flex items-center gap-1.5 rounded-lg bg-ios-green/10 px-3 py-1.5 text-caption-1 font-medium text-ios-green transition-all hover:bg-ios-green/20 disabled:opacity-50"
        >
          {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Walk 2 min
        </button>

        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-caption-1 font-medium transition-all ${
            showPeople ? "bg-ios-orange/10 text-ios-orange" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          People
        </button>

        <button
          type="button"
          onClick={() => setShowZones((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-caption-1 font-medium transition-all ${
            showZones ? "bg-ios-purple/10 text-ios-purple" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Zones
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
          <Users className="h-3.5 w-3.5" />
          {activeUsers} active
          <span className="text-border">|</span>
          {heatmapPoints.length} points
          <span className="text-border">|</span>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {lastUpdateText}
        </div>
      </div>

      {simMessage && (
        <div className="rounded-lg border border-ios-blue/20 bg-ios-blue/5 px-4 py-2 text-caption-1 text-ios-blue">
          {simMessage}
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <FullscreenMapWrapper>
          <div className="h-[640px]">
            <HeatmapMap
              heatmapPoints={heatmapPoints}
              showZones={showZones}
              showPeopleMarkers={showPeople}
              heatmapRadius={heatmapRadius}
            />
          </div>
        </FullscreenMapWrapper>
      </div>
    </div>
  );
}
