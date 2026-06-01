"use client";

import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredSessions, StoredSessionRecord } from "@/lib/sessionRepository";
import { getStoredTexts, StoredTextRecord } from "@/lib/textRepository";
import { getSubmissionsForSession } from "@/lib/submissionRepository";

type StudentSessionDetailProps = {
  sessionId: string;
};

export function StudentSessionDetail({ sessionId }: StudentSessionDetailProps) {
  const [session, setSession] = useState<StoredSessionRecord | null>(null);
  const [text, setText] = useState<StoredTextRecord | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const [sessions, texts, submissions] = await Promise.all([
        getStoredSessions(),
        getStoredTexts(),
        getSubmissionsForSession(sessionId)
      ]);
      const nextSession = sessions.find((item) => item.id === sessionId) || null;
      const nextText = nextSession
        ? texts.find((item) => item.id === nextSession.textId) || null
        : null;

      setSession(nextSession);
      setText(nextText);
      setSubmitted(submissions.length > 0);
    }

    void loadSession();
  }, [sessionId]);

  if (!session) {
    return (
      <section className="panel empty-state">
        <strong>세션을 찾을 수 없습니다.</strong>
        <p>튜터가 세션을 만들고 published 상태로 변경했는지 확인해 주세요.</p>
        <Link className="primary-link" href="/student/dashboard">
          학생 대시보드로 이동
        </Link>
      </section>
    );
  }

  return (
    <div className="student-session-layout">
      <section className="panel reading-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{session.worksheetTemplate}</p>
            <h2>{text?.title || session.textTitle}</h2>
          </div>
          <span className={submitted ? "status done" : "status review"}>
            {submitted ? "submitted" : "ready"}
          </span>
        </div>

        <article className="student-reading-text">
          {text?.body || "이 세션과 연결된 글 본문을 찾을 수 없습니다."}
        </article>
      </section>

      <aside className="panel student-task-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Task</p>
            <h2>오늘의 맥락스케치</h2>
          </div>
        </div>

        <div className="note-box">
          <FileText aria-hidden="true" size={18} />
          <p>{session.learningGoal}</p>
        </div>

        <ol className="task-list">
          <li>글을 읽고 중요한 상황, 감정, 원인, 결과를 찾습니다.</li>
          <li>종이에 글 없이 그림, 기호, 선, 화살표로 표현합니다.</li>
          <li>사진을 찍고 가장 중요한 연결을 짧게 설명합니다.</li>
        </ol>

        <Link
          className="primary-link"
          href={`/student/sessions/${session.id}/submit`}
        >
          제출하기
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </aside>
    </div>
  );
}
