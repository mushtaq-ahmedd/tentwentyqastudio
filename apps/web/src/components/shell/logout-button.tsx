"use client";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ className, children }: { className?: string; children: React.ReactNode }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Hard navigation — see signup-form.tsx's comment for why.
    window.location.assign("/login");
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      {children}
    </button>
  );
}
