"use client";

import { ArrowRight, BookOpenCheck, TrendingUp } from "lucide-react";
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

  useEffect(() => {
    async function loadPortfolio() {
      setEntries(await getPublishedPortfolioEntries());
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

  return (
    <div className="portfolio-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Portfolio</p>
            <h2>학습 기록</h2>
          </div>
          <span className="status done">{entries.length} published</span>
        </div>

        <div className="portfolio-list">
          {entries.length ? (
            entries.map((entry) => (
              <article className="portfolio-card" key={entry.submission.id}>
                <div>
                  <span className="status done">feedback</span>
                  <h3>{entry.submission.sessionTitle}</h3>
                  <p>
                    {entry.review.feedbackDraft?.studentFacing ||
                      "공개된 피드백이 없습니다."}
                  </p>
                  <small>{formatDate(entry.submission.submittedAt)}</small>
                </div>
                <Link
                  className="primary-link"
                  href={`/student/submissions/${entry.submission.id}/feedback`}
                >
                  보기
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              </article>
            ))
          ) : (
            <div className="empty-inline">
              <strong>아직 공개된 포트폴리오 기록이 없습니다.</strong>
              <p>튜터가 피드백을 승인하면 여기에 기록이 쌓입니다.</p>
            </div>
          )}
        </div>
      </section>

      <aside className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Growth</p>
            <h2>성장 요약</h2>
          </div>
        </div>
        <div className="next-grid single-column">
          <div>
            <BookOpenCheck aria-hidden="true" size={20} />
            <strong>{entries.length}개</strong>
            <p>승인된 학습 기록</p>
          </div>
          <div>
            <TrendingUp aria-hidden="true" size={20} />
            <strong>{averageScore ? averageScore.toFixed(1) : "-"}</strong>
            <p>평균 루브릭 점수</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
