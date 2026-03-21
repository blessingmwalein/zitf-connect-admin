"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth.store";

export default function SettingsPage() {
  const profile = useAuthStore((s) => s.profile);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile and application preferences"
      />

      {/* Profile section */}
      <section className="ios-card rounded-2xl p-5">
        <h3 className="text-headline text-foreground">Profile</h3>
        <p className="mt-0.5 text-footnote text-muted-foreground">
          Your account information
        </p>

        <Separator className="my-4" />

        <div className="grid max-w-lg gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Full name</Label>
            <Input
              id="settings-name"
              placeholder="Your name"
              defaultValue={profile?.full_name ?? ""}
              readOnly
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-email">Email address</Label>
            <Input
              id="settings-email"
              type="email"
              placeholder="you@example.com"
              defaultValue={profile?.email ?? ""}
              readOnly
            />
          </div>
        </div>

        <p className="mt-3 text-caption-1 text-muted-foreground">
          Profile details are managed through your authentication provider.
        </p>
      </section>

      {/* Appearance section */}
      <section className="ios-card rounded-2xl p-5">
        <h3 className="text-headline text-foreground">Appearance</h3>
        <p className="mt-0.5 text-footnote text-muted-foreground">
          Customise how the dashboard looks
        </p>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-subheadline text-foreground">Theme</p>
            <p className="text-footnote text-muted-foreground">
              Toggle between light and dark mode
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* About section */}
      <section className="ios-card rounded-2xl p-5">
        <h3 className="text-headline text-foreground">About</h3>
        <p className="mt-0.5 text-footnote text-muted-foreground">
          Application version and information
        </p>

        <Separator className="my-4" />

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Application</dt>
            <dd className="text-foreground">ZITF Admin Dashboard</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono text-foreground">0.1.0</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Framework</dt>
            <dd className="text-foreground">Next.js 16</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Environment</dt>
            <dd className="text-foreground">
              {process.env.NODE_ENV ?? "development"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
