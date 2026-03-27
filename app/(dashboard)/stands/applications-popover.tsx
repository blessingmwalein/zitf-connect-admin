"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  getPendingStandApplications, 
  approveStand, 
  rejectStand 
} from "@/services/stand.service";

export function ApplicationsPopover() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      const { data, error } = await getPendingStandApplications();
      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error("Failed to load applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    
    // Refresh periodically or on focus could be added here
    const interval = setInterval(loadApplications, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string, standNumber: string) => {
    setProcessingId(id);
    try {
      const { error } = await approveStand(id);
      if (error) throw error;
      toast.success(`Stand ${standNumber} approved`);
      await loadApplications();
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to approve", { description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, standNumber: string) => {
    setProcessingId(id);
    try {
      const { error } = await rejectStand(id);
      if (error) throw error;
      toast.success(`Stand ${standNumber} application rejected`);
      await loadApplications();
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to reject", { description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" size="icon" className="relative h-11 w-11 rounded-2xl bg-background border-0 shadow-ios transition-all active:scale-95 group">
          <Bell className="size-5 text-muted-foreground group-hover:text-ios-blue transition-colors" />
          {applications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ios-red text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in duration-300">
              {applications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-[28px] overflow-hidden border-0 shadow-2xl ring-1 ring-black/5">
        <div className="bg-secondary/50 p-4 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-bold tracking-tight">Stand Applications</h3>
            <Badge variant="secondary" className="bg-ios-blue/10 text-ios-blue border-0 rounded-lg">
              {applications.length} Pending
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">Review and approve exhibition space requests</p>
        </div>
        
        <Separator />
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground/30" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center p-6">
              <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                <Bell className="size-7 text-muted-foreground/20" />
              </div>
              <p className="font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">No pending stand applications found at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {applications.map((app) => (
                <div key={app.id} className="p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-ios-blue uppercase tracking-tight">Stand {app.stand_number}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground border-muted shadow-none h-4 px-1">
                          {app.halls?.name}
                        </Badge>
                      </div>
                      <p className="text-[14px] font-semibold leading-tight line-clamp-1">{app.exhibitors?.company_name}</p>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Info className="size-3" />
                        <p className="text-[12px]">{app.area_sqm}m² &bull; ${app.price?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                    <Button 
                      onClick={() => handleApprove(app.id, app.stand_number)}
                      disabled={!!processingId}
                      className="flex-1 h-9 rounded-xl bg-ios-green hover:bg-ios-green/90 text-white font-bold text-[13px] shadow-sm flex items-center gap-1.5"
                    >
                      {processingId === app.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      Approve
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleReject(app.id, app.stand_number)}
                      disabled={!!processingId}
                      className="flex-1 h-9 rounded-xl border-ios-red/20 text-ios-red hover:bg-ios-red/5 hover:border-ios-red font-bold text-[13px]"
                    >
                      {processingId === app.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="bg-secondary/30 p-3 text-center">
          <Link href="/exhibitors" className="text-[13px] font-bold text-ios-blue hover:underline">
            View All Exhibitors
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
