"use client";

import {
  BarChart3,
  ClipboardCopy,
  FileText,
  Printer,
  Search,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getPublishedPortfolioEntries,
  PortfolioEntry
} from "@/lib/portfolioRepository";

type StudentReportGroup = {
  studentName: string;
  entries: PortfolioEntry[];
};

const rubricAxisLabels: Record<string, string> = {
  situation_inference: "상황 추론",
  structure: "구조 이해",
  abstraction: "추상화",
  perspective_shift: "관점 전환",
  expression_integration: "표현 통합"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function getRubricScores(entry: PortfolioEntry) {
  const evaluation = entry.review.evaluationJson as
    | { rubricScores?: Array<{ axis?: string; score?: number; rationale?: string }> }
    | undefined;

  return evaluation?.rubricScores || [];
}

function getAverageScore(entries: PortfolioEntry[]) {
  const scores = entries
    .flatMap(getRubricScores)
    .map((score) => score.score)
    .filter((score): score is number => typeof score === "number");

  if (!scores.length) {
    return null;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getAxisAverages(entries: PortfolioEntry[]) {
  const buckets = new Map<string, number[]>();

  entries.flatMap(getRubricScores).forEach((score) => {
    if (!score.axis || typeof score.score !== "number") {
      return;
    }

    buckets.set(score.axis, [...(buckets.get(score.axis) || []), score.score]);
  });

  return Array.from(buckets.entries()).map(([axis, scores]) => ({
    axis,
    average: scores.reduce((sum, score) => sum + score, 0) / scores.length
  }));
}

function buildReportDraft(group: StudentReportGroup) {
  const averageScore = getAverageScore(group.entries);
  const latest = group.entries[0];
  const strengths = group.entries.flatMap((entry) => entry.review.strengths).slice(0, 5);
  const nextSteps = group.entries
    .map((entry) => entry.review.nextStep)
    .filter(Boolean)
    .slice(0, 3);
  const parentSummaries = group.entries
    .map((entry) => entry.review.feedbackDraft?.parentSummary)
    .filter(Boolean)
    .slice(0, 3);

  return [
    `[${group.studentName} 학습 리포트]`,
    "",
    `총 공개 기록: ${group.entries.length}개`,
    `평균 루브릭 점수: ${averageScore ? averageScore.toFixed(1) : "-"}`,
    latest ? `최근 활동: ${latest.submission.sessionTitle}` : "",
    "",
    "1. 최근 학습 요약",
    parentSummaries.length
      ? parentSummaries.map((summary) => `- ${summary}`).join("\n")
      : "- 아직 보호자 요약이 충분하지 않습니다.",
    "",
    "2. 관찰된 강점",
    strengths.length
      ? strengths.map((strength) => `- ${strength}`).join("\n")
      : "- 아직 누적된 강점 기록이 없습니다.",
    "",
    "3. 다음 학습 방향",
    nextSteps.length
      ? nextSteps.map((nextStep) => `- ${nextStep}`).join("\n")
      : "- 다음 과제가 아직 정리되지 않았습니다."
  ]
    .filter(Boolean)
    .join("\n");
}

export function StudentReports() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const nextEntries = await getPublishedPortfolioEntries();
        setEntries(nextEntries);
        setSelectedStudent((current) => current || nextEntries[0]?.submission.studentName || null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "리포트를 불러오지 못했습니다.");
      }
    }

    void loadReports();
  }, []);

  const groups = useMemo(() => {
    const grouped = new Map<string, PortfolioEntry[]>();

    entries.forEach((entry) => {
      const studentName = entry.submission.studentName || "Student";
      grouped.set(studentName, [...(grouped.get(studentName) || []), entry]);
    });

    return Array.from(grouped.entries())
      .map(([studentName, groupEntries]) => ({
        studentName,
        entries: groupEntries.sort(
          (a, b) =>
            new Date(b.submission.submittedAt).getTime() -
            new Date(a.submission.submittedAt).getTime()
        )
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [entries]);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return groups;
    }

    return groups.filter((group) =>
      [
        group.studentName,
        ...group.entries.map((entry) => entry.submission.sessionTitle)
      ].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [groups, query]);

  const selectedGroup =
    groups.find((group) => group.studentName === selectedStudent) ||
    filteredGroups[0] ||
    null;

  const reportDraft = selectedGroup ? buildReportDraft(selectedGroup) : "";
  const axisAverages = selectedGroup ? getAxisAverages(selectedGroup.entries) : [];
  const averageScore = selectedGroup ? getAverageScore(selectedGroup.entries) : null;

  async function copyReport() {
    if (!reportDraft) {
      return;
    }

    await navigator.clipboard.writeText(reportDraft);
    setMessage("리포트 초안을 클립보드에 복사했습니다.");
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="reports-layout">
      <section className="panel reports-list print-hidden">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Reports</p>
            <h2>학생 리포트</h2>
          </div>
          <span className="status done">{groups.length} students</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="report-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="report-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="학생 또는 세션 검색"
            value={query}
          />
        </label>

        <div className="text-list">
          {filteredGroups.length ? (
            filteredGroups.map((group) => (
              <button
                className={`text-list-item ${
                  selectedGroup?.studentName === group.studentName ? "active" : ""
                }`}
                key={group.studentName}
                onClick={() => setSelectedStudent(group.studentName)}
                type="button"
              >
                <span>
                  <strong>{group.studentName}</strong>
                  <small>
                    {group.entries.length}개 기록 · 평균{" "}
                    {getAverageScore(group.entries)?.toFixed(1) || "-"}
                  </small>
                </span>
                <FileText aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>아직 리포트 데이터가 없습니다.</strong>
              <p>피드백을 공개하면 학생별 리포트가 생성됩니다.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel report-document">
        {selectedGroup ? (
          <>
            <div className="panel-heading report-document-heading">
              <div>
                <p className="section-kicker">Student Report v1</p>
                <h2>{selectedGroup.studentName} 학습 리포트</h2>
              </div>
              <div className="row-actions print-hidden">
                <button className="secondary-button" onClick={copyReport} type="button">
                  <ClipboardCopy aria-hidden="true" size={17} />
                  초안 복사
                </button>
                <button onClick={printReport} type="button">
                  <Printer aria-hidden="true" size={17} />
                  인쇄/PDF
                </button>
              </div>
            </div>

            <div className="report-summary-grid">
              <article>
                <FileText aria-hidden="true" size={20} />
                <span>공개 기록</span>
                <strong>{selectedGroup.entries.length}개</strong>
              </article>
              <article>
                <TrendingUp aria-hidden="true" size={20} />
                <span>평균 루브릭</span>
                <strong>{averageScore ? averageScore.toFixed(1) : "-"}</strong>
              </article>
              <article>
                <BarChart3 aria-hidden="true" size={20} />
                <span>최근 활동</span>
                <strong>{selectedGroup.entries[0]?.submission.sessionTitle || "-"}</strong>
              </article>
            </div>

            <div className="report-section">
              <h3>학부모 리포트 초안</h3>
              <pre className="report-draft">{reportDraft}</pre>
            </div>

            <div className="report-section">
              <h3>루브릭 축별 평균</h3>
              {axisAverages.length ? (
                <div className="report-axis-grid">
                  {axisAverages.map((axis) => (
                    <article key={axis.axis}>
                      <span>{rubricAxisLabels[axis.axis] || axis.axis}</span>
                      <strong>{axis.average.toFixed(1)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <p>아직 루브릭 점수 데이터가 없습니다.</p>
              )}
            </div>

            <div className="report-section">
              <h3>공개 피드백 기록</h3>
              <div className="report-entry-list">
                {selectedGroup.entries.map((entry) => (
                  <article key={entry.submission.id}>
                    <div>
                      <span className="status done">
                        {formatDate(entry.submission.submittedAt)}
                      </span>
                      <h4>{entry.submission.sessionTitle}</h4>
                    </div>
                    <p>
                      {entry.review.feedbackDraft?.studentFacing ||
                        "학생용 피드백이 없습니다."}
                    </p>
                    {entry.review.nextStep ? (
                      <small>다음 과제: {entry.review.nextStep}</small>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>선택된 학생이 없습니다.</strong>
            <p>피드백을 공개한 뒤 학생 리포트를 확인할 수 있습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
