import { describe, expect, it, vi } from "vitest";
import {
  LOGOUT_ERROR_MESSAGE,
  performLogout,
  type LogoutFlowState,
} from "./logout";

function flowState(): LogoutFlowState {
  return { pending: false };
}

describe("performLogout", () => {
  it("awaits sign-out, replaces the route with login, and refreshes", async () => {
    const events: string[] = [];
    const signOut = vi.fn(async () => {
      events.push("signOut");
      return { error: null };
    });
    const replace = vi.fn((href: string) => events.push(`replace:${href}`));
    const refresh = vi.fn(() => events.push("refresh"));

    const result = await performLogout(flowState(), {
      signOut,
      replace,
      refresh,
      setPending: (pending) => events.push(`pending:${pending}`),
    });

    expect(result).toEqual({ status: "success" });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      "pending:true",
      "signOut",
      "replace:/login",
      "refresh",
    ]);
  });

  it("returns a visible error and keeps the current route on failure", async () => {
    const replace = vi.fn();
    const refresh = vi.fn();
    const pendingStates: boolean[] = [];

    const result = await performLogout(flowState(), {
      signOut: async () => ({ error: new Error("network unavailable") }),
      replace,
      refresh,
      setPending: (pending) => pendingStates.push(pending),
    });

    expect(result).toEqual({
      status: "error",
      message: LOGOUT_ERROR_MESSAGE,
    });
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(pendingStates).toEqual([true, false]);
  });

  it("ignores repeated attempts while sign-out is processing", async () => {
    let finishSignOut:
      | ((result: { error: null }) => void)
      | undefined;
    const signOut = vi.fn(
      () =>
        new Promise<{ error: null }>((resolve) => {
          finishSignOut = resolve;
        }),
    );
    const state = flowState();
    const dependencies = {
      signOut,
      replace: vi.fn(),
      refresh: vi.fn(),
      setPending: vi.fn(),
    };

    const firstAttempt = performLogout(state, dependencies);
    const repeatedAttempt = await performLogout(state, dependencies);

    expect(repeatedAttempt).toEqual({ status: "ignored" });
    expect(signOut).toHaveBeenCalledTimes(1);

    finishSignOut?.({ error: null });
    await firstAttempt;
  });
});
