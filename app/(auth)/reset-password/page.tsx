"use client";

import { useState } from "react";
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

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);

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
    }
  }

  return (
    <Card className="border-0 shadow-ios">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          <p className="text-subheadline text-muted-foreground">
            Enter your new password below.
          </p>

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
  );
}
