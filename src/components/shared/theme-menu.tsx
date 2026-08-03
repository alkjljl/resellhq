"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-sm border border-[var(--line)]"
          aria-label="Choose color theme"
        >
          <Sun className="size-4 dark:hidden" aria-hidden="true" />
          <Moon className="hidden size-4 dark:block" aria-hidden="true" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-40 rounded-md border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-md)]"
        >
          {themes.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenu.Item
                key={item.value}
                onSelect={() => setTheme(item.value)}
                className="flex min-h-11 cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-sm outline-none focus:bg-[var(--surface-subtle)]"
              >
                <Icon className="size-4 text-[var(--ink-muted)]" />
                <span className="flex-1">{item.label}</span>
                {theme === item.value ? <Check className="size-4" /> : null}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
