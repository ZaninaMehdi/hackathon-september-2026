"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { Avatar } from "@/components/ui/Avatar";
import { BookingsIcon, EventsIcon, GivingIcon, OverviewIcon, ProjectsIcon } from "@/components/dashboard/NavIcons";

const NAV_ITEMS = [
  { label: "Overview", icon: OverviewIcon, href: "/dashboard" },
  { label: "Projects", icon: ProjectsIcon, href: "/dashboard/projects" },
  { label: "Giving", icon: GivingIcon, href: null },
  { label: "Events", icon: EventsIcon, href: "/events" },
  { label: "Bookings", icon: BookingsIcon, href: null },
] as const;

type AppShellProps = {
  email: string | null;
  roles: string[];
  children: React.ReactNode;
};

export function AppShell({ email, roles, children }: AppShellProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1280px] bg-surface">
      {/* Sidebar — hidden below 900px (bottom tab bar takes over), icon-only
          from 900-1199px, full width with labels from 1200px up. Persistent
          across every route in this (app) group. */}
      <aside className="sticky top-0 hidden h-svh w-[60px] shrink-0 flex-col gap-[22px] overflow-y-auto border-r border-hairline bg-surface-sunken px-2 py-4.5 min-[900px]:flex min-[1200px]:w-[216px] min-[1200px]:px-3.5">
        <div className="flex justify-center px-1.5 min-[1200px]:justify-start">
          <div className="min-[1200px]:hidden">
            <Mark size={22} />
          </div>
          <div className="hidden min-[1200px]:block">
            <Logo markSize={22} textClassName="text-[15px]" />
          </div>
        </div>

        <nav className="flex flex-col gap-2.5">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = href ? isActive(href) : false;
            return href ? (
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
              </Link>
            ) : (
              <div
                key={label}
                title={`${label} — coming soon`}
                className="flex items-center justify-center gap-2.5 rounded-md px-2.5 py-[9px] opacity-40 min-[1200px]:justify-start"
              >
                <Icon className="text-body" />
                <span className="hidden text-[13.5px] text-body min-[1200px]:inline">{label}</span>
                <span className="hidden font-mono text-[9px] uppercase text-muted min-[1200px]:ml-auto min-[1200px]:inline">
                  Soon
                </span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center justify-center gap-2.5 border-t border-hairline pt-3.5 min-[1200px]:justify-start">
          <Avatar initials={(email ?? "?").slice(0, 2).toUpperCase()} size={26} />
          <div className="hidden flex-col min-[1200px]:flex">
            <span className="text-[12.5px] font-semibold text-ink">{email}</span>
            <span className="text-[11px] text-muted">{roles.join(", ") || "Member"}</span>
          </div>
        </div>
      </aside>

      {/* Main pane */}
      <main className="min-w-0 flex-1 pb-16 min-[900px]:pb-0">{children}</main>

      {/* Bottom tab bar — below 900px only */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-hairline bg-surface-raised py-2 min-[900px]:hidden">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = href ? isActive(href) : false;
          return href ? (
            <Link key={label} href={href} className="flex flex-col items-center gap-1 px-2">
              <Icon className={active ? "text-accent" : "text-body"} />
              <span className={`text-[10px] ${active ? "font-semibold text-accent" : "text-body"}`}>
                {label}
              </span>
            </Link>
          ) : (
            <div key={label} className="flex flex-col items-center gap-1 px-2 opacity-40">
              <Icon className="text-body" />
              <span className="text-[10px] text-body">{label}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
