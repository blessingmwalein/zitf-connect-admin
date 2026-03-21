"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validators/auth";
import { resetPasswordRequest } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setError(null);
    const result = await resetPasswordRequest(data.email);
    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Card className="border-0 shadow-ios">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 text-4xl">&#x2709;&#xFE0F;</div>
          <h2 className="text-headline">Check your email</h2>
          <p className="mt-2 text-subheadline text-muted-foreground">
            We sent a password reset link to your email address.
          </p>
          <Link href="/login">
            <Button variant="ghost" className="mt-6 rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-ios">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          <p className="text-subheadline text-muted-foreground">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>

          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@zitf.com"
              {...register("email")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.email && (
              <p className="text-caption-1 text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-2xl font-semibold ios-press"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-footnote text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
