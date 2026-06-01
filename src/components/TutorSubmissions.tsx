"use client";

import { ClipboardCheck, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getStoredSubmissions,
  StoredSubmissionRecord
} from "@/lib/submissionRepository";
import { TutorReviewWorkspace } from "@/components/TutorReviewWorkspace";

export function TutorSubmissions() {
  const [submissions, setSubmissions] = useState<StoredSubmissionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function refresh() {
      try {
        const nextSubmissions = await getStoredSubmissions();
        setSubmissions(nextSubmissions);
        setSelectedId((current) => current || nextSubmissions[0]?.id || null);
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Submission load failed.");
      }
    }

    void refresh();
    window.addEventListener("submission-repository-change", refresh);

    return () =>
      window.removeEventListener("submission-repository-change", refresh);
  }, []);

  const filteredSubmissions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return submissions;
    }

    return submissions.filter((submission) =>
      [
        submission.studentName,
        submission.sessionTitle,
        submission.studentExplanation,
        submission.importantConnection
      ].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [query, submissions]);

  const selectedSubmission =
    submissions.find((item) => item.id === selectedId) ||
    filteredSubmissions[0] ||
    null;

  return (
    <div className="repository-grid">
      <section className="panel repository-list">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Review Queue</p>
            <h2>제출물</h2>
          </div>
          <span className="status review">{submissions.length} waiting</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="submission-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="submission-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="학생, 세션, 연결 검색"
            value={query}
          />
        </label>

        <div className="text-list">
          {filteredSubmissions.length ? (
            filteredSubmissions.map((submission) => (
              <button
                className={`text-list-item ${
                  selectedSubmission?.id === submission.id ? "active" : ""
                }`}
                key={submission.id}
                onClick={() => setSelectedId(submission.id)}
                type="button"
              >
                <span>
                  <strong>{submission.studentName}</strong>
                  <small>
                    {submission.sessionTitle} · {submission.status}
                  </small>
                </span>
                <ClipboardCheck aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>아직 제출물이 없습니다.</strong>
              <p>학생 화면에서 세션을 열고 스케치를 제출하면 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </section>

      <section className="repository-detail">
        {selectedSubmission ? (
          <TutorReviewWorkspace
            key={selectedSubmission.id}
            onReviewSaved={async () => {
              const nextSubmissions = await getStoredSubmissions();
              setSubmissions(nextSubmissions);
            }}
            submission={selectedSubmission}
          />
        ) : (
          <div className="panel empty-state">
            <strong>선택된 제출물이 없습니다.</strong>
            <p>제출물이 생기면 튜터 리뷰 워크스페이스로 이어집니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
