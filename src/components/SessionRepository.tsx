"use client";

import { CalendarDays, ClipboardCheck, Copy, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLearningGroups, LearningGroupRecord } from "@/lib/groupRepository";
import {
  deleteStoredSession,
  duplicateStoredSession,
  getStoredSessions,
  StoredSessionRecord,
  updateStoredSessionStatus
} from "@/lib/sessionRepository";

const statusLabels: Record<StoredSessionRecord["status"], string> = {
  draft: "초안",
  published: "공개",
  closed: "종료"
};

function formatDate(value?: string) {
  if (!value) {
    return "미정";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function SessionRepository({ readOnly = false }: { readOnly?: boolean }) {
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [groups, setGroups] = useState<LearningGroupRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tutorFilter, setTutorFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  async function refresh() {
    try {
      const [nextSessions, nextGroups] = await Promise.all([
        getStoredSessions(),
        getLearningGroups()
      ]);
      setSessions(nextSessions);
      setGroups(nextGroups);
      setSelectedId((current) => current || nextSessions[0]?.id || null);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "세션을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void refresh();
    window.addEventListener("session-repository-change", refresh);

    return () => window.removeEventListener("session-repository-change", refresh);
  }, []);

  const tutorOptions = useMemo(
    () =>
      Array.from(new Set(sessions.map((session) => session.createdBy).filter(Boolean))).sort(
        (a, b) => String(a).localeCompare(String(b))
      ) as string[],
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesGroup =
        groupFilter === "all" ||
        (groupFilter === "ungrouped" && !session.groupId) ||
        session.groupId === groupFilter;
      const matchesStatus = statusFilter === "all" || session.status === statusFilter;
      const matchesTutor = tutorFilter === "all" || session.createdBy === tutorFilter;
      const matchesQuery =
        !normalized ||
        [
          session.title,
          session.textTitle,
          session.groupName,
          session.learningGoal,
          session.worksheetTemplate,
          session.createdBy,
          statusLabels[session.status]
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));

      return matchesGroup && matchesStatus && matchesTutor && matchesQuery;
    });
  }, [groupFilter, query, sessions, statusFilter, tutorFilter]);

  const selectedSession =
    sessions.find((item) => item.id === selectedId) || filteredSessions[0] || null;

  async function setStatus(status: StoredSessionRecord["status"]) {
    if (!selectedSession || readOnly) {
      return;
    }

    await updateStoredSessionStatus(selectedSession.id, status);
    await refresh();
  }

  async function duplicateSelected() {
    if (!selectedSession || readOnly) {
      return;
    }

    setIsDuplicating(true);
    setMessage(null);
    try {
      const duplicated = await duplicateStoredSession(selectedSession);
      await refresh();
      setSelectedId(duplicated.id);
      setMessage("세션을 초안 상태로 복제했습니다. 그룹과 일정을 확인한 뒤 공개하세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "세션 복제에 실패했습니다.");
    } finally {
      setIsDuplicating(false);
    }
  }

  async function removeSelected() {
    if (!selectedSession || readOnly) {
      return;
    }

    await deleteStoredSession(selectedSession.id);
    await refresh();
  }

  return (
    <div className="repository-grid">
      <section className="panel repository-list">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Sessions</p>
            <h2>세션 목록</h2>
          </div>
          <span className="status done">{sessions.length}개</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="session-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="session-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 글, 그룹, 목표 검색"
            value={query}
          />
        </label>

        <div className="grid-two compact-filter-grid">
          <div className="field">
            <label htmlFor="session-group-filter">그룹</label>
            <select
              id="session-group-filter"
              onChange={(event) => setGroupFilter(event.target.value)}
              value={groupFilter}
            >
              <option value="all">전체</option>
              <option value="ungrouped">그룹 없는 세션</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="session-status-filter">상태</label>
            <select
              id="session-status-filter"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="all">전체</option>
              <option value="draft">초안</option>
              <option value="published">공개</option>
              <option value="closed">종료</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="session-tutor-filter">튜터</label>
            <select
              id="session-tutor-filter"
              onChange={(event) => setTutorFilter(event.target.value)}
              value={tutorFilter}
            >
              <option value="all">전체</option>
              {tutorOptions.map((tutorId) => (
                <option key={tutorId} value={tutorId}>
                  {tutorId}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-list">
          {filteredSessions.length ? (
            filteredSessions.map((session) => (
              <button
                className={`text-list-item ${
                  selectedSession?.id === session.id ? "active" : ""
                }`}
                key={session.id}
                onClick={() => setSelectedId(session.id)}
                type="button"
              >
                <span>
                  <strong>{session.title}</strong>
                  <small>
                    {session.groupName || "전체 학생"} | {statusLabels[session.status]} |{" "}
                    {formatDate(session.scheduledFor)}
                  </small>
                </span>
                <ClipboardCheck aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>조건에 맞는 세션이 없습니다.</strong>
              <p>검색어, 그룹, 상태, 튜터 필터를 조정해 보세요.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel repository-detail">
        {selectedSession ? (
          <>
            <div className="panel-heading">
              <div>
                <p className="section-kicker">{statusLabels[selectedSession.status]}</p>
                <h2>{selectedSession.title}</h2>
              </div>
              {!readOnly ? (
                <div className="row-actions">
                  <button
                    className="secondary-button"
                    disabled={isDuplicating}
                    onClick={duplicateSelected}
                    type="button"
                  >
                    <Copy aria-hidden="true" size={17} />
                    {isDuplicating ? "복제 중" : "복제"}
                  </button>
                  <button className="secondary-button" onClick={() => setStatus("draft")}>
                    초안
                  </button>
                  <button onClick={() => setStatus("published")}>공개</button>
                  <button className="secondary-button" onClick={() => setStatus("closed")}>
                    종료
                  </button>
                  <button className="danger-button" onClick={removeSelected}>
                    <Trash2 aria-hidden="true" size={17} />
                    삭제
                  </button>
                </div>
              ) : null}
            </div>

            <div className="metadata-grid">
              <span>글: {selectedSession.textTitle}</span>
              <span>그룹: {selectedSession.groupName || "전체 학생"}</span>
              <span>튜터: {selectedSession.createdBy || "미지정"}</span>
              <span>활동지: {selectedSession.worksheetTemplate}</span>
              <span>
                <CalendarDays aria-hidden="true" size={14} />
                {formatDate(selectedSession.scheduledFor)}
              </span>
            </div>

            <div className="note-box">
              <ClipboardCheck aria-hidden="true" size={18} />
              <p>{selectedSession.learningGoal || "학습 목표가 아직 없습니다."}</p>
            </div>

            <div className="next-grid">
              <div>
                <strong>반복 수업</strong>
                <p>복제 버튼으로 같은 글과 활동지를 초안 세션으로 다시 사용할 수 있습니다.</p>
              </div>
              <div>
                <strong>학생 화면</strong>
                <p>공개 상태가 되면 배정 그룹의 학생에게 표시됩니다.</p>
              </div>
              <div>
                <strong>관리자 보기</strong>
                <p>관리자는 세션을 참조하고 튜터별로 운영 흐름을 확인합니다.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>선택된 세션이 없습니다.</strong>
            <p>새 세션을 만들면 여기에서 상태와 그룹을 관리할 수 있습니다.</p>
            {!readOnly ? (
              <Link className="primary-link" href="/tutor/sessions/new">
                세션 만들기
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
