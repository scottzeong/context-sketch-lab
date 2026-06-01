import { LoginForm } from "@/components/LoginForm";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default function LoginPage() {
  const isConfigured = hasPublicSupabaseEnv();

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">SketchFlow Access</p>
          <h1>로그인</h1>
          <p>
            Supabase Auth로 로그인하면 역할에 따라 튜터, 학생, 보호자, 관리자 작업
            공간으로 이동합니다.
          </p>
        </div>

        {!isConfigured ? (
          <div className="setup-callout">
            <strong>Supabase 환경 변수가 필요합니다.</strong>
            <p>
              `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과
              `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 입력하면 로그인을 사용할 수 있습니다.
            </p>
          </div>
        ) : null}

        <LoginForm isConfigured={isConfigured} />
      </section>
    </main>
  );
}
