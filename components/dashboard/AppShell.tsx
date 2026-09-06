"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { Avatar } from "@/components/ui/Avatar";
import {
  BookingsIcon,
  EventsIcon,
  OverviewIcon,
  ProjectsIcon,
  SettingsIcon,
  TasksIcon,
} from "@/components/dashboard/NavIcons";
import { PendingCountBadge } from "@/components/services/PendingCountBadge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { label: "Overview", icon: OverviewIcon, href: "/dashboard" },
  { label: "Campaigns", icon: ProjectsIcon, href: "/dashboard/projects" },
  { label: "Tasks", icon: TasksIcon, href: "/dashboard/tasks" },
  { label: "Events", icon: EventsIcon, href: "/events" },
  { label: "Services", icon: BookingsIcon, href: "/services" },
  { label: "Settings", icon: SettingsIcon, href: "/dashboard/settings" },
] as const;

type AppShellProps = {
  orgName: string;
  orgLogoUrl?: string | null;
  email: string | null;
  roles: string[];
  pendingCount?: number;
  children: React.ReactNode;
};

export function AppShell({
  orgName,
  orgLogoUrl,
  email,
  roles,
  pendingCount = 0,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/services") {
      return pathname.startsWith("/services") || pathname.startsWith("/dashboard/officiant");
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1280px] bg-surface">
      {/* Sidebar — hidden below 900px (bottom tab bar takes over), icon-only
          from 900-1199px, full width with labels from 1200px up. Persistent
          across every route in this (app) group. */}
      <aside className="sticky top-0 hidden h-svh w-[60px] shrink-0 flex-col gap-[22px] overflow-y-auto border-r border-hairline bg-surface-sunken px-2 py-4.5 min-[900px]:flex min-[1200px]:w-[216px] min-[1200px]:px-3.5">
        <div className="flex flex-col items-center gap-2 px-1.5 min-[1200px]:items-start">
          {orgLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgLogoUrl}
              alt=""
              className="h-[22px] w-[22px] shrink-0 rounded-full object-cover min-[1200px]:h-7 min-[1200px]:w-7"
            />
          ) : (
            <>
              <div className="min-[1200px]:hidden">
                <Mark size={22} />
              </div>
              <div className="hidden min-[1200px]:block">
                <Logo size="sm" />
              </div>
            </>
          )}
          {orgName && (
            <p className="hidden min-w-0 font-sans text-[13px] font-semibold leading-snug text-ink min-[1200px]:block">
              {orgName}
            </p>
          )}
        </div>

        <nav className="flex flex-col gap-2.5">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={href}
                title={label}
                className={`flex items-center justify-center gap-2.5 rounded-md px-2.5 py-[9px] min-[1200px]:justify-start ${
                  active ? "bg-accent-wash" : ""
                }`}
              >
                <Icon className={active ? "text-ink" : "text-body"} />
                <span
                  className={`hidden text-[13.5px] min-[1200px]:inline ${active ? "font-semibold text-ink" : "text-body"}`}
                >
                  {label}
                </span>
                {href === "/services" && (
                  <span className="hidden min-[1200px]:ml-auto min-[1200px]:inline">
                    <PendingCountBadge count={pendingCount} />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1.5 border-t border-hairline pt-3.5">
          <div className="flex justify-center min-[1200px]:justify-start">
            <ThemeToggle showLabel labelClassName="hidden min-[1200px]:inline" />
          </div>
          <div className="flex items-center justify-center gap-2.5 min-[1200px]:justify-start">
            <Avatar initials={(email ?? "?").slice(0, 2).toUpperCase()} size={26} />
            <div className="hidden min-w-0 flex-col min-[1200px]:flex">
              <span className="truncate text-[12.5px] font-semibold text-ink">{email}</span>
              <span className="text-[11px] text-muted">{roles.join(", ") || "Member"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main pane */}
      <main className="min-w-0 flex-1 pb-16 min-[900px]:pb-0">{children}</main>

      {/* Bottom tab bar — below 900px only */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-hairline bg-surface-raised py-2 min-[900px]:hidden">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <Link key={label} href={href} className="relative flex flex-col items-center gap-1 px-2">
              <Icon className={active ? "text-accent" : "text-body"} />
              {href === "/services" && pendingCount > 0 && (
                <span className="absolute right-0 top-[-4px]">
                  <PendingCountBadge count={pendingCount} />
                </span>
              )}
              <span className={`text-[10px] ${active ? "font-semibold text-accent" : "text-body"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
