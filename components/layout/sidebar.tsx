"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/app-config";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_SECTIONS = [
  { section: "global", label: "Global" },
  { section: "event", label: "Current Event" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Link href="/overview" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">{APP_CONFIG.eventAbbrev[0]}</span>
          </div>
          <span className="text-headline text-foreground">{APP_CONFIG.platformName}</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <nav key={section.label} className="space-y-1 mb-6 last:mb-0">
            <p className="px-3 pb-1 text-caption-2 font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            {NAV_ITEMS.filter((item) => item.section === section.section).map(
              (item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/overview" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium tracking-tight",
                      "transition-colors duration-150",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                    {item.title}
                  </Link>
                );
              }
            )}
          </nav>
        ))}
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-border p-4">
        <p className="text-caption-2 text-muted-foreground">
          {APP_CONFIG.adminName} v{APP_CONFIG.version}
        </p>
      </div>
    </div>
  );
}
