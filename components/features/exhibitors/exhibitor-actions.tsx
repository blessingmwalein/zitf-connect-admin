"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  approveExhibitor,
  rejectExhibitor,
} from "@/services/invite.service";
import type { ExhibitorStatus } from "@/lib/constants";

interface ExhibitorActionsProps {
  exhibitorId: string;
  currentStatus: ExhibitorStatus;
  contactEmail: string;
  hasAuthAccount: boolean;
}

export function ExhibitorActions({
  exhibitorId,
  currentStatus,
}: ExhibitorActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleApprove() {
    setIsLoading(true);
    try {
      const result = await approveExhibitor(exhibitorId);
      if (result.error) {
        toast.error("Failed to approve exhibitor", {
          description: result.error,
        });
        return;
      }
      toast.success("Exhibitor approved");
      setApproveOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    setIsLoading(true);
    try {
      const result = await rejectExhibitor(
        exhibitorId,
        rejectReason || undefined,
      );
      if (result.error) {
        toast.error("Failed to reject exhibitor", {
          description: result.error,
        });
        return;
      }
      toast.success("Exhibitor rejected");
      setRejectOpen(false);
      setRejectReason("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (currentStatus !== "pending") return null;

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5 bg-ios-green hover:bg-ios-green/90 text-white"
        onClick={() => setApproveOpen(true)}
      >
        <CheckCircle2 className="size-4" />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-ios-red border-ios-red/30 hover:bg-ios-red/10"
        onClick={() => setRejectOpen(true)}
      >
        <XCircle className="size-4" />
        Reject
      </Button>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Approve Exhibitor</DialogTitle>
            <DialogDescription>
              This will change the exhibitor&apos;s status to approved.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-ios-green hover:bg-ios-green/90 text-white"
              onClick={handleApprove}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Approving...
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Exhibitor</DialogTitle>
            <DialogDescription>
              This will change the exhibitor&apos;s status to rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="Provide a reason for rejection..."
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
