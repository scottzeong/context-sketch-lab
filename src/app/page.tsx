import Image from "next/image";
import Link from "next/link";

export default function Home() {
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
        <div className="front-actions">
          <Link className="primary-link" href="/login">
            로그인
          </Link>
          <Link className="quiet-link" href="/manual">
            매뉴얼 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
