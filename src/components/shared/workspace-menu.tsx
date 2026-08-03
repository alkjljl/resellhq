"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Check,
  ChevronsUpDown,
  LayoutGrid,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import Link from "next/link";

function getWorkspaceInitials(workspaceName: string) {
  const initials = workspaceName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "RH";
}

export function WorkspaceMenu({
  workspaceName,
  onNavigate,
}: {
  workspaceName: string;
  onNavigate?: () => void;
}) {
  const initials = getWorkspaceInitials(workspaceName);
  const workspace = {
    id: "current",
    name: workspaceName,
    description: "Owner workspace",
    members: 1,
    initials,
  };
  const memberLabel = `${workspace.members} ${
    workspace.members === 1 ? "member" : "members"
  }`;

  return (
    <DropdownMenu.Root>
      <div className="mx-3 border-b border-[var(--line)] pb-3 pt-1">
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="group flex min-h-12 w-full items-center gap-3 rounded-lg border border-transparent bg-[var(--surface-strong)] px-2 py-1.5 text-left outline-none transition-[background-color,border-color] duration-150 hover:border-[var(--line-strong)] hover:bg-[var(--surface-subtle)] data-[state=open]:border-[var(--line-strong)] data-[state=open]:bg-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            aria-label={`Open ${workspaceName} workspace menu`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--accent)] text-xs font-bold text-[var(--accent-ink)]">
              {initials}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight text-[var(--ink)]">
                {workspaceName}
              </span>
              <span className="mt-0.5 block truncate text-xs leading-tight text-[var(--ink-muted)]">
                {workspace.description}
              </span>
            </span>

            <ChevronsUpDown
              className="size-4 shrink-0 text-[var(--ink-muted)] transition-colors group-hover:text-[var(--ink)]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        </DropdownMenu.Trigger>
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          sideOffset={8}
          collisionPadding={12}
          className="z-[70] w-[min(calc(100vw-24px),320px)] rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--ink)] shadow-[var(--shadow-lg)] outline-none data-[state=open]:animate-[fade-in_150ms_ease-out]"
        >
          <div className="px-1 py-1.5">
            <p className="text-sm font-semibold leading-tight">Workspaces</p>
            <p className="mt-1 text-xs leading-tight text-[var(--ink-muted)]">
              Switch between your workspaces
            </p>
          </div>

          <DropdownMenu.Separator className="-mx-2 my-2 h-px bg-[var(--line)]" />

          <DropdownMenu.Label className="flex items-center gap-2 px-1 py-1 text-xs font-medium text-[var(--ink-muted)]">
            <Star className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Recent
          </DropdownMenu.Label>

          <DropdownMenu.Item className="flex min-h-12 cursor-default items-center gap-3 rounded-md p-1 outline-none focus:bg-[var(--surface-subtle)]">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-strong)]">
              {workspace.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight">
                {workspace.name}
              </span>
              <span className="mt-0.5 block text-xs leading-tight text-[var(--ink-muted)]">
                {memberLabel}
              </span>
            </span>
            <Check
              className="mr-1 size-4 shrink-0 text-[var(--accent-strong)]"
              strokeWidth={2}
              aria-label="Selected workspace"
            />
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="-mx-2 my-2 h-px bg-[var(--line)]" />

          <DropdownMenu.Label className="flex items-center gap-2 px-1 py-1 text-xs font-medium text-[var(--ink-muted)]">
            <LayoutGrid
              className="size-4"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            All Workspaces
          </DropdownMenu.Label>

          <DropdownMenu.Item className="flex min-h-12 cursor-default items-center gap-3 rounded-md p-1 outline-none focus:bg-[var(--surface-subtle)]">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-strong)] text-xs font-bold text-[var(--ink)]">
              {workspace.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight">
                {workspace.name}
              </span>
              <span className="mt-0.5 block text-xs leading-tight text-[var(--ink-muted)]">
                {workspace.description}
              </span>
            </span>
            <span className="data-value mr-1 text-xs text-[var(--ink-muted)]">
              {workspace.members}
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="-mx-2 my-2 h-px bg-[var(--line)]" />

          <DropdownMenu.Item
            disabled
            title="Multiple workspaces are planned and not yet available"
            className="flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium outline-none data-[disabled]:cursor-not-allowed"
          >
            <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Create Workspace
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href="/settings/business"
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium outline-none transition-colors focus:bg-[var(--surface-subtle)]"
            >
              <Settings
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Manage Workspaces
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
