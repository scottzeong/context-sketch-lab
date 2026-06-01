"use client";

import { ArrowLeft, CheckCircle2, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPublishedFeedbackForSubmission,
  PortfolioEntry
} from "@/lib/portfolioRepository";

type StudentFeedbackDetailProps = {
  submissionId: string;
};

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
        <p>튜터가 피드백을 승인하면 이 화면에서 확인할 수 있습니다.</p>
        <Link className="primary-link" href="/student/portfolio">
          <ArrowLeft aria-hidden="true" size={17} />
          포트폴리오로 이동
        </Link>
      </section>
    );
  }

  const { submission, review } = entry;

  return (
    <div className="feedback-detail-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Tutor Feedback</p>
            <h2>{submission.sessionTitle}</h2>
          </div>
          <span className="status done">published</span>
        </div>

        <article className="student-feedback-card">
          <CheckCircle2 aria-hidden="true" size={22} />
          <div>
            <h3>튜터 피드백</h3>
            <p>{review.feedbackDraft?.studentFacing || "공개된 피드백이 없습니다."}</p>
          </div>
        </article>

        <div className="feedback-draft-grid">
          <article>
            <h3>내가 설명한 것</h3>
            <p>{submission.studentExplanation || "입력한 설명이 없습니다."}</p>
          </article>
          <article>
            <h3>중요 연결</h3>
            <p>{submission.importantConnection || "입력한 연결이 없습니다."}</p>
          </article>
          <article>
            <h3>다음 과제</h3>
            <p>{review.nextStep || "다음 과제가 아직 없습니다."}</p>
          </article>
        </div>
      </section>

      <aside className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Sketch</p>
            <h2>제출 이미지</h2>
          </div>
        </div>
        <div className="submission-preview">
          {submission.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="내 맥락스케치" src={submission.imageDataUrl} />
          ) : (
            <div>
              <ImageIcon aria-hidden="true" size={28} />
              <p>제출된 이미지가 없습니다.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
