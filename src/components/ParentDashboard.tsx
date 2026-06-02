"use client";

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Printer,
  Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getLinkedParentStudents,
  getParentPortfolioEntries,
  ParentStudentRecord
} from "@/lib/parentRepository";
import type { PortfolioEntry } from "@/lib/portfolioRepository";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function getParentSummary(entry: PortfolioEntry) {
  return (
    entry.review.feedbackDraft?.parentSummary ||
    entry.review.feedbackDraft?.studentFacing ||
    "공개된 피드백 요약이 아직 없습니다."
  );
}

export function ParentDashboard() {
  const [students, setStudents] = useState<ParentStudentRecord[]>([]);
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadParentDashboard() {
      setIsLoading(true);
      try {
        const [nextStudents, nextEntries] = await Promise.all([
          getLinkedParentStudents(),
          getParentPortfolioEntries()
        ]);
        setStudents(nextStudents);
        setEntries(nextEntries);
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "보호자 대시보드를 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadParentDashboard();
  }, []);

  const filteredEntries = useMemo(() => {
    if (selectedStudentId === "all") {
      return entries;
    }

    return entries.filter((entry) => entry.submission.studentId === selectedStudentId);
  }, [entries, selectedStudentId]);

  const selectedStudent = useMemo(() => {
    if (selectedStudentId === "all") {
      return null;
    }

    return students.find((student) => student.id === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  const latestEntry = filteredEntries[0];
  const latestDate = latestEntry ? formatDate(latestEntry.submission.updatedAt) : "-";
  const studentCountLabel = selectedStudent ? selectedStudent.displayName : "전체 학생";
  const parentSummaryText = filteredEntries
    .slice(0, 4)
    .map((entry) => `- ${entry.submission.sessionTitle}: ${getParentSummary(entry)}`)
    .join("\n");

  return (
    <div className="parent-dashboard-layout">
      <section className="panel parent-overview-panel print-hidden">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Family View</p>
            <h2>보호자 대시보드</h2>
          </div>
          <span className="status done">{students.length}명 연결</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <div className="field">
          <label htmlFor="parent-student-filter">학생 필터</label>
          <select
            id="parent-student-filter"
            onChange={(event) => setSelectedStudentId(event.target.value)}
            value={selectedStudentId}
          >
            <option value="all">전체 학생</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="parent-metric-grid">
          <article>
            <Users aria-hidden="true" size={20} />
            <span>연결 학생</span>
            <strong>{selectedStudent ? "1" : students.length}</strong>
            <p>{studentCountLabel}</p>
          </article>
          <article>
            <CheckCircle2 aria-hidden="true" size={20} />
            <span>공개 피드백</span>
            <strong>{filteredEntries.length}</strong>
            <p>보호자가 확인 가능한 기록</p>
          </article>
          <article>
            <Clock3 aria-hidden="true" size={20} />
            <span>최근 업데이트</span>
            <strong>{latestDate}</strong>
            <p>{latestEntry?.submission.sessionTitle || "아직 공개 기록 없음"}</p>
          </article>
        </div>

        <div className="parent-linked-list">
          <h3>연결된 학생</h3>
          {students.length ? (
            students.map((student) => {
              const studentEntryCount = entries.filter(
                (entry) => entry.submission.studentId === student.id
              ).length;
              return (
                <button
                  className={`text-list-item ${
                    selectedStudentId === student.id ? "active" : ""
                  }`}
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  type="button"
                >
                  <span>
                    <strong>{student.displayName}</strong>
                    <small>
                      {student.email || "이메일 없음"} · 공개 피드백 {studentEntryCount}개
                    </small>
                  </span>
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              );
            })
          ) : (
            <div className="empty-inline">
              <strong>아직 연결된 학생이 없습니다.</strong>
              <p>관리자가 부모-학생 연결을 승인하면 이 화면에서 확인할 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel parent-feedback-panel parent-report-print">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Published Feedback</p>
            <h2>공개 피드백과 성장 기록</h2>
          </div>
          <div className="row-actions print-hidden">
            <span className="status">
              {isLoading ? "불러오는 중" : `${filteredEntries.length}개`}
            </span>
            <button onClick={() => window.print()} type="button">
              <Printer aria-hidden="true" size={17} />
              요약 인쇄
            </button>
          </div>
        </div>

        {latestEntry ? (
          <article className="parent-highlight-card">
            <div className="portfolio-timeline-marker">
              <MessageSquareText aria-hidden="true" size={19} />
            </div>
            <div>
              <span className="status done">최근 피드백</span>
              <h3>{latestEntry.submission.sessionTitle}</h3>
              <p>{getParentSummary(latestEntry)}</p>
              <Link
                className="primary-link print-hidden"
                href={`/parent/submissions/${latestEntry.submission.id}/feedback`}
              >
                자세히 보기
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </article>
        ) : null}

        <div className="parent-growth-strip">
          <article>
            <BarChart3 aria-hidden="true" size={18} />
            <strong>{filteredEntries.length}</strong>
            <span>누적 공개 기록</span>
          </article>
          <article>
            <MessageSquareText aria-hidden="true" size={18} />
            <strong>
              {
                filteredEntries.filter((entry) => entry.review.feedbackDraft?.parentSummary)
                  .length
              }
            </strong>
            <span>부모 요약 포함</span>
          </article>
          <article>
            <CheckCircle2 aria-hidden="true" size={18} />
            <strong>{selectedStudent ? selectedStudent.displayName : "전체"}</strong>
            <span>현재 보기</span>
          </article>
        </div>

        <div className="parent-summary-report">
          <h3>보호자 요약 리포트</h3>
          {parentSummaryText ? (
            <p>{parentSummaryText}</p>
          ) : (
            <p>공개된 피드백이 쌓이면 이곳에 보호자용 요약이 표시됩니다.</p>
          )}
        </div>

        <div className="portfolio-list">
          {filteredEntries.length ? (
            filteredEntries.map((entry) => (
              <article className="portfolio-card" key={entry.submission.id}>
                <div>
                  <span className="status done">{entry.submission.studentName}</span>
                  <h3>{entry.submission.sessionTitle}</h3>
                  <p>{getParentSummary(entry)}</p>
                  <small>{formatDate(entry.submission.updatedAt)} 업데이트</small>
                </div>
                <Link
                  className="primary-link print-hidden"
                  href={`/parent/submissions/${entry.submission.id}/feedback`}
                >
                  보기
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              </article>
            ))
          ) : (
            <div className="empty-inline">
              <strong>아직 공개된 피드백이 없습니다.</strong>
              <p>튜터가 피드백을 공개하면 보호자 화면에 자동으로 누적됩니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
