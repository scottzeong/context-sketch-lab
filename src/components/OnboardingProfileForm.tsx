"use client";

import { CheckCircle2, KeyRound, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getOnboardingProfile,
  OnboardingProfile,
  updateOwnOnboardingProfile,
  updateOwnPassword
} from "@/lib/onboardingRepository";
import type { AgeRange } from "@/lib/supabase/database.types";

const ageRangeLabels: Record<AgeRange, string> = {
  AGE_7_8: "7-8세",
  AGE_9_10: "9-10세",
  AGE_11_12: "11-12세",
  AGE_13_15: "13-15세",
  AGE_16_18: "16-18세",
  ADULT: "성인"
};

const roleHome: Record<string, string> = {
  admin: "/admin/users",
  tutor: "/tutor/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard"
};

const roleLabels: Record<string, string> = {
  admin: "관리자",
  tutor: "튜터",
  student: "학생",
  parent: "보호자"
};

export function OnboardingProfileForm() {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setProfile(await getOnboardingProfile());
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.");
      }
    }

    void loadProfile();
  }, []);

  const nextHref = useMemo(() => {
    if (!profile) {
      return "/login";
    }

    return roleHome[profile.role] || "/login";
  }, [profile]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const saved = await updateOwnOnboardingProfile({
        displayName: String(formData.get("displayName") || ""),
        ageRange: String(formData.get("ageRange") || "") as AgeRange | ""
      });
      setProfile(saved);
      setMessage("프로필을 저장했습니다.");
      window.location.href = roleHome[saved.role] || "/login";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const password = String(formData.get("password") || "");
      const confirmPassword = String(formData.get("confirmPassword") || "");

      if (password.length < 6) {
        throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
      }

      if (password !== confirmPassword) {
        throw new Error("비밀번호 확인이 일치하지 않습니다.");
      }

      await updateOwnPassword(password);
      event.currentTarget.reset();
      setPasswordMessage("비밀번호를 변경했습니다.");
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  if (!profile) {
    return (
      <section className="panel onboarding-panel">
        <div className="empty-state">
          <strong>프로필을 불러오는 중입니다.</strong>
          {message ? <p>{message}</p> : <p>잠시만 기다려 주세요.</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="panel onboarding-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Onboarding</p>
          <h2>계정 정보 확인</h2>
        </div>
        <span className="status done">
          <CheckCircle2 aria-hidden="true" size={14} />
          {roleLabels[profile.role] || profile.role}
        </span>
      </div>

      {message ? <p className="save-message">{message}</p> : null}

      <form className="onboarding-form" onSubmit={saveProfile}>
        <div className="admin-profile-card">
          <span className="user-avatar" aria-hidden="true">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{profile.email}</strong>
            <p>역할은 관리자 화면에서 변경할 수 있습니다.</p>
          </div>
          <span className="user-role-pill">{roleLabels[profile.role] || profile.role}</span>
        </div>

        <div className="grid-two">
          <div className="field">
            <label htmlFor="displayName">표시 이름</label>
            <input id="displayName" name="displayName" defaultValue={profile.displayName} />
          </div>
          <div className="field">
            <label htmlFor="ageRange">학습 연령대</label>
            <select id="ageRange" name="ageRange" defaultValue={profile.ageRange || ""}>
              <option value="">미설정</option>
              {(Object.keys(ageRangeLabels) as AgeRange[]).map((ageRange) => (
                <option key={ageRange} value={ageRange}>
                  {ageRangeLabels[ageRange]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row-actions">
          <button disabled={isSaving} type="submit">
            <Save aria-hidden="true" size={17} />
            {isSaving ? "저장 중" : profile.displayName ? "프로필 수정" : "프로필 저장"}
          </button>
          <a className="primary-link" href={nextHref}>
            내 작업공간으로 이동
          </a>
        </div>
      </form>

      <form className="onboarding-password-form" onSubmit={savePassword}>
        <div>
          <p className="section-kicker">Password</p>
          <h3>비밀번호 변경</h3>
          <p>임시 비밀번호로 로그인했다면 여기에서 새 비밀번호로 변경하세요.</p>
        </div>
        {passwordMessage ? <p className="save-message">{passwordMessage}</p> : null}
        <div className="grid-two">
          <div className="field">
            <label htmlFor="password">새 비밀번호</label>
            <input
              autoComplete="new-password"
              id="password"
              name="password"
              placeholder="6자 이상"
              type="password"
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">새 비밀번호 확인</label>
            <input
              autoComplete="new-password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="다시 입력"
              type="password"
            />
          </div>
        </div>
        <button disabled={isUpdatingPassword} type="submit">
          <KeyRound aria-hidden="true" size={17} />
          {isUpdatingPassword ? "변경 중" : "비밀번호 변경"}
        </button>
      </form>
    </section>
  );
}
