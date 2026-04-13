"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface ZoneOccupancy {
  zoneId: string;
  count: number;
}

export interface VenueStats {
  activeUsers: number;
  connectedClients: number;
  trackingClients: number;
  liveZoneOccupancy: ZoneOccupancy[];
}

interface UseTrackingSocketOptions {
  autoConnect?: boolean;
}

export function useTrackingSocket(options: UseTrackingSocketOptions = {}) {
  const { autoConnect = true } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [venueStats, setVenueStats] = useState<VenueStats>({
    activeUsers: 0,
    connectedClients: 0,
    trackingClients: 0,
    liveZoneOccupancy: [],
  });
  const [zoneOccupancy, setZoneOccupancy] = useState<ZoneOccupancy[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    // Get auth token for admin verification
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const socket = io(`${BACKEND_URL}/tracking`, {
      transports: ["websocket", "polling"],
      auth: {
        token: session?.access_token,
      },
    });

    socket.on("connect", () => {
      setIsConnected(true);
      // Subscribe to heatmap updates as admin
      socket.emit("heatmap:subscribe");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("heatmap:update", (data: { points: HeatmapPoint[]; timestamp: string }) => {
      setHeatmapPoints(data.points);
      setLastUpdate(data.timestamp);
    });

    socket.on("stats:update", (data: VenueStats) => {
      setVenueStats(data);
    });

    socket.on("zone:update", (data: { zones: ZoneOccupancy[]; timestamp: string }) => {
      setZoneOccupancy(data.zones);
    });

    socket.on("error", (data: { message: string }) => {
      console.error("[TrackingSocket] Error:", data.message);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("heatmap:unsubscribe");
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    heatmapPoints,
    venueStats,
    zoneOccupancy,
    lastUpdate,
    connect,
    disconnect,
  };
}
