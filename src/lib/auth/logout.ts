export const LOGOUT_ERROR_MESSAGE =
  "We could not sign you out. Your session is still active. Try again.";

export type LogoutFlowState = {
  pending: boolean;
};

type LogoutDependencies = {
  signOut: () => Promise<{ error: unknown }>;
  replace: (href: string) => void;
  refresh: () => void;
  setPending: (pending: boolean) => void;
};

export type LogoutResult =
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "ignored" };

export async function performLogout(
  state: LogoutFlowState,
  dependencies: LogoutDependencies,
): Promise<LogoutResult> {
  if (state.pending) return { status: "ignored" };

  state.pending = true;
  dependencies.setPending(true);

  try {
    const { error } = await dependencies.signOut();
    if (error) return failedLogout(state, dependencies);

    dependencies.replace("/login");
    dependencies.refresh();
    return { status: "success" };
  } catch {
    return failedLogout(state, dependencies);
  }
}

function failedLogout(
  state: LogoutFlowState,
  dependencies: LogoutDependencies,
): LogoutResult {
  state.pending = false;
  dependencies.setPending(false);
  return { status: "error", message: LOGOUT_ERROR_MESSAGE };
}
