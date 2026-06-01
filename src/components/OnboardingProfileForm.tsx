"use client";

import { CheckCircle2, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getOnboardingProfile,
  OnboardingProfile,
  updateOwnOnboardingProfile
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
  admin: "/tutor/dashboard",
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setProfile(await getOnboardingProfile());
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "프로필을 불러오지 못했습니다."
        );
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
        ageRange: String(formData.get("ageRange") || "") as AgeRange | "",
        readingLevel: String(formData.get("readingLevel") || "")
      });
      setProfile(saved);
      setMessage("프로필을 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
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
          <h2>내 프로필 확인</h2>
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
            <label htmlFor="ageRange">연령대</label>
            <select id="ageRange" name="ageRange" defaultValue={profile.ageRange || ""}>
              <option value="">미설정</option>
              {(Object.keys(ageRangeLabels) as AgeRange[]).map((ageRange) => (
                <option key={ageRange} value={ageRange}>
                  {ageRangeLabels[ageRange]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="readingLevel">읽기 수준</label>
            <input
              id="readingLevel"
              name="readingLevel"
              defaultValue={profile.readingLevel || ""}
              placeholder="예: 초등 중급, 독해 A"
            />
          </div>
        </div>

        <div className="row-actions">
          <button disabled={isSaving} type="submit">
            <Save aria-hidden="true" size={17} />
            {isSaving ? "저장 중" : "프로필 저장"}
          </button>
          <a className="primary-link" href={nextHref}>
            내 작업 공간으로 이동
          </a>
        </div>
      </form>
    </section>
  );
}
