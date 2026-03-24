import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function InviteSuccessPage() {
  return (
    <Card className="border-0 shadow-ios">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ios-green/10">
          <CheckCircle2 className="size-8 text-ios-green" />
        </div>

        <h2 className="mt-6 text-title-2 text-foreground text-center">
          Your Account is Ready!
        </h2>

        <p className="mt-3 text-center text-subheadline text-muted-foreground max-w-sm">
          Your ZITF Connect exhibitor account has been successfully set up. You
          can now sign in to the ZITF mobile app using your email and password.
        </p>

        <div className="mt-8 rounded-2xl bg-secondary/50 p-4 text-center">
          <p className="text-footnote text-muted-foreground">
            Download the ZITF Connect app to get started
          </p>
          <p className="mt-1 text-caption-1 text-muted-foreground">
            Available on iOS and Android
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
