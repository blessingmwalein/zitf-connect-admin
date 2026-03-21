import { STAND_STATUS_CONFIG, type StandStatus } from "@/lib/constants";

const STATUS_COLORS: Record<StandStatus, string> = {
  available: "#34C759",
  reserved: "#FF9500",
  booked: "#007AFF",
  unavailable: "#8E8E93",
};

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl bg-card/80 px-3 py-2 backdrop-blur-sm">
      {(Object.keys(STATUS_COLORS) as StandStatus[]).map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: STATUS_COLORS[status] }}
          />
          <span className="text-caption-1 text-muted-foreground">
            {STAND_STATUS_CONFIG[status].label}
          </span>
        </div>
      ))}
    </div>
  );
}

export { STATUS_COLORS };
