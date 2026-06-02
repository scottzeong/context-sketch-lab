"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getPublishedPortfolioEntries,
  PortfolioEntry
} from "@/lib/portfolioRepository";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function getAverageScore(entry: PortfolioEntry) {
  const evaluation = entry.review.evaluationJson as
    | { rubricScores?: Array<{ score?: number }> }
    | undefined;
  const scores = evaluation?.rubricScores
    ?.map((score) => score.score)
    .filter((score): score is number => typeof score === "number");

  if (!scores?.length) {
    return null;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function StudentPortfolio() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      setIsLoading(true);
      try {
        setEntries(await getPublishedPortfolioEntries());
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "포트폴리오를 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPortfolio();
  }, []);

  const averageScore = useMemo(() => {
    const scores = entries
      .map(getAverageScore)
      .filter((score): score is number => typeof score === "number");

    if (!scores.length) {
      return null;
    }

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [entries]);

  const latestEntry = entries[0] || null;

  return (
    <div className="student-portfolio-layout">
      <section className="panel student-portfolio-main">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Portfolio</p>
            <h2>나의 성장 기록</h2>
          </div>
          <span className="status done">
            {isLoading ? "불러오는 중" : `${entries.length}개 공개됨`}
          </span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        {latestEntry ? (
          <article className="portfolio-highlight-card">
            <span className="status done">최근 피드백</span>
            <h3>{latestEntry.submission.sessionTitle}</h3>
            <p>
              {latestEntry.review.feedbackDraft?.studentFacing ||
                "공개된 피드백이 없습니다."}
            </p>
            <Link
              className="primary-link"
              href={`/student/submissions/${latestEntry.submission.id}/feedback`}
            >
              자세히 보기
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </article>
        ) : (
          <div className="empty-inline">
            <strong>아직 공개된 포트폴리오 기록이 없습니다.</strong>
            <p>튜터가 피드백을 공개하면 이곳에 성장 기록이 누적됩니다.</p>
          </div>
        )}

        <div className="portfolio-timeline">
          {entries.map((entry) => (
            <article className="portfolio-timeline-card" key={entry.submission.id}>
              <div className="portfolio-timeline-marker">
                <CheckCircle2 aria-hidden="true" size={18} />
              </div>
              <div>
                <div className="portfolio-card-heading">
                  <span className="status done">피드백</span>
                  <small>
                    <CalendarDays aria-hidden="true" size={14} />
                    {formatDate(entry.submission.submittedAt)}
                  </small>
                </div>
                <h3>{entry.submission.sessionTitle}</h3>
                <p>
                  {entry.review.feedbackDraft?.studentFacing ||
                    "공개된 피드백이 없습니다."}
                </p>
                <Link
                  className="quiet-link"
                  href={`/student/submissions/${entry.submission.id}/feedback`}
                >
                  피드백 보기
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="panel student-growth-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Growth</p>
            <h2>성장 요약</h2>
          </div>
        </div>

        <div className="student-growth-metrics">
          <article>
            <BookOpenCheck aria-hidden="true" size={21} />
            <span>공개된 기록</span>
            <strong>{entries.length}개</strong>
          </article>
          <article>
            <TrendingUp aria-hidden="true" size={21} />
            <span>평균 루브릭</span>
            <strong>{averageScore ? averageScore.toFixed(1) : "-"}</strong>
          </article>
        </div>

        <div className="student-growth-note">
          <h3>다음에 볼 것</h3>
          <p>
            피드백에서 반복해서 성장하는 생각의 연결과 다음 과제를 확인하면,
            다음 스케치에서 무엇을 더 선명하게 표현할지 정할 수 있습니다.
          </p>
        </div>
      </aside>
    </div>
  );
}
