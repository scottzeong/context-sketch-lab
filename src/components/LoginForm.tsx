"use client";

import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  isConfigured: boolean;
};

export function LoginForm({ isConfigured }: LoginFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConfigured) {
      setMessage("Supabase 환경 변수를 먼저 설정해야 로그인할 수 있습니다.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || "")
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .single();

      const roleHome = {
        admin: "/tutor/dashboard",
        tutor: "/tutor/dashboard",
        student: "/student/dashboard",
        parent: "/parent/dashboard"
      } as const;

      window.location.href = profile?.role ? roleHome[profile.role] : "/tutor/dashboard";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          disabled={!isConfigured}
          id="email"
          name="email"
          placeholder="tutor@example.com"
          type="email"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          disabled={!isConfigured}
          id="password"
          name="password"
          placeholder="••••••••"
          type="password"
        />
      </div>
      <button disabled={isSubmitting || !isConfigured} type="submit">
        <LogIn aria-hidden="true" size={18} />
        {isSubmitting ? "Signing in" : "Sign in"}
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
