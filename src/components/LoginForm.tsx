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
        .select("role, display_name, age_range, reading_level")
        .single();

      const roleHome = {
        admin: "/tutor/dashboard",
        tutor: "/tutor/dashboard",
        student: "/student/dashboard",
        parent: "/parent/dashboard"
      } as const;

      const needsOnboarding =
        !profile?.display_name ||
        (profile.role === "student" && (!profile.age_range || !profile.reading_level));

      window.location.href = needsOnboarding
        ? "/onboarding"
        : profile?.role
          ? roleHome[profile.role]
          : "/onboarding";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">이메일</label>
        <input
          autoComplete="email"
          disabled={!isConfigured}
          id="email"
          name="email"
          placeholder="user@example.com"
          type="email"
        />
      </div>
      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input
          autoComplete="current-password"
          disabled={!isConfigured}
          id="password"
          name="password"
          placeholder="비밀번호"
          type="password"
        />
      </div>
      <button disabled={isSubmitting || !isConfigured} type="submit">
        <LogIn aria-hidden="true" size={18} />
        {isSubmitting ? "로그인 중" : "로그인"}
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
