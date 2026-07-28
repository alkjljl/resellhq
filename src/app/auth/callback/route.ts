import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount, isAccountComplete } from "@/lib/auth/account";
import { isEmailOtpType } from "@/lib/auth/otp";
import { getSafeRedirect } from "@/lib/security/safe-redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const requestedNext = getSafeRedirect(
    url.searchParams.get("next"),
    "/onboarding",
  );
  const supabase = await createClient();

  let succeeded = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    succeeded = !error;
  } else if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    succeeded = !error;
  }

  if (!succeeded) {
    return NextResponse.redirect(new URL("/login?error=callback_failed", url));
  }

  if (requestedNext === "/reset-password") {
    return NextResponse.redirect(new URL("/reset-password", url));
  }

  const account = await getCurrentAccount();
  const destination =
    account && isAccountComplete(account) ? requestedNext : "/onboarding";
  return NextResponse.redirect(new URL(destination, url));
}
