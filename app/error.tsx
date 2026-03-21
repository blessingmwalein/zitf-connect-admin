"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">&#x26A0;&#xFE0F;</div>
        <h1 className="text-title-1 text-foreground">Something went wrong</h1>
        <p className="mt-2 max-w-md text-subheadline text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={reset} className="mt-6 rounded-2xl ios-press">
          Try Again
        </Button>
      </div>
    </div>
  );
}
