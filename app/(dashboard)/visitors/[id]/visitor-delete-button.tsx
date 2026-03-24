"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteVisitor } from "@/services/visitor.service";

export function VisitorDeleteButton({ visitorId }: { visitorId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    try {
      const result = await deleteVisitor(visitorId);
      if (result.error) {
        toast.error("Failed to delete visitor", {
          description: result.error.message,
        });
        return;
      }
      toast.success("Visitor deleted");
      router.push("/visitors");
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
        title="Delete Visitor"
        description="Are you sure you want to delete this visitor? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
