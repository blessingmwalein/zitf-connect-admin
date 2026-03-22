"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { Search, X, Loader2 } from "lucide-react";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function AddressSearchControl() {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Prevent Leaflet from capturing clicks/scrolls/drags on this control
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  function selectResult(result: SearchResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.flyTo([lat, lng], 18, { duration: 1.5 });
    setOpen(false);
    setQuery(result.display_name);
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="leaflet-top leaflet-left"
      style={{ position: "absolute", top: 10, left: 50, zIndex: 1000 }}
    >
      <div className="rounded-xl bg-white shadow-lg" style={{ minWidth: 280 }}>
        <div className="flex items-center gap-2 p-2">
          <Search className="size-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search address..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          {loading && <Loader2 className="size-4 animate-spin text-gray-400" />}
          {query && !loading && (
            <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-600">
              <X className="size-4" />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="border-t max-h-[200px] overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 border-b last:border-b-0 line-clamp-2"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}

        {open && results.length === 0 && !loading && (
          <div className="border-t px-3 py-2 text-xs text-gray-400">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
