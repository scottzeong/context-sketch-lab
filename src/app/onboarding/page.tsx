import { OnboardingProfileForm } from "@/components/OnboardingProfileForm";
import Image from "next/image";

export default function OnboardingPage() {
  return (
    <main className="auth-page onboarding-page">
      <div className="auth-panel onboarding-shell">
        <div className="auth-logo">
          <Image src="/brand/logo-horizontal.svg" alt="Roterfaden" width={104} height={54} priority />
        </div>
        <div>
          <p className="eyebrow">Roter Faden Setup</p>
          <h1>프로필 설정</h1>
          <p>
            첫 사용 전에 이름과 학습 정보를 확인해 주세요. 이 정보는 세션 배정,
            피드백, 리포트 화면에 사용됩니다.
          </p>
        </div>
        <OnboardingProfileForm />
      </div>
    </main>
  );
}

