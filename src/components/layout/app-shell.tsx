"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BarChart3,
  Box,
  ChevronDown,
  CircleDollarSign,
  Contact,
  FileText,
  Headphones,
  LayoutDashboard,
  ListChecks,
  Menu,
  PackageCheck,
  Plug,
  Search,
  SlidersHorizontal,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";
import { WorkspaceMenu } from "@/components/shared/workspace-menu";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/logout-button";
import { NotificationPanel } from "@/features/notifications/notification-panel";
import { cn } from "@/lib/cn";
import { applicationBreadcrumb } from "@/lib/navigation/application-breadcrumb";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        available: true,
      },
    ],
  },
  {
    label: "Sell",
    items: [
      { label: "Inventory", icon: Box },
      { label: "Listings", icon: ListChecks },
      { label: "Sales", icon: PackageCheck },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Expenses", icon: CircleDollarSign },
      { label: "Payouts", icon: WalletCards, badge: "Soon" },
    ],
  },
  {
    label: "Understand",
    items: [
      { label: "Analytics", icon: BarChart3 },
      { label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Customers", icon: Contact },
      { label: "Integrations", icon: Plug },
      {
        label: "Settings",
        href: "/settings/profile",
        icon: SlidersHorizontal,
        available: true,
      },
    ],
  },
] as const;

export function AppShell({
  children,
  email,
  displayName,
  workspaceName,
  themePreference,
  userId,
}: {
  children: ReactNode;
  email: string;
  displayName: string;
  workspaceName: string;
  themePreference: "light" | "dark" | "system";
  userId: string;
}) {
  const pathname = usePathname();
  const breadcrumb = applicationBreadcrumb(pathname);

  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <ThemePreferenceSync preference={themePreference} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-[var(--line)] bg-[var(--sidebar)] xl:block">
        <Sidebar workspaceName={workspaceName} />
      </aside>

      <div className="xl:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[58px] items-center border-b border-[var(--line)] bg-[color:var(--canvas-header)] px-4 sm:px-6 lg:px-7">
          <MobileNavigation workspaceName={workspaceName} />

          <div className="ml-3 hidden min-w-0 items-center gap-2 text-[11px] text-[var(--ink-faint)] sm:flex xl:ml-0">
            <span>{breadcrumb.section}</span>
            <span className="text-[var(--line-strong)]">/</span>
            <span className="text-[var(--ink)]">{breadcrumb.page}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="relative hidden lg:block">
              <span className="sr-only">Search ResellHQ is not yet available</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--ink-faint)]"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search is not yet available"
                disabled
                title="Search is not yet available"
                className="h-9 w-[220px] cursor-not-allowed border border-[var(--line)] bg-[var(--surface)] pl-9 pr-3 text-[11px] text-[var(--ink)] opacity-70 outline-none placeholder:text-[var(--ink-faint)]"
              />
            </label>

            <NotificationPanel userId={userId} />
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

function Sidebar({
  workspaceName,
  onNavigate,
}: {
  workspaceName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] items-center px-[18px]">
        <Brand href="/dashboard" />
      </div>

      <WorkspaceMenu workspaceName={workspaceName} onNavigate={onNavigate} />

      <nav
        className="flex-1 overflow-y-auto px-2.5 pb-4 pt-3"
        aria-label="Workspace"
      >
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && "mt-4")}>
            <p className="px-2 pb-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const href = "href" in item ? item.href : undefined;
                const current =
                  href === "/dashboard"
                    ? pathname === href
                    : href
                      ? pathname.startsWith("/settings")
                      : false;
                const common = cn(
                  "flex min-h-9 w-full items-center gap-3 rounded-[3px] px-3 text-[11px] outline-none transition-colors",
                  current
                    ? "bg-[var(--nav-active)] text-[var(--ink)] shadow-[inset_2px_0_var(--accent)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]",
                );

                return href ? (
                  <Link
                    key={item.label}
                    href={href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      common,
                      "focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                    )}
                  >
                    <Icon className="size-[14px]" strokeWidth={1.5} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                ) : (
                  <div
                    key={item.label}
                    aria-disabled="true"
                    className={common}
                    title={`${item.label} is planned and not yet available`}
                  >
                    <Icon className="size-[14px]" strokeWidth={1.5} />
                    <span className="flex-1">{item.label}</span>
                    {"badge" in item ? (
                      <span className="border border-[var(--line-strong)] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--line)] px-[18px] py-4">
        <button
          type="button"
          disabled
          title="Help and support is not yet available"
          className="flex min-h-8 w-full cursor-not-allowed items-center gap-3 text-[10px] text-[var(--ink-faint)] opacity-70"
        >
          <Headphones className="size-[14px]" strokeWidth={1.5} />
          Help &amp; support
        </button>
      </div>
    </div>
  );
}

function MobileNavigation({
  workspaceName,
}: {
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(88vw,300px)] border-r border-[var(--line)] bg-[var(--sidebar)] shadow-[var(--shadow-lg)] outline-none data-[state=open]:animate-[drawer-in_180ms_ease-out]">
          <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigate ResellHQ sections.
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </Button>
          </Dialog.Close>
          <Sidebar
            workspaceName={workspaceName}
            onNavigate={() => setOpen(false)}
          />
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
        <button className="ml-0.5 flex h-9 items-center gap-2 rounded-sm px-1.5 outline-none hover:bg-[var(--surface-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
          <span className="grid size-7 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-subtle)] text-[9px] font-semibold text-[var(--accent-strong)]">
            {initial}
          </span>
          <span className="hidden max-w-24 truncate text-[11px] font-medium sm:block">
            {displayName}
          </span>
          <ChevronDown className="size-3 text-[var(--ink-faint)]" />
          <span className="sr-only">Open account menu</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(92vw,292px)] rounded-md border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[var(--shadow-lg)]"
        >
          <div className="px-3 py-3">
            <p className="font-semibold">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--ink-muted)]">
              {email}
            </p>
            <p className="mt-2 truncate text-xs text-[var(--ink-faint)]">
              {workspaceName}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
          <DropdownMenu.Item asChild>
            <Link
              href="/settings/profile"
              className="flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm outline-none focus:bg-[var(--surface-subtle)]"
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
