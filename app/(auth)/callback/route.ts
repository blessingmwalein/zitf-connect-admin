import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/overview";

  // OAuth / PKCE code exchange (Google, Apple, magic link)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Email token_hash flows — forward to the right page
  if (tokenHash && type) {
    if (type === "invite") {
      return NextResponse.redirect(
        `${origin}/invite/confirm?token_hash=${tokenHash}&type=${type}`
      );
    }
    if (type === "signup" || type === "email") {
      return NextResponse.redirect(
        `${origin}/confirm?token_hash=${tokenHash}&type=${type}`
      );
    }
    if (type === "recovery") {
      return NextResponse.redirect(
        `${origin}/reset-password?token_hash=${tokenHash}&type=${type}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
