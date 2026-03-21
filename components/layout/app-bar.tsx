"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { NAV_ITEMS } from "@/lib/constants";

export function AppBar() {
  const pathname = usePathname();

  /* Derive page title from nav items */
  const currentNav = NAV_ITEMS.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/overview" && pathname.startsWith(item.href))
  );
  const pageTitle = currentNav?.title ?? "Dashboard";

  return (
    <div className="flex h-14 items-center justify-between px-4 lg:px-8">
      {/* Left: Mobile menu + page title */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <MobileNavSheet />
        </div>
        <h1 className="text-headline text-foreground">{pageTitle}</h1>
      </div>

      {/* Right: Theme toggle + user menu */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  );
}
