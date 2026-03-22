"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteExhibitor } from "@/services/exhibitor.service";

export function ExhibitorDeleteButton({ exhibitorId }: { exhibitorId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    try {
      const result = await deleteExhibitor(exhibitorId);
      if (result.error) {
        toast.error("Failed to delete exhibitor", { description: result.error.message });
        return;
      }
      toast.success("Exhibitor deleted");
      router.push("/exhibitors");
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Exhibitor"
        description="Are you sure you want to delete this exhibitor? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
