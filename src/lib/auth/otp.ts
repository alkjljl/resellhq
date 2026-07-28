import type { EmailOtpType } from "@supabase/supabase-js";

export function isEmailOtpType(value: string | null): value is EmailOtpType {
  return [
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email",
  ].includes(value ?? "");
}
