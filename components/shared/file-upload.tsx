"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  preview?: string | null;
  label?: string;
  className?: string;
}

export function FileUpload({
  accept = "image/*",
  maxSizeMB = 2,
  onFileSelect,
  onRemove,
  preview,
  label = "Upload file",
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be under ${maxSizeMB}MB`);
        return;
      }
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (preview) {
    return (
      <div className={cn("relative inline-block", className)}>
        <img
          src={preview}
          alt="Preview"
          className="h-24 w-24 rounded-xl object-cover shadow-sm"
        />
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8",
          "transition-colors duration-150",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-footnote font-medium text-foreground">{label}</p>
        <p className="mt-1 text-caption-1 text-muted-foreground">
          Drag & drop or click to browse
        </p>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      {error && (
        <p className="mt-2 text-caption-1 text-destructive">{error}</p>
      )}
    </div>
  );
}
