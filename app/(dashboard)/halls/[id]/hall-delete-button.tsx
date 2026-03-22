"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteHall } from "@/services/hall.service";

export function HallDeleteButton({ hallId }: { hallId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    try {
      const result = await deleteHall(hallId);
      if (result.error) {
        toast.error("Failed to delete hall", { description: result.error.message });
        return;
      }
      toast.success("Hall deleted");
      router.push("/halls");
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
        title="Delete Hall"
        description="Are you sure? All stands in this hall will be unassigned."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
