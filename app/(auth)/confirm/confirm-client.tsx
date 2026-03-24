"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type PageState = "verifying" | "success" | "error";

export function ConfirmClient() {
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function verifyEmail() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!tokenHash || type !== "signup") {
        setErrorMessage(
          "Invalid confirmation link. Please check your email and try again."
        );
        setPageState("error");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "signup",
      });

      if (error) {
        setErrorMessage(
          error.message || "This confirmation link has expired or is invalid."
        );
        setPageState("error");
      } else {
        await supabase.auth.signOut();
        setPageState("success");
      }
    }

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence mode="wait">
      {pageState === "verifying" && (
        <motion.div
          key="verifying"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-ios overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              </div>
              <h2 className="mt-6 text-title-3 text-foreground">
                Confirming Your Account
              </h2>
              <p className="mt-2 text-subheadline text-muted-foreground">
                Please wait while we verify your email...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {pageState === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
        >
          <Card className="border-0 shadow-ios overflow-hidden">
            {/* Success gradient banner */}
            <div className="h-2 bg-gradient-to-r from-ios-green via-ios-teal to-ios-blue" />

            <CardContent className="flex flex-col items-center justify-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <div className="relative">
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="size-5 text-ios-orange" />
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ios-green/10">
                    <CheckCircle2 className="size-10 text-ios-green" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h2 className="mt-6 text-title-2 text-foreground">
                  Account Confirmed!
                </h2>
                <p className="mt-3 text-subheadline text-muted-foreground max-w-[280px]">
                  Your email has been verified successfully. You can now sign in
                  to ZITF Connect.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 w-full space-y-3"
              >
                <Link href="/login" className="block">
                  <Button className="h-12 w-full rounded-2xl font-semibold ios-press text-[15px]">
                    Sign In Now
                  </Button>
                </Link>

                <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                  <p className="text-footnote text-muted-foreground">
                    You can also sign in using the ZITF Connect mobile app
                  </p>
                  <p className="mt-1 text-caption-1 text-muted-foreground">
                    Available on iOS and Android
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {pageState === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-ios overflow-hidden">
            {/* Error gradient banner */}
            <div className="h-2 bg-gradient-to-r from-ios-red via-ios-pink to-ios-orange" />

            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ios-red/10">
                <AlertCircle className="size-8 text-ios-red" />
              </div>

              <h2 className="mt-6 text-title-3 text-foreground text-center">
                Confirmation Failed
              </h2>
              <p className="mt-2 text-center text-subheadline text-muted-foreground max-w-[280px]">
                {errorMessage}
              </p>

              <div className="mt-8 w-full space-y-3">
                <Link href="/login" className="block">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-2xl font-medium"
                  >
                    Go to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
