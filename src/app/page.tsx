import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default function Home() {
  const isConfigured = hasPublicSupabaseEnv();

  return (
    <main className="front-page">
      <section className="front-hero">
        <div className="front-logo">
          <Image src="/brand/logo-horizontal.svg" alt="Roter Faden" width={160} height={96} priority />
        </div>
        <p className="eyebrow">Roter Faden</p>
        <h1>
          AI Agent 시대 :
          <br />
          Text to Sketch | 글을 읽고, 맥락을 그리고, 핵심을 찾다
          <br />
          Read the Text, Sketch the Context, Catch the Subtext
        </h1>
        <p>
          Roter Faden은 Text to Sketch 과정을 통해 아이들이 글 속 단서와 관계를
          발견하고, 이해와 추론을 자신만의 시각적 구조로 표현하도록 돕습니다.
        </p>
      </section>

      <section className="auth-panel front-login-panel" aria-label="로그인">
        <div>
          <p className="eyebrow">Access</p>
          <h2>로그인</h2>
        </div>

        {!isConfigured ? (
          <div className="setup-callout">
            <strong>Supabase 환경 변수가 필요합니다.</strong>
            <p>
              `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를
              입력하면 로그인을 사용할 수 있습니다.
            </p>
          </div>
        ) : null}

        <LoginForm isConfigured={isConfigured} />
      </section>
    </main>
  );
}
