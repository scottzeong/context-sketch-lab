import { OnboardingProfileForm } from "@/components/OnboardingProfileForm";

export default function OnboardingPage() {
  return (
    <main className="auth-page onboarding-page">
      <div className="auth-panel onboarding-shell">
        <div>
          <p className="eyebrow">SketchFlow Setup</p>
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
