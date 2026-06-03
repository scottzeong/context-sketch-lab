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
          AI Agent의 시대 :
          <br />
          정보의 미로 속에서 스스로 길을 찾는 여정
        </h1>
        <p>
          로터파덴은 아이들이 복잡한 정보 속에서 자신만의 생각의 실마리를 찾아내는
          논리적 사고력과 맥락구조화 능력을 길러줍니다.
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
