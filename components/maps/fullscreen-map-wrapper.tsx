"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FullscreenMapWrapperProps {
  children: ReactNode;
  className?: string;
}

export function FullscreenMapWrapper({ children, className }: FullscreenMapWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  return (
    <div
      className={cn(
        "relative",
        isFullscreen && "fixed inset-0 z-50 bg-background p-4",
        className
      )}
    >
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-2 z-[1001] size-8 bg-background/90 backdrop-blur-sm shadow-md"
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? (
          <Minimize2 className="size-4" />
        ) : (
          <Maximize2 className="size-4" />
        )}
      </Button>

      <div className={cn("h-full w-full", isFullscreen && "rounded-xl overflow-hidden")}>
        {children}
      </div>
    </div>
  );
}
