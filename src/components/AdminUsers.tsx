"use client";

import { Save, Search, ShieldCheck, UserRoundCog } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getManagedProfiles,
  ManagedProfileRecord,
  updateManagedProfile
} from "@/lib/profileRepository";
import type { AgeRange, UserRole } from "@/lib/supabase/database.types";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  tutor: "Tutor",
  student: "Student",
  parent: "Parent"
};

const ageRangeLabels: Record<AgeRange, string> = {
  AGE_7_8: "7-8세",
  AGE_9_10: "9-10세",
  AGE_11_12: "11-12세",
  AGE_13_15: "13-15세",
  AGE_16_18: "16-18세",
  ADULT: "성인"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function AdminUsers() {
  const [profiles, setProfiles] = useState<ManagedProfileRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const nextProfiles = await getManagedProfiles();
        setProfiles(nextProfiles);
        setSelectedId((current) => current || nextProfiles[0]?.id || null);
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "사용자 목록을 불러오지 못했습니다."
        );
      }
    }

    void loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return profiles;
    }

    return profiles.filter((profile) =>
      [
        profile.displayName,
        profile.email,
        profile.role,
        profile.ageRange,
        profile.readingLevel
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [profiles, query]);

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedId) ||
    filteredProfiles[0] ||
    null;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProfile) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const saved = await updateManagedProfile(selectedProfile.id, {
        role: String(formData.get("role") || "student") as UserRole,
        displayName: String(formData.get("displayName") || ""),
        ageRange: String(formData.get("ageRange") || "") as AgeRange | "",
        readingLevel: String(formData.get("readingLevel") || "")
      });

      setProfiles((current) =>
        current.map((profile) => (profile.id === saved.id ? saved : profile))
      );
      setSelectedId(saved.id);
      setMessage("사용자 프로필을 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  const roleCounts = profiles.reduce(
    (counts, profile) => ({
      ...counts,
      [profile.role]: counts[profile.role] + 1
    }),
    { admin: 0, tutor: 0, student: 0, parent: 0 } satisfies Record<UserRole, number>
  );

  return (
    <div className="admin-users-layout">
      <section className="panel admin-users-list">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Profiles</p>
            <h2>사용자 목록</h2>
          </div>
          <span className="status done">{profiles.length} users</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="admin-user-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="admin-user-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 이메일, role 검색"
            value={query}
          />
        </label>

        <div className="admin-role-summary">
          {(Object.keys(roleLabels) as UserRole[]).map((role) => (
            <span key={role}>
              {roleLabels[role]} <strong>{roleCounts[role]}</strong>
            </span>
          ))}
        </div>

        <div className="text-list admin-user-list-items">
          {filteredProfiles.length ? (
            filteredProfiles.map((profile) => (
              <button
                className={`text-list-item ${
                  selectedProfile?.id === profile.id ? "active" : ""
                }`}
                key={profile.id}
                onClick={() => setSelectedId(profile.id)}
                type="button"
              >
                <span>
                  <strong>{profile.displayName}</strong>
                  <small>
                    {profile.email} · {roleLabels[profile.role]}
                  </small>
                </span>
                <UserRoundCog aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>검색 결과가 없습니다.</strong>
              <p>이름, 이메일 또는 role을 다시 입력해 보세요.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel admin-user-detail">
        {selectedProfile ? (
          <form key={selectedProfile.id} onSubmit={saveProfile}>
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Profile Detail</p>
                <h2>{selectedProfile.displayName}</h2>
              </div>
              <button disabled={isSaving} type="submit">
                <Save aria-hidden="true" size={17} />
                {isSaving ? "저장 중" : "저장"}
              </button>
            </div>

            <div className="admin-profile-card">
              <span className="user-avatar" aria-hidden="true">
                {selectedProfile.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{selectedProfile.email}</strong>
                <p>생성일 {formatDate(selectedProfile.createdAt)}</p>
              </div>
              <span className="user-role-pill">
                <ShieldCheck aria-hidden="true" size={14} />
                {roleLabels[selectedProfile.role]}
              </span>
            </div>

            <div className="grid-two">
              <div className="field">
                <label htmlFor="displayName">표시 이름</label>
                <input
                  id="displayName"
                  name="displayName"
                  defaultValue={selectedProfile.displayName}
                />
              </div>
              <div className="field">
                <label htmlFor="role">Role</label>
                <select id="role" name="role" defaultValue={selectedProfile.role}>
                  {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ageRange">연령대</label>
                <select
                  id="ageRange"
                  name="ageRange"
                  defaultValue={selectedProfile.ageRange || ""}
                >
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
                  defaultValue={selectedProfile.readingLevel || ""}
                  placeholder="예: L4, 초등 중급, 독해 A"
                />
              </div>
            </div>

            <div className="admin-profile-note">
              <h3>운영 메모</h3>
              <p>
                이 화면은 현재 organization 안의 profile만 관리합니다. 이메일과
                로그인 비밀번호는 Supabase Authentication에서 관리합니다.
              </p>
            </div>
          </form>
        ) : (
          <div className="empty-state">
            <strong>선택된 사용자가 없습니다.</strong>
            <p>왼쪽 목록에서 수정할 사용자를 선택하세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
