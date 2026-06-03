"use client";

import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  isConfigured: boolean;
};

const roleHome = {
  admin: "/admin/users",
  tutor: "/tutor/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard"
} as const;

export function LoginForm({ isConfigured }: LoginFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
      const {
        data: { user },
        error
      } = await supabase.auth.signInWithPassword({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || "")
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!user) {
        setMessage("로그인 사용자 정보를 확인하지 못했습니다.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, account_status")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setMessage("사용자 프로필을 찾지 못했습니다. 관리자에게 문의해 주세요.");
        return;
      }

      if (profile.account_status === "disabled") {
        await supabase.auth.signOut();
        setMessage("비활성화된 계정입니다. 관리자에게 문의해 주세요.");
        return;
      }

      window.location.href = roleHome[profile.role];
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestPasswordReset() {
    if (!isConfigured) {
      setMessage("Supabase 환경 변수를 먼저 설정해야 비밀번호 재설정을 요청할 수 있습니다.");
      return;
    }

    const emailInput = document.getElementById("email") as HTMLInputElement | null;
    const email = emailInput?.value.trim();

    if (!email) {
      setMessage("비밀번호를 찾으려면 먼저 이메일을 입력해 주세요.");
      emailInput?.focus();
      return;
    }

    setIsResettingPassword(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/onboarding`
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("비밀번호 재설정 이메일을 보냈습니다. 이메일을 확인해 주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "비밀번호 재설정 요청에 실패했습니다.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  function showSignupGuide() {
    setMessage(
      "회원가입과 권한 부여는 관리자가 Settings에서 계정을 생성하는 방식입니다. 이름, 이메일, 필요한 역할을 관리자에게 전달해 주세요."
    );
  }

  return (
    <div className="auth-form-wrap">
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
      </form>

      <div className="auth-support-actions" aria-label="계정 지원">
        <button
          className="text-button"
          disabled={isResettingPassword || !isConfigured}
          onClick={requestPasswordReset}
          type="button"
        >
          {isResettingPassword ? "이메일 전송 중" : "아이디/비밀번호 찾기"}
        </button>
        <button className="text-button" onClick={showSignupGuide} type="button">
          회원가입
        </button>
      </div>

      <p className="auth-permission-note">
        계정과 권한은 관리자가 생성하고 부여합니다.
      </p>
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
