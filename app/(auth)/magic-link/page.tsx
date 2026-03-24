"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithMagicLink } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export default function MagicLinkPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  async function onSubmit(data: MagicLinkFormData) {
    setError(null);
    const result = await signInWithMagicLink(data.email);
    if (result?.error) {
      setError(result.error);
    } else {
      setSentEmail(data.email);
      setSent(true);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
        >
          <Card className="border-0 shadow-ios overflow-hidden">
            {/* Brand gradient */}
            <div className="h-2 bg-gradient-to-r from-primary via-ios-orange to-ios-teal" />

            <CardContent className="flex flex-col items-center justify-center py-12">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <div className="relative">
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="size-8 text-primary" />
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
                  Check Your Email
                </h2>
                <p className="mt-3 text-subheadline text-muted-foreground max-w-[280px]">
                  We sent a magic link to
                </p>
                <p className="mt-1 text-headline text-foreground">
                  {sentEmail}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 w-full space-y-4"
              >
                <div className="rounded-2xl bg-secondary/50 p-4 space-y-2">
                  <p className="text-footnote text-muted-foreground text-center">
                    Click the link in your email to sign in instantly.
                    <br />
                    No password needed!
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <Button
                    variant="ghost"
                    className="rounded-2xl text-footnote"
                    onClick={() => {
                      setSent(false);
                      setError(null);
                    }}
                  >
                    Didn&apos;t receive it? Try again
                  </Button>

                  <Link
                    href="/login"
                    className="text-footnote text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="size-3" />
                    Back to login
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-ios overflow-hidden">
            {/* Brand gradient */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-ios-orange to-ios-teal" />

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-5 pt-6">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <Sparkles className="size-6 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-title-3 text-foreground">
                    Sign in with Magic Link
                  </h2>
                  <p className="mt-2 text-subheadline text-muted-foreground">
                    Enter your email and we&apos;ll send you a link to sign in
                    instantly — no password required.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
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
                  {isSubmitting ? (
                    <>
                      <Mail className="mr-2 size-4 animate-pulse" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 size-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-footnote text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="size-3" />
                    Back to login
                  </Link>
                </div>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
