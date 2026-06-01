"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UserSignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      aria-label="로그아웃"
      className="user-signout-button"
      disabled={isSigningOut}
      onClick={signOut}
      type="button"
    >
      <LogOut aria-hidden="true" size={16} />
      {isSigningOut ? "Signing out" : "Sign out"}
    </button>
  );
}
