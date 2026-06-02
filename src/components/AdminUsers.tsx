"use client";

import {
  KeyRound,
  Link2,
  Mail,
  PlusCircle,
  Save,
  Search,
  ShieldCheck,
  UserRoundCog,
  UsersRound
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminConfigOptions } from "@/components/AdminConfigOptions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getManagedProfiles,
  getParentStudentLinks,
  ManagedProfileRecord,
  ParentStudentLinkRecord,
  ParentStudentLinkStatus,
  saveParentStudentLink,
  updateManagedProfile,
  updateManagedProfileStatus,
  updateParentStudentLinkStatus
} from "@/lib/profileRepository";
import type { AccountStatus, AgeRange, UserRole } from "@/lib/supabase/database.types";

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

const accountStatusLabels: Record<AccountStatus, string> = {
  active: "활성",
  disabled: "비활성"
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
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  async function loadAdminData() {
    const [profileData, linkData] = await Promise.all([
      getManagedProfiles(),
      getParentStudentLinks()
    ]);

    setProfiles(profileData);
    setLinks(linkData);
    setSelectedId((current) => current || profileData[0]?.id || null);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadAdminData();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "관리자 데이터를 불러오지 못했습니다.");
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
        accountStatusLabels[profile.accountStatus],
        profile.ageRange
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [profiles, query]);

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedId) || filteredProfiles[0] || null;

  const parents = useMemo(
    () => profiles.filter((profile) => profile.role === "parent"),
    [profiles]
  );

  const students = useMemo(
    () => profiles.filter((profile) => profile.role === "student"),
    [profiles]
  );

  const roleCounts = profiles.reduce(
    (counts, profile) => ({
      ...counts,
      [profile.role]: counts[profile.role] + 1
    }),
    { admin: 0, tutor: 0, student: 0, parent: 0 } satisfies Record<UserRole, number>
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
        accountStatus: String(formData.get("accountStatus") || "active") as AccountStatus
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

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingUser(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
          displayName: String(formData.get("displayName") || ""),
          role: String(formData.get("role") || "student"),
          ageRange: String(formData.get("ageRange") || "")
        })
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "계정 생성에 실패했습니다.");
      }

      await loadAdminData();
      event.currentTarget.reset();
      setMessage("새 계정을 생성했습니다. 이메일과 임시 비밀번호를 사용자에게 전달해 주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "계정 생성에 실패했습니다.");
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function sendPasswordReset() {
    if (!selectedProfile?.email) {
      return;
    }

    setIsSendingReset(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/onboarding`;
      const { error } = await supabase.auth.resetPasswordForEmail(selectedProfile.email, {
        redirectTo
      });

      if (error) {
        throw error;
      }

      setMessage(`${selectedProfile.email}로 비밀번호 재설정 이메일을 보냈습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "비밀번호 재설정 이메일 발송에 실패했습니다.");
    } finally {
      setIsSendingReset(false);
    }
  }

  async function changeAccountStatus(accountStatus: AccountStatus) {
    if (!selectedProfile) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const saved = await updateManagedProfileStatus(selectedProfile.id, accountStatus);
      setProfiles((current) =>
        current.map((profile) => (profile.id === saved.id ? saved : profile))
      );
      setMessage(`계정을 ${accountStatusLabels[accountStatus]} 상태로 변경했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "계정 상태 변경에 실패했습니다.");
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
      await saveParentStudentLink({
        parentId: String(formData.get("parentId") || ""),
        studentId: String(formData.get("studentId") || ""),
        relationship: String(formData.get("relationship") || ""),
        status: String(formData.get("status") || "approved") as ParentStudentLinkStatus
      });
      await loadAdminData();
      event.currentTarget.reset();
      setLinkMessage("보호자-학생 연결을 저장했습니다.");
    } catch (error) {
      setLinkMessage(error instanceof Error ? error.message : "연결 저장에 실패했습니다.");
    } finally {
      setIsSavingLink(false);
    }
  }

  async function changeLinkStatus(linkId: string, status: ParentStudentLinkStatus) {
    setIsSavingLink(true);
    setLinkMessage(null);

    try {
      const saved = await updateParentStudentLinkStatus(linkId, status);
      setLinks((current) => current.map((link) => (link.id === saved.id ? saved : link)));
      setLinkMessage("연결 상태를 변경했습니다.");
    } catch (error) {
      setLinkMessage(error instanceof Error ? error.message : "연결 상태 변경에 실패했습니다.");
    } finally {
      setIsSavingLink(false);
    }
  }

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
            placeholder="이름, 이메일, 역할, 상태 검색"
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
                className={`text-list-item ${selectedProfile?.id === profile.id ? "active" : ""}`}
                key={profile.id}
                onClick={() => setSelectedId(profile.id)}
                type="button"
              >
                <span>
                  <strong>{profile.displayName}</strong>
                  <small>
                    {profile.email} | {roleLabels[profile.role]} |{" "}
                    {accountStatusLabels[profile.accountStatus]}
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
        <section className="panel admin-invite-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Account Setup</p>
              <h2>새 계정 생성</h2>
            </div>
            <span className="status">
              <KeyRound aria-hidden="true" size={14} />
              임시 비밀번호
            </span>
          </div>

          <form className="admin-create-user-form" onSubmit={createUser}>
            <div className="field">
              <label htmlFor="newEmail">이메일</label>
              <input id="newEmail" name="email" placeholder="user@example.com" type="email" />
            </div>
            <div className="field">
              <label htmlFor="newDisplayName">표시 이름</label>
              <input id="newDisplayName" name="displayName" placeholder="사용자 이름" />
            </div>
            <div className="field">
              <label htmlFor="newRole">역할</label>
              <select id="newRole" name="role" defaultValue="student">
                {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="newPassword">임시 비밀번호</label>
              <input
                autoComplete="new-password"
                id="newPassword"
                name="password"
                placeholder="6자 이상"
                type="password"
              />
            </div>
            <div className="field">
              <label htmlFor="newAgeRange">학습 연령대</label>
              <select id="newAgeRange" name="ageRange" defaultValue="">
                <option value="">미설정</option>
                {(Object.keys(ageRangeLabels) as AgeRange[]).map((ageRange) => (
                  <option key={ageRange} value={ageRange}>
                    {ageRangeLabels[ageRange]}
                  </option>
                ))}
              </select>
            </div>
            <button disabled={isCreatingUser} type="submit">
              <PlusCircle aria-hidden="true" size={17} />
              {isCreatingUser ? "생성 중" : "계정 생성"}
            </button>
          </form>

          <div className="admin-profile-note">
            <h3>계정 전달 안내</h3>
            <p>
              새 계정을 만든 뒤 이메일과 임시 비밀번호를 사용자에게 전달하세요. 사용자는
              첫 로그인 후 프로필 설정 화면에서 이름, 학습 정보, 새 비밀번호를 정리할 수
              있습니다.
            </p>
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
                  {accountStatusLabels[selectedProfile.accountStatus]}
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
                  <label htmlFor="accountStatus">계정 상태</label>
                  <select
                    id="accountStatus"
                    name="accountStatus"
                    defaultValue={selectedProfile.accountStatus}
                  >
                    {(Object.keys(accountStatusLabels) as AccountStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {accountStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ageRange">학습 연령대</label>
                  <select id="ageRange" name="ageRange" defaultValue={selectedProfile.ageRange || ""}>
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
                <button
                  className="secondary-button"
                  disabled={isSendingReset}
                  onClick={sendPasswordReset}
                  type="button"
                >
                  <Mail aria-hidden="true" size={16} />
                  {isSendingReset ? "발송 중" : "비밀번호 재설정 이메일"}
                </button>
                <button
                  className="secondary-button"
                  disabled={isSaving}
                  onClick={() => changeAccountStatus("active")}
                  type="button"
                >
                  계정 활성화
                </button>
                <button
                  className="danger-button"
                  disabled={isSaving}
                  onClick={() => changeAccountStatus("disabled")}
                  type="button"
                >
                  계정 비활성화
                </button>
              </div>
            </form>
          ) : (
            <div className="empty-state">
              <strong>선택된 사용자가 없습니다.</strong>
              <p>왼쪽 목록에서 사용자를 선택해 주세요.</p>
            </div>
          )}
        </section>

        <section className="panel parent-link-manager">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Family Links</p>
              <h2>부모-학생 연결 관리</h2>
            </div>
            <span className="status">
              <UsersRound aria-hidden="true" size={14} />
              {links.length}건
            </span>
          </div>

          {linkMessage ? <p className="save-message">{linkMessage}</p> : null}

          <form className="parent-link-form" onSubmit={saveLink}>
            <div className="field">
              <label htmlFor="parentId">보호자</label>
              <select id="parentId" name="parentId" defaultValue="">
                <option value="">선택</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.displayName} ({parent.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="studentId">학생</label>
              <select id="studentId" name="studentId" defaultValue="">
                <option value="">선택</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.displayName} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="relationship">관계</label>
              <input id="relationship" name="relationship" placeholder="예: mother, father" />
            </div>
            <div className="field">
              <label htmlFor="status">상태</label>
              <select id="status" name="status" defaultValue="approved">
                {(Object.keys(linkStatusLabels) as ParentStudentLinkStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {linkStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <button disabled={isSavingLink} type="submit">
              <Link2 aria-hidden="true" size={17} />
              {isSavingLink ? "저장 중" : "연결 저장"}
            </button>
          </form>

          <div className="parent-link-list">
            {links.length ? (
              links.map((link) => (
                <article key={link.id}>
                  <div className="parent-link-main">
                    <span className="user-avatar" aria-hidden="true">
                      {link.studentName.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>
                        {link.parentName} -&gt; {link.studentName}
                      </strong>
                      <p>
                        {link.relationship || "관계 미입력"} | {link.parentEmail} |{" "}
                        {link.studentEmail}
                      </p>
                    </div>
                    <span className="status">{linkStatusLabels[link.status]}</span>
                  </div>
                  <div className="row-actions">
                    {(Object.keys(linkStatusLabels) as ParentStudentLinkStatus[]).map((status) => (
                      <button
                        className={status === "revoked" ? "danger-button" : "secondary-button"}
                        disabled={isSavingLink}
                        key={status}
                        onClick={() => changeLinkStatus(link.id, status)}
                        type="button"
                      >
                        {linkStatusLabels[status]}
                      </button>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-inline">
                <strong>연결된 보호자-학생 관계가 없습니다.</strong>
                <p>보호자 계정과 학생 계정을 만든 뒤 연결을 저장해 주세요.</p>
              </div>
            )}
          </div>
        </section>

        <AdminConfigOptions />
      </div>
    </div>
  );
}
