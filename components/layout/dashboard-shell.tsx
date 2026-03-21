"use client";

import { Sidebar } from "./sidebar";
import { AppBar } from "./app-bar";
import { TabBar } from "./tab-bar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 z-[200]">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-[260px]">
        {/* AppBar with frosted glass */}
        <header className="sticky top-0 z-[200] glass-nav">
          <AppBar />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 px-4 lg:px-8 py-6 scrollbar-thin">
          {children}
        </main>

        {/* Mobile TabBar */}
        <nav className="fixed bottom-0 inset-x-0 lg:hidden z-[200] glass-tab">
          <TabBar />
        </nav>
      </div>
    </div>
  );
}
