"use client";

import { CalendarDays, ClipboardCheck, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLearningGroups, LearningGroupRecord } from "@/lib/groupRepository";
import {
  deleteStoredSession,
  getStoredSessions,
  StoredSessionRecord,
  updateStoredSessionStatus
} from "@/lib/sessionRepository";

function formatDate(value?: string) {
  if (!value) {
    return "미정";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function SessionRepository() {
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [groups, setGroups] = useState<LearningGroupRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);

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

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesGroup =
        groupFilter === "all" ||
        (groupFilter === "ungrouped" && !session.groupId) ||
        session.groupId === groupFilter;
      const matchesQuery =
        !normalized ||
        [session.title, session.textTitle, session.groupName, session.learningGoal].some(
          (value) => value.toLowerCase().includes(normalized)
        );

      return matchesGroup && matchesQuery;
    });
  }, [groupFilter, query, sessions]);

  const selectedSession =
    sessions.find((item) => item.id === selectedId) || filteredSessions[0] || null;

  async function setStatus(status: StoredSessionRecord["status"]) {
    if (!selectedSession) {
      return;
    }

    await updateStoredSessionStatus(selectedSession.id, status);
    await refresh();
  }

  async function removeSelected() {
    if (!selectedSession) {
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
          <span className="status done">{sessions.length} total</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="session-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="session-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 그룹, 목표 검색"
            value={query}
          />
        </label>

        <div className="field">
          <label htmlFor="session-group-filter">그룹 필터</label>
          <select
            id="session-group-filter"
            onChange={(event) => setGroupFilter(event.target.value)}
            value={groupFilter}
          >
            <option value="all">전체</option>
            <option value="ungrouped">전체 학생 세션</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
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
                    {session.groupName || "전체 학생"} · {session.status} ·{" "}
                    {formatDate(session.scheduledFor)}
                  </small>
                </span>
                <ClipboardCheck aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>조건에 맞는 세션이 없습니다.</strong>
              <p>그룹 필터나 검색어를 조정해 보세요.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel repository-detail">
        {selectedSession ? (
          <>
            <div className="panel-heading">
              <div>
                <p className="section-kicker">{selectedSession.status}</p>
                <h2>{selectedSession.title}</h2>
              </div>
              <div className="row-actions">
                <button className="secondary-button" onClick={() => setStatus("draft")}>
                  draft
                </button>
                <button onClick={() => setStatus("published")}>publish</button>
                <button
                  className="secondary-button"
                  onClick={() => setStatus("closed")}
                >
                  close
                </button>
                <button className="danger-button" onClick={removeSelected}>
                  <Trash2 aria-hidden="true" size={17} />
                  삭제
                </button>
              </div>
            </div>

            <div className="metadata-grid">
              <span>글: {selectedSession.textTitle}</span>
              <span>그룹: {selectedSession.groupName || "전체 학생"}</span>
              <span>템플릿: {selectedSession.worksheetTemplate}</span>
              <span>
                <CalendarDays aria-hidden="true" size={14} />
                {formatDate(selectedSession.scheduledFor)}
              </span>
            </div>

            <div className="note-box">
              <ClipboardCheck aria-hidden="true" size={18} />
              <p>{selectedSession.learningGoal}</p>
            </div>

            <div className="next-grid">
              <div>
                <strong>학생 화면</strong>
                <p>published 상태가 되면 배정 그룹의 학생에게 표시됩니다.</p>
              </div>
              <div>
                <strong>제출물</strong>
                <p>학생 제출 후 Tutor Review Workspace에서 검토합니다.</p>
              </div>
              <div>
                <strong>그룹 배포</strong>
                <p>그룹이 없는 세션은 전체 학생 대상으로 표시됩니다.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>선택된 세션이 없습니다.</strong>
            <p>새 세션을 만들면 이곳에서 상태와 그룹을 관리합니다.</p>
            <Link className="primary-link" href="/tutor/sessions/new">
              세션 만들기
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
