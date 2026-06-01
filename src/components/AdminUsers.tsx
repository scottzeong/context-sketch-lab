"use client";

import {
  CheckCircle2,
  Link2,
  Save,
  Search,
  ShieldCheck,
  UserRoundCog,
  UsersRound
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getManagedProfiles,
  getParentStudentLinks,
  ManagedProfileRecord,
  ParentStudentLinkRecord,
  ParentStudentLinkStatus,
  saveParentStudentLink,
  updateManagedProfile,
  updateParentStudentLinkStatus
} from "@/lib/profileRepository";
import type { AgeRange, UserRole } from "@/lib/supabase/database.types";

const roleLabels: Record<UserRole, string> = {
  admin: "관리자",
  tutor: "튜터",
  student: "학생",
  parent: "보호자"
};

const ageRangeLabels: Record<AgeRange, string> = {
  AGE_7_8: "7-8세",
  AGE_9_10: "9-10세",
  AGE_11_12: "11-12세",
  AGE_13_15: "13-15세",
  AGE_16_18: "16-18세",
  ADULT: "성인"
};

const linkStatusLabels: Record<ParentStudentLinkStatus, string> = {
  pending: "대기",
  approved: "승인",
  revoked: "해제"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function AdminUsers() {
  const [profiles, setProfiles] = useState<ManagedProfileRecord[]>([]);
  const [links, setLinks] = useState<ParentStudentLinkRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);

  async function loadAdminData() {
    const [nextProfiles, nextLinks] = await Promise.all([
      getManagedProfiles(),
      getParentStudentLinks()
    ]);
    setProfiles(nextProfiles);
    setLinks(nextLinks);
    setSelectedId((current) => current || nextProfiles[0]?.id || null);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadAdminData();
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "사용자 목록을 불러오지 못했습니다."
        );
      }
    }

    void load();
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
        roleLabels[profile.role],
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

  const parents = useMemo(
    () => profiles.filter((profile) => profile.role === "parent"),
    [profiles]
  );

  const students = useMemo(
    () => profiles.filter((profile) => profile.role === "student"),
    [profiles]
  );

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

  async function saveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingLink(true);
    setLinkMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const parentId = String(formData.get("parentId") || "");
      const studentId = String(formData.get("studentId") || "");
      const relationship = String(formData.get("relationship") || "");
      const status = String(formData.get("status") || "approved") as ParentStudentLinkStatus;

      if (!parentId || !studentId) {
        throw new Error("보호자와 학생을 모두 선택해 주세요.");
      }

      const saved = await saveParentStudentLink({
        parentId,
        studentId,
        relationship,
        status
      });

      setLinks((current) => {
        const exists = current.some((link) => link.id === saved.id);
        return exists
          ? current.map((link) => (link.id === saved.id ? saved : link))
          : [saved, ...current];
      });
      setLinkMessage("부모-학생 연결을 저장했습니다.");
      event.currentTarget.reset();
    } catch (error) {
      setLinkMessage(
        error instanceof Error ? error.message : "부모-학생 연결 저장에 실패했습니다."
      );
    } finally {
      setIsSavingLink(false);
    }
  }

  async function changeLinkStatus(linkId: string, status: ParentStudentLinkStatus) {
    setIsSavingLink(true);
    setLinkMessage(null);

    try {
      const saved = await updateParentStudentLinkStatus(linkId, status);
      setLinks((current) =>
        current.map((link) => (link.id === saved.id ? saved : link))
      );
      setLinkMessage(`연결 상태를 ${linkStatusLabels[status]} 상태로 변경했습니다.`);
    } catch (error) {
      setLinkMessage(
        error instanceof Error ? error.message : "연결 상태 변경에 실패했습니다."
      );
    } finally {
      setIsSavingLink(false);
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
          <span className="status done">{profiles.length}명</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="admin-user-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="admin-user-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 이메일, 역할 검색"
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
              <p>이름, 이메일 또는 역할을 다시 입력해 보세요.</p>
            </div>
          )}
        </div>
      </section>

      <div className="admin-detail-stack">
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
                  <label htmlFor="role">역할</label>
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

        <section className="panel parent-link-manager">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Family Links</p>
              <h2>부모-학생 연결 관리</h2>
            </div>
            <span className="status done">{links.length}개 연결</span>
          </div>

          {linkMessage ? <p className="save-message">{linkMessage}</p> : null}

          <form className="parent-link-form" onSubmit={saveLink}>
            <div className="field">
              <label htmlFor="parentId">보호자</label>
              <select id="parentId" name="parentId" defaultValue="">
                <option value="">보호자 선택</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.displayName} · {parent.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="studentId">학생</label>
              <select id="studentId" name="studentId" defaultValue="">
                <option value="">학생 선택</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.displayName} · {student.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="relationship">관계</label>
              <input id="relationship" name="relationship" placeholder="예: 보호자, 어머니, 아버지" />
            </div>
            <div className="field">
              <label htmlFor="status">상태</label>
              <select id="status" name="status" defaultValue="approved">
                {(Object.keys(linkStatusLabels) as ParentStudentLinkStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {linkStatusLabels[status]}
                    </option>
                  )
                )}
              </select>
            </div>
            <button disabled={isSavingLink || !parents.length || !students.length} type="submit">
              <Link2 aria-hidden="true" size={17} />
              연결 저장
            </button>
          </form>

          <div className="parent-link-list">
            {links.length ? (
              links.map((link) => (
                <article key={link.id}>
                  <div className="parent-link-main">
                    <UsersRound aria-hidden="true" size={19} />
                    <div>
                      <strong>
                        {link.parentName} → {link.studentName}
                      </strong>
                      <p>
                        {link.relationship || "관계 미설정"} · 최근 변경{" "}
                        {formatDate(link.updatedAt)}
                      </p>
                    </div>
                    <span className={link.status === "approved" ? "status done" : "status"}>
                      {linkStatusLabels[link.status]}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button
                      className="secondary-button"
                      disabled={isSavingLink}
                      onClick={() => changeLinkStatus(link.id, "approved")}
                      type="button"
                    >
                      <CheckCircle2 aria-hidden="true" size={16} />
                      승인
                    </button>
                    <button
                      className="secondary-button"
                      disabled={isSavingLink}
                      onClick={() => changeLinkStatus(link.id, "pending")}
                      type="button"
                    >
                      대기
                    </button>
                    <button
                      className="danger-button"
                      disabled={isSavingLink}
                      onClick={() => changeLinkStatus(link.id, "revoked")}
                      type="button"
                    >
                      해제
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-inline">
                <strong>아직 부모-학생 연결이 없습니다.</strong>
                <p>보호자와 학생 계정을 선택한 뒤 승인 상태로 저장하세요.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
