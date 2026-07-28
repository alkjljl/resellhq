"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BarChart3,
  Box,
  ChevronDown,
  CircleDollarSign,
  Contact,
  LayoutDashboard,
  ListChecks,
  Menu,
  Plug,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/logout-button";
import { cn } from "@/lib/cn";

const available = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Settings", href: "/settings/profile", icon: Settings },
] as const;

const upcoming = [
  { label: "Inventory", icon: Box },
  { label: "Listings", icon: ListChecks },
  { label: "Sales", icon: ShoppingBag },
  { label: "Expenses", icon: CircleDollarSign },
  { label: "Contacts", icon: Contact },
  { label: "Analytics", icon: BarChart3 },
  { label: "Integrations", icon: Plug },
] as const;

export function AppShell({
  children,
  email,
  displayName,
  workspaceName,
  themePreference,
}: {
  children: ReactNode;
  email: string;
  displayName: string;
  workspaceName: string;
  themePreference: "light" | "dark" | "system";
}) {
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <ThemePreferenceSync preference={themePreference} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-[var(--line)] bg-[var(--sidebar)] xl:block">
        <Sidebar workspaceName={workspaceName} />
      </aside>
      <div className="xl:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6 lg:px-8">
          <MobileNavigation workspaceName={workspaceName} />
          <div className="ml-3 min-w-0 flex-1 xl:ml-0">
            <p className="truncate text-xs font-medium text-[var(--ink-faint)]">
              Current workspace
            </p>
            <p className="truncate text-sm font-semibold">{workspaceName}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeMenu />
            <UserMenu
              displayName={displayName}
              email={email}
              workspaceName={workspaceName}
            />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function ThemePreferenceSync({
  preference,
}: {
  preference: "light" | "dark" | "system";
}) {
  const { setTheme } = useTheme();
  const lastSynced = useRef<string | null>(null);
  useEffect(() => {
    if (lastSynced.current !== preference) {
      setTheme(preference);
      lastSynced.current = preference;
    }
  }, [preference, setTheme]);
  return null;
}

function Sidebar({ workspaceName }: { workspaceName: string }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-[var(--line)] px-5">
        <Brand href="/dashboard" />
      </div>
      <div className="border-b border-[var(--line)] px-4 py-4">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
          Workspace
        </p>
        <p className="mt-1 truncate px-2 text-sm font-semibold">{workspaceName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Workspace">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
          Available now
        </p>
        <div className="space-y-1">
          {available.map((item) => {
            const current =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith("/settings");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[var(--ink-muted)] outline-none transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                  current &&
                    "bg-[var(--nav-active)] text-[var(--ink)] shadow-[inset_3px_0_var(--accent)]",
                )}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <p className="mt-7 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
          Upcoming
        </p>
        <div className="space-y-1">
          {upcoming.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                aria-disabled="true"
                className="flex min-h-9 items-center gap-3 rounded-md px-3 text-sm text-[var(--ink-faint)]"
              >
                <Icon className="size-[17px]" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-sm border border-[var(--line)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]">
                  Soon
                </span>
              </div>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-[var(--line)] p-4 text-xs leading-5 text-[var(--ink-faint)]">
        Phase 1 · Foundation
      </div>
    </div>
  );
}

function MobileNavigation({ workspaceName }: { workspaceName: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(88vw,300px)] border-r border-[var(--line)] bg-[var(--sidebar)] shadow-[var(--shadow-lg)] outline-none data-[state=open]:animate-[drawer-in_180ms_ease-out]">
          <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigate available ResellHQ sections.
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-10"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </Button>
          </Dialog.Close>
          <Sidebar workspaceName={workspaceName} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function UserMenu({
  displayName,
  email,
  workspaceName,
}: {
  displayName: string;
  email: string;
  workspaceName: string;
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "R";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="ml-1 flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 outline-none hover:bg-[var(--surface-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
          <span className="grid size-7 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-strong)]">
            {initial}
          </span>
          <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">
            {displayName}
          </span>
          <ChevronDown className="size-3.5 text-[var(--ink-faint)]" />
          <span className="sr-only">Open account menu</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(92vw,292px)] rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[var(--shadow-lg)]"
        >
          <div className="px-3 py-3">
            <p className="font-semibold">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--ink-muted)]">{email}</p>
            <p className="mt-2 truncate text-xs text-[var(--ink-faint)]">
              {workspaceName}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
          <DropdownMenu.Item asChild>
            <Link
              href="/settings/profile"
              className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm outline-none focus:bg-[var(--surface-subtle)]"
            >
              <UserRound className="size-4" /> Account settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
          <LogoutButton appearance="menu" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
