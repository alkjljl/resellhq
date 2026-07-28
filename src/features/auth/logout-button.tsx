"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  performLogout,
  type LogoutFlowState,
} from "@/lib/auth/logout";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  appearance = "button",
}: {
  appearance?: "button" | "menu";
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const flowState = useRef<LogoutFlowState>({ pending: false });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    const result = await performLogout(flowState.current, {
      signOut: () => supabase.auth.signOut(),
      replace: (href) => router.replace(href),
      refresh: () => router.refresh(),
      setPending,
    });

    if (result.status === "error") setError(result.message);
  }

  const label = pending ? "Signing out..." : "Log out";

  return (
    <div className={cn(appearance === "menu" && "w-full")}>
      {appearance === "menu" ? (
        <DropdownMenu.Item
          asChild
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          <button
            type="button"
            className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-[var(--danger)] outline-none hover:bg-[var(--danger-soft)] focus:bg-[var(--danger-soft)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:pointer-events-none disabled:opacity-55"
          >
            <LogOut className="size-4" />
            {label}
          </button>
        </DropdownMenu.Item>
      ) : (
        <Button
          type="button"
          variant="danger"
          className="w-full"
          onClick={handleLogout}
          disabled={pending}
        >
          <LogOut className="size-4" />
          {label}
        </Button>
      )}

      {error ? (
        <Alert className="mt-3">{error}</Alert>
      ) : null}
    </div>
  );
}
