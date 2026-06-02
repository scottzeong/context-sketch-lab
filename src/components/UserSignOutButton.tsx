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
      window.location.href = "/";
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      aria-label="Log out"
      className="user-signout-button"
      disabled={isSigningOut}
      onClick={signOut}
      type="button"
    >
      <LogOut aria-hidden="true" size={16} />
      {isSigningOut ? "Logging out" : "Log out"}
    </button>
  );
}
