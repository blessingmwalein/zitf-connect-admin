"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NAV_ITEMS } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/app-config";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  { section: "global", label: "Global" },
  { section: "event", label: "Current Event" },
] as const;

export function MobileNavSheet() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                {APP_CONFIG.eventAbbrev[0]}
              </span>
            </div>
            <span className="text-headline text-foreground">{APP_CONFIG.platformName}</span>
          </div>
        </div>

        <ScrollArea className="h-[calc(100dvh-3.5rem)] px-3 py-2">
          {NAV_SECTIONS.map((section) => (
            <nav key={section.label} className="space-y-1 mb-6 last:mb-0">
              <p className="px-3 pb-1 text-caption-2 font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              {NAV_ITEMS.filter(
                (item) => item.section === section.section
              ).map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/overview" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium",
                      "transition-colors duration-150",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
