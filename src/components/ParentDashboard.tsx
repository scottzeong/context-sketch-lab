"use client";

import { ArrowRight, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getLinkedParentStudents,
  getParentPortfolioEntries,
  ParentStudentRecord
} from "@/lib/parentRepository";
import type { PortfolioEntry } from "@/lib/portfolioRepository";

export function ParentDashboard() {
  const [students, setStudents] = useState<ParentStudentRecord[]>([]);
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("all");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadParentDashboard() {
      try {
        const [nextStudents, nextEntries] = await Promise.all([
          getLinkedParentStudents(),
          getParentPortfolioEntries()
        ]);
        setStudents(nextStudents);
        setEntries(nextEntries);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "보호자 화면을 불러오지 못했습니다."
        );
      }
    }

    void loadParentDashboard();
  }, []);

  const filteredEntries = useMemo(() => {
    if (selectedStudentId === "all") {
      return entries;
    }

    const selectedStudent = students.find((student) => student.id === selectedStudentId);
    return entries.filter(
      (entry) => entry.submission.studentName === selectedStudent?.displayName
    );
  }, [entries, selectedStudentId, students]);

  return (
    <div className="parent-dashboard-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Linked Students</p>
            <h2>연결된 학생</h2>
          </div>
          <span className="status done">{students.length} students</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <div className="field">
          <label htmlFor="parent-student-filter">학생 필터</label>
          <select
            id="parent-student-filter"
            onChange={(event) => setSelectedStudentId(event.target.value)}
            value={selectedStudentId}
          >
            <option value="all">전체</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="next-grid single-column">
          <div>
            <Users aria-hidden="true" size={20} />
            <strong>{students.length}명</strong>
            <p>연결된 학생</p>
          </div>
          <div>
            <CheckCircle2 aria-hidden="true" size={20} />
            <strong>{filteredEntries.length}개</strong>
            <p>공개 피드백</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Feedback</p>
            <h2>공개 피드백</h2>
          </div>
        </div>

        <div className="portfolio-list">
          {filteredEntries.length ? (
            filteredEntries.map((entry) => (
              <article className="portfolio-card" key={entry.submission.id}>
                <div>
                  <span className="status done">{entry.submission.studentName}</span>
                  <h3>{entry.submission.sessionTitle}</h3>
                  <p>
                    {entry.review.feedbackDraft?.parentSummary ||
                      entry.review.feedbackDraft?.studentFacing ||
                      "공개된 피드백이 없습니다."}
                  </p>
                </div>
                <Link
                  className="primary-link"
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
              <p>튜터가 피드백을 공개하면 보호자 화면에서 확인할 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
