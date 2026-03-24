import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ResetPasswordClient } from "./reset-password-client";

function LoadingFallback() {
  return (
    <Card className="border-0 shadow-ios">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-4 text-subheadline text-muted-foreground">
          Verifying reset link...
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
