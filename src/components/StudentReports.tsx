"use client";

import {
  BarChart3,
  ClipboardCopy,
  FileText,
  Printer,
  Save,
  Search,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getLearningGroups, LearningGroupRecord } from "@/lib/groupRepository";
import { getPublishedPortfolioEntries, PortfolioEntry } from "@/lib/portfolioRepository";
import { getReportDrafts, saveReportDraft, StoredReportDraft } from "@/lib/reportRepository";
import { getStoredSessions, StoredSessionRecord } from "@/lib/sessionRepository";

type StudentReportGroup = {
  studentId?: string;
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

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
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

function buildReportDraft(group: StudentReportGroup, periodLabel: string) {
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
    .slice(0, 4);

  return [
    `[${group.studentName} 학습 리포트]`,
    "",
    `기간: ${periodLabel}`,
    `공개 피드백 기록: ${group.entries.length}개`,
    `평균 루브릭 점수: ${averageScore ? averageScore.toFixed(1) : "-"}`,
    latest ? `최근 활동: ${latest.submission.sessionTitle}` : "",
    "",
    "1. 최근 학습 요약",
    parentSummaries.length
      ? parentSummaries.map((summary) => `- ${summary}`).join("\n")
      : "- 아직 보호자용 요약이 충분히 누적되지 않았습니다.",
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

export function StudentReports({ readOnly = false }: { readOnly?: boolean }) {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [groups, setGroups] = useState<LearningGroupRecord[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<StoredReportDraft[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [tutorFilter, setTutorFilter] = useState("all");
  const [textFilter, setTextFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      try {
        const [nextEntries, nextSessions, nextGroups, nextDrafts] = await Promise.all([
          getPublishedPortfolioEntries(),
          getStoredSessions(),
          getLearningGroups(),
          getReportDrafts()
        ]);
        setEntries(nextEntries);
        setSessions(nextSessions);
        setGroups(nextGroups);
        setSavedDrafts(nextDrafts);
        setSelectedStudent((current) => current || nextEntries[0]?.submission.studentName || null);
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "리포트를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadReports();
  }, []);

  const sessionById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions]
  );

  const studentOptions = useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => entry.submission.studentName).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [entries]
  );
  const tutorOptions = useMemo(
    () =>
      Array.from(new Set(sessions.map((session) => session.createdBy).filter(Boolean))).sort(
        (a, b) => String(a).localeCompare(String(b))
      ) as string[],
    [sessions]
  );
  const textOptions = useMemo(() => {
    const byId = new Map<string, string>();
    sessions.forEach((session) => {
      if (session.textId) {
        byId.set(session.textId, session.textTitle || session.textId);
      }
    });
    return Array.from(byId.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sessions]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const session = sessionById.get(entry.submission.sessionId);
      const submittedAt = new Date(entry.submission.submittedAt);
      const afterStart = startDate ? submittedAt >= new Date(startDate) : true;
      const beforeEnd = endDate ? submittedAt <= new Date(`${endDate}T23:59:59`) : true;
      const groupMatch =
        groupFilter === "all"
          ? true
          : groupFilter === "ungrouped"
            ? !session?.groupId
            : session?.groupId === groupFilter;
      const studentMatch =
        studentFilter === "all" || entry.submission.studentName === studentFilter;
      const sessionMatch = sessionFilter === "all" || entry.submission.sessionId === sessionFilter;
      const tutorMatch = tutorFilter === "all" || session?.createdBy === tutorFilter;
      const textMatch = textFilter === "all" || session?.textId === textFilter;

      return (
        afterStart &&
        beforeEnd &&
        groupMatch &&
        studentMatch &&
        sessionMatch &&
        tutorMatch &&
        textMatch
      );
    });
  }, [
    endDate,
    entries,
    groupFilter,
    sessionById,
    sessionFilter,
    startDate,
    studentFilter,
    textFilter,
    tutorFilter
  ]);

  const groupsByStudent = useMemo(() => {
    const grouped = new Map<string, PortfolioEntry[]>();

    filteredEntries.forEach((entry) => {
      const studentName = entry.submission.studentName || "학생";
      grouped.set(studentName, [...(grouped.get(studentName) || []), entry]);
    });

    return Array.from(grouped.entries())
      .map(([studentName, groupEntries]) => ({
        studentName,
        studentId: groupEntries[0]?.submission.studentId,
        entries: groupEntries.sort(
          (a, b) =>
            new Date(b.submission.submittedAt).getTime() -
            new Date(a.submission.submittedAt).getTime()
        )
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [filteredEntries]);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return groupsByStudent;
    }

    return groupsByStudent.filter((group) =>
      [
        group.studentName,
        ...group.entries.map((entry) => entry.submission.sessionTitle),
        ...group.entries.map((entry) => sessionById.get(entry.submission.sessionId)?.textTitle || "")
      ].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [groupsByStudent, query, sessionById]);

  const selectedGroup =
    groupsByStudent.find((group) => group.studentName === selectedStudent) ||
    filteredGroups[0] ||
    null;

  const periodLabel =
    startDate || endDate ? `${startDate || "처음"} - ${endDate || "현재"}` : "전체 기간";
  const generatedDraft = selectedGroup ? buildReportDraft(selectedGroup, periodLabel) : "";
  const axisAverages = selectedGroup ? getAxisAverages(selectedGroup.entries) : [];
  const averageScore = selectedGroup ? getAverageScore(selectedGroup.entries) : null;
  const savedDraft = selectedGroup
    ? savedDrafts.find((draft) => draft.studentName === selectedGroup.studentName)
    : null;

  useEffect(() => {
    if (!selectedGroup) {
      setReportBody("");
      return;
    }

    const existing = savedDrafts.find((draft) => draft.studentName === selectedGroup.studentName);
    setReportBody(existing?.body || generatedDraft);
  }, [generatedDraft, savedDrafts, selectedGroup]);

  function resetSelected() {
    setSelectedStudent(null);
  }

  async function copyReport() {
    if (!reportBody) {
      return;
    }

    await navigator.clipboard.writeText(reportBody);
    setMessage("리포트 초안을 클립보드에 복사했습니다.");
  }

  async function saveDraft() {
    if (readOnly) {
      setMessage("관리자는 리포트를 참조만 할 수 있습니다.");
      return;
    }

    if (!selectedGroup || !reportBody.trim()) {
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await saveReportDraft({
        studentId: selectedGroup.studentId,
        studentName: selectedGroup.studentName,
        title: `${selectedGroup.studentName} 학습 리포트`,
        body: reportBody,
        periodStart: startDate,
        periodEnd: endDate
      });
      setSavedDrafts((current) => [saved, ...current.filter((draft) => draft.id !== saved.id)]);
      setMessage("리포트 초안을 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "리포트 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function printReport() {
    window.print();
  }

  function setLastDays(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
    resetSelected();
  }

  return (
    <div className="reports-layout">
      <section className="panel reports-list print-hidden">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Reports</p>
            <h2>학생 리포트</h2>
          </div>
          <span className="status done">
            {isLoading ? "불러오는 중" : `${groupsByStudent.length}명`}
          </span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="report-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="report-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="학생, 세션, 생성된 문장 검색"
            value={query}
          />
        </label>

        <div className="grid-two compact-filter-grid">
          <div className="field">
            <label htmlFor="report-student-filter">학생</label>
            <select
              id="report-student-filter"
              onChange={(event) => {
                setStudentFilter(event.target.value);
                resetSelected();
              }}
              value={studentFilter}
            >
              <option value="all">전체</option>
              {studentOptions.map((student) => (
                <option key={student} value={student}>
                  {student}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="report-session-filter">세션</label>
            <select
              id="report-session-filter"
              onChange={(event) => {
                setSessionFilter(event.target.value);
                resetSelected();
              }}
              value={sessionFilter}
            >
              <option value="all">전체</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="report-tutor-filter">튜터</label>
            <select
              id="report-tutor-filter"
              onChange={(event) => {
                setTutorFilter(event.target.value);
                resetSelected();
              }}
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
          <div className="field">
            <label htmlFor="report-text-filter">생성된 문장</label>
            <select
              id="report-text-filter"
              onChange={(event) => {
                setTextFilter(event.target.value);
                resetSelected();
              }}
              value={textFilter}
            >
              <option value="all">전체</option>
              {textOptions.map(([textId, title]) => (
                <option key={textId} value={textId}>
                  {title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="report-group-filter">그룹</label>
            <select
              id="report-group-filter"
              onChange={(event) => {
                setGroupFilter(event.target.value);
                resetSelected();
              }}
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
            <label htmlFor="report-start-date">시작일</label>
            <input
              id="report-start-date"
              onChange={(event) => {
                setStartDate(event.target.value);
                resetSelected();
              }}
              type="date"
              value={startDate}
            />
          </div>
          <div className="field">
            <label htmlFor="report-end-date">종료일</label>
            <input
              id="report-end-date"
              onChange={(event) => {
                setEndDate(event.target.value);
                resetSelected();
              }}
              type="date"
              value={endDate}
            />
          </div>
          <div className="report-quick-filters">
            <button className="secondary-button" onClick={() => setLastDays(30)} type="button">
              최근 30일
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                resetSelected();
              }}
              type="button"
            >
              전체 기간
            </button>
          </div>
        </div>

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
                    {group.entries.length}개 기록 | 평균{" "}
                    {getAverageScore(group.entries)?.toFixed(1) || "-"}
                  </small>
                </span>
                <FileText aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>조건에 맞는 리포트 데이터가 없습니다.</strong>
              <p>필터를 조정하거나 공개된 피드백이 있는지 확인해 주세요.</p>
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
                {savedDraft ? <p>마지막 저장 {formatDate(savedDraft.updatedAt)}</p> : null}
              </div>
              <div className="row-actions print-hidden">
                <button className="secondary-button" onClick={copyReport} type="button">
                  <ClipboardCopy aria-hidden="true" size={17} />
                  초안 복사
                </button>
                {!readOnly ? (
                  <button
                    className="secondary-button"
                    disabled={isSaving}
                    onClick={saveDraft}
                    type="button"
                  >
                    <Save aria-hidden="true" size={17} />
                    {isSaving ? "저장 중" : "초안 저장"}
                  </button>
                ) : null}
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
                <span>기간</span>
                <strong>{periodLabel}</strong>
              </article>
            </div>

            <div className="report-section">
              <h3>학부모 리포트 초안</h3>
              <textarea
                className="report-draft report-draft-editor"
                readOnly={readOnly}
                onChange={(event) => setReportBody(event.target.value)}
                value={reportBody}
              />
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
                <div className="empty-inline">
                  <strong>아직 루브릭 점수 데이터가 없습니다.</strong>
                  <p>튜터 리뷰에서 평가 초안을 생성하면 축별 평균이 표시됩니다.</p>
                </div>
              )}
            </div>

            <div className="report-section">
              <h3>공개 피드백 기록</h3>
              <div className="report-entry-list">
                {selectedGroup.entries.map((entry) => {
                  const session = sessionById.get(entry.submission.sessionId);
                  return (
                    <article key={entry.submission.id}>
                      <div>
                        <span className="status done">
                          {formatDate(entry.submission.submittedAt)}
                        </span>
                        <h4>{entry.submission.sessionTitle}</h4>
                        <small>{session?.textTitle ? `글: ${session.textTitle}` : null}</small>
                      </div>
                      <p>
                        {entry.review.feedbackDraft?.studentFacing ||
                          "학생용 피드백이 없습니다."}
                      </p>
                      {entry.review.nextStep ? (
                        <small>다음 과제: {entry.review.nextStep}</small>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>선택된 학생이 없습니다.</strong>
            <p>피드백을 공개하면 학생 리포트를 확인할 수 있습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
