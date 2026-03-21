"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TAB_BAR_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TabBar() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-around h-[50px] safe-area-bottom">
      {TAB_BAR_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/overview" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 min-w-[64px]",
              "transition-colors duration-150",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
            <span className="text-caption-2 font-medium">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
