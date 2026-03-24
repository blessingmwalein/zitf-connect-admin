"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validators/auth";
import { updatePassword } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type PageState = "verifying" | "form" | "success" | "error";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("verifying");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkSessionOrToken() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      // 1. Check if we have a recovery token
      if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (verifyError) {
          setError(verifyError.message);
          setPageState("error");
          return;
        }
        setPageState("form");
        return;
      }

      // 2. Check if we already have a session (e.g. redirected from callback)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState("form");
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
        setPageState("error");
      }
    }

    checkSessionOrToken();
  }, [searchParams, supabase.auth]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setError(null);
    const result = await updatePassword(data.password);
    if (result?.error) {
      setError(result.error);
    } else {
      setPageState("success");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {pageState === "verifying" && (
        <motion.div
          key="verifying"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          <Card className="border-0 shadow-ios">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-4 text-subheadline text-muted-foreground">
                Verifying reset link...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {pageState === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-ios">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ios-red/10">
                <AlertCircle className="size-7 text-ios-red" />
              </div>
              <h2 className="mt-4 text-title-3 text-foreground">Link Invalid</h2>
              <p className="mt-2 text-center text-subheadline text-muted-foreground max-w-[280px]">
                {error}
              </p>
              <Link href="/forgot-password" title="Forgot Password" className="mt-6 w-full">
                <Button variant="outline" className="w-full h-11 rounded-2xl">
                  Request New Link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {pageState === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-ios">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ios-green/10">
                <CheckCircle2 className="size-7 text-ios-green" />
              </div>
              <h2 className="mt-4 text-title-3 text-foreground">Password Reset!</h2>
              <p className="mt-2 text-center text-subheadline text-muted-foreground">
                Your password has been updated successfully.
              </p>
              <Link href="/login" title="Login" className="mt-6 w-full">
                <Button className="w-full h-11 rounded-2xl font-semibold ios-press">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {pageState === "form" && (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-ios">
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4 pt-6">
                <div className="text-center mb-2">
                  <h2 className="text-title-3 text-foreground">Set New Password</h2>
                  <p className="mt-1 text-subheadline text-muted-foreground">
                    Choose a strong password for your account.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    {...register("password")}
                    className="h-11 rounded-xl bg-secondary/50"
                  />
                  {errors.password && (
                    <p className="text-caption-1 text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    {...register("confirmPassword")}
                    className="h-11 rounded-xl bg-secondary/50"
                  />
                  {errors.confirmPassword && (
                    <p className="text-caption-1 text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-2xl font-semibold ios-press"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
