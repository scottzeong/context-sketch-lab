"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Lightbulb,
  Link2,
  Target
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPublishedFeedbackForSubmission,
  PortfolioEntry
} from "@/lib/portfolioRepository";

type StudentFeedbackDetailProps = {
  submissionId: string;
};

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

export function StudentFeedbackDetail({ submissionId }: StudentFeedbackDetailProps) {
  const [entry, setEntry] = useState<PortfolioEntry | null>(null);

  useEffect(() => {
    async function loadFeedback() {
      setEntry(await getPublishedFeedbackForSubmission(submissionId));
    }

    void loadFeedback();
  }, [submissionId]);

  if (!entry) {
    return (
      <section className="panel empty-state">
        <strong>아직 공개된 피드백이 없습니다.</strong>
        <p>튜터가 피드백을 보내면 이 화면에서 확인할 수 있습니다.</p>
        <Link className="primary-link" href="/student/portfolio">
          <ArrowLeft aria-hidden="true" size={17} />
          포트폴리오로 이동
        </Link>
      </section>
    );
  }

  const { submission, review } = entry;
  const averageScore = getAverageScore(entry);

  return (
    <div className="student-feedback-layout">
      <section className="panel student-feedback-main">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Tutor Feedback</p>
            <h2>{submission.sessionTitle}</h2>
          </div>
          <span className="status done">공개 완료</span>
        </div>

        <article className="student-feedback-hero-card">
          <CheckCircle2 aria-hidden="true" size={24} />
          <div>
            <h3>튜터 피드백</h3>
            <p>
              {review.feedbackDraft?.studentFacing ||
                "공개된 학생용 피드백이 없습니다."}
            </p>
          </div>
        </article>

        <div className="student-feedback-card-grid">
          <article>
            <Link2 aria-hidden="true" size={20} />
            <h3>내가 찾은 핵심 연결</h3>
            <p>{submission.importantConnection || "입력된 핵심 연결이 없습니다."}</p>
          </article>
          <article>
            <Lightbulb aria-hidden="true" size={20} />
            <h3>내 설명</h3>
            <p>{submission.studentExplanation || "입력된 설명이 없습니다."}</p>
          </article>
          <article>
            <Target aria-hidden="true" size={20} />
            <h3>다음 과제</h3>
            <p>{review.nextStep || "아직 다음 과제가 없습니다."}</p>
          </article>
        </div>

        {review.feedbackDraft?.parentSummary ? (
          <div className="student-parent-summary">
            <h3>보호자에게 보여줄 요약</h3>
            <p>{review.feedbackDraft.parentSummary}</p>
          </div>
        ) : null}
      </section>

      <aside className="panel student-feedback-side">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Sketch</p>
            <h2>제출 이미지</h2>
          </div>
        </div>
        <div className="student-feedback-image">
          {submission.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="제출한 맥락 스케치" src={submission.imageDataUrl} />
          ) : (
            <div>
              <ImageIcon aria-hidden="true" size={28} />
              <p>제출 이미지가 없습니다.</p>
            </div>
          )}
        </div>

        <div className="student-feedback-score-card">
          <span>평균 루브릭 점수</span>
          <strong>{averageScore ? averageScore.toFixed(1) : "-"}</strong>
          <p>점수는 튜터가 다음 활동을 조정하기 위한 참고 자료입니다.</p>
        </div>

        <Link className="quiet-link" href="/student/portfolio">
          <ArrowLeft aria-hidden="true" size={17} />
          포트폴리오로 돌아가기
        </Link>
      </aside>
    </div>
  );
}
