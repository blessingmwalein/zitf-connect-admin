"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrowserClient } from "@supabase/ssr";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

type PageState = "verifying" | "set-password" | "success" | "error";

export function InviteConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    async function verifyToken() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!tokenHash || type !== "invite") {
        setErrorMessage(
          "Invalid or expired invitation link. Please request a new invitation.",
        );
        setPageState("error");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "invite",
      });

      if (error) {
        setErrorMessage(error.message);
        setPageState("error");
      } else {
        setPageState("set-password");
      }
    }

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: PasswordFormData) {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setErrorMessage(error.message);
      setPageState("error");
      return;
    }

    // Sign out after setting password (they'll use the mobile app)
    await supabase.auth.signOut();
    setPageState("success");
  }

  if (pageState === "verifying") {
    return (
      <Card className="border-0 shadow-ios">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-4 text-subheadline text-muted-foreground">
            Verifying your invitation...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (pageState === "error") {
    return (
      <Card className="border-0 shadow-ios">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ios-red/10">
            <AlertCircle className="size-7 text-ios-red" />
          </div>
          <h2 className="mt-4 text-title-3 text-foreground">
            Verification Failed
          </h2>
          <p className="mt-2 text-center text-subheadline text-muted-foreground">
            {errorMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (pageState === "success") {
    return (
      <Card className="border-0 shadow-ios">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ios-green/10">
            <CheckCircle2 className="size-7 text-ios-green" />
          </div>
          <h2 className="mt-4 text-title-3 text-foreground">Account Ready!</h2>
          <p className="mt-2 text-center text-subheadline text-muted-foreground">
            Your ZITF Connect account has been set up successfully. You can now
            sign in using the ZITF mobile app.
          </p>
          <Button
            className="mt-6 h-11 rounded-2xl font-semibold ios-press"
            onClick={() => router.push("/invite/success")}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // set-password state
  return (
    <Card className="border-0 shadow-ios">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          <div className="text-center">
            <h2 className="text-title-3 text-foreground">Set Your Password</h2>
            <p className="mt-1 text-subheadline text-muted-foreground">
              Create a password for your ZITF Connect exhibitor account.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Setting password...
              </>
            ) : (
              "Set Password"
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
