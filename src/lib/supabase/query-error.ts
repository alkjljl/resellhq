type SupabaseQueryError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function field(value: string | null | undefined) {
  return value?.trim() || "none";
}

export function createSupabaseQueryError(
  context: string,
  error: SupabaseQueryError,
) {
  const message = [
    context,
    `code=${field(error.code)}`,
    `message=${field(error.message)}`,
    `details=${field(error.details)}`,
    `hint=${field(error.hint)}`,
  ].join("; ");

  return new Error(message, { cause: error });
}
