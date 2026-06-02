import { OnboardingProfileForm } from "@/components/OnboardingProfileForm";
import Image from "next/image";

export default function OnboardingPage() {
  return (
    <main className="auth-page onboarding-page">
      <div className="auth-panel onboarding-shell">
        <div className="auth-logo">
          <Image src="/brand/logo-horizontal.svg" alt="Roter Faden" width={104} height={54} priority />
        </div>
        <div>
          <p className="eyebrow">Roter Faden Setup</p>
          <h1>프로필 설정</h1>
          <p>표시 이름과 학습관련 정보를 확인해 주세요.</p>
        </div>
        <OnboardingProfileForm />
      </div>
    </main>
  );
}
