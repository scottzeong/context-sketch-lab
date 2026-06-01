"use client";

import { ArrowRight, BookOpenText, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentStudentGroupIds } from "@/lib/groupRepository";
import { getStoredSessions, StoredSessionRecord } from "@/lib/sessionRepository";
import {
  getStoredSubmissions,
  StoredSubmissionRecord
} from "@/lib/submissionRepository";

export function StudentDashboard() {
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [submittedSessionIds, setSubmittedSessionIds] = useState<Set<string>>(
    new Set()
  );
  const [submissions, setSubmissions] = useState<StoredSubmissionRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [storedSessions, storedSubmissions, groupIds] = await Promise.all([
          getStoredSessions(),
          getStoredSubmissions(),
          getCurrentStudentGroupIds()
        ]);

        setSessions(
          storedSessions.filter(
            (session) =>
              session.status === "published" &&
              (!session.groupId || groupIds.includes(session.groupId))
          )
        );
        setSubmittedSessionIds(
          new Set(storedSubmissions.map((submission) => submission.sessionId))
        );
        setSubmissions(storedSubmissions);
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "학생 대시보드를 불러오지 못했습니다."
        );
      }
    }

    void loadDashboard();
  }, []);

  const hasSessions = sessions.length > 0;
  const stats = useMemo(
    () => ({
      open: sessions.filter((session) => !submittedSessionIds.has(session.id)).length,
      submitted: sessions.filter((session) => submittedSessionIds.has(session.id))
        .length
    }),
    [sessions, submittedSessionIds]
  );

  return (
    <div className="student-dashboard-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Today</p>
            <h2>학습 세션</h2>
          </div>
          <span className="status done">{stats.open} open</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <div className="student-session-list">
          {hasSessions ? (
            sessions.map((session) => {
              const submitted = submittedSessionIds.has(session.id);

              return (
                <article className="student-session-card" key={session.id}>
                  <div>
                    <span className={submitted ? "status done" : "status review"}>
                      {submitted ? "제출 완료" : "준비됨"}
                    </span>
                    <h3>{session.title}</h3>
                    <p>{session.learningGoal}</p>
                    <small>
                      {session.groupName || "전체 학생"} · {session.worksheetTemplate}
                    </small>
                  </div>
                  <Link
                    className="primary-link"
                    href={`/student/sessions/${session.id}`}
                  >
                    열기
                    <ArrowRight aria-hidden="true" size={17} />
                  </Link>
                </article>
              );
            })
          ) : (
            <div className="empty-inline">
              <strong>아직 배포된 세션이 없습니다.</strong>
              <p>
                튜터가 내 그룹 또는 전체 학생 대상으로 세션을 공개하면 여기에
                표시됩니다.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Progress</p>
            <h2>제출 상태</h2>
          </div>
        </div>
        <div className="next-grid single-column">
          <div>
            <BookOpenText aria-hidden="true" size={20} />
            <strong>{sessions.length}개</strong>
            <p>배포된 세션</p>
          </div>
          <div>
            <ClipboardCheck aria-hidden="true" size={20} />
            <strong>{stats.submitted}개</strong>
            <p>제출 완료</p>
          </div>
        </div>
        <div className="feedback-shortcuts">
          {submissions
            .filter((submission) => submission.status === "feedback_published")
            .slice(0, 3)
            .map((submission) => (
              <Link
                className="quiet-card-link"
                href={`/student/submissions/${submission.id}/feedback`}
                key={submission.id}
              >
                <span>공개 피드백</span>
                <strong>{submission.sessionTitle}</strong>
              </Link>
            ))}
        </div>
      </aside>
    </div>
  );
}
