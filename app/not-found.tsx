import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary/20">404</p>
        <h1 className="mt-4 text-title-1 text-foreground">Page not found</h1>
        <p className="mt-2 text-subheadline text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/overview">
          <Button className="mt-6 rounded-2xl ios-press">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
