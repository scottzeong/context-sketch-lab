"use client";

import { ClipboardCheck, ImageIcon, Save, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  StoredSubmissionRecord,
  updateStoredSubmissionStatus
} from "@/lib/submissionRepository";
import {
  getReviewForSubmission,
  saveStoredTutorReview,
  StoredTutorReviewRecord
} from "@/lib/reviewRepository";

type TutorReviewWorkspaceProps = {
  submission: StoredSubmissionRecord;
  onReviewSaved?: () => void | Promise<void>;
};

function splitLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(value?: string[]) {
  return value?.join("\n") || "";
}

export function TutorReviewWorkspace({
  submission,
  onReviewSaved
}: TutorReviewWorkspaceProps) {
  const [review, setReview] = useState<StoredTutorReviewRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    async function loadReview() {
      setReview(await getReviewForSubmission(submission.id));
      setMessage(null);
    }

    void loadReview();
  }, [submission.id]);

  function buildReviewPayload(formData: FormData) {
    return {
      submissionId: submission.id,
      tutorObservation: String(formData.get("tutorObservation") || ""),
      keyConnections: splitLines(formData.get("keyConnections")),
      strengths: splitLines(formData.get("strengths")),
      misconceptions: splitLines(formData.get("misconceptions")),
      nextStep: String(formData.get("nextStep") || "")
    };
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const saved = await saveStoredTutorReview({
      ...buildReviewPayload(formData),
      id: review?.id,
      evaluationJson: review?.evaluationJson,
      feedbackDraft: review?.feedbackDraft,
      status: review?.status === "approved" ? "approved" : "draft"
    });

    await updateStoredSubmissionStatus(submission.id, "under_review");
    setReview(saved);
    setMessage("튜터 리뷰 초안을 저장했습니다.");
    await onReviewSaved?.();
  }

  async function generateAiDraft(formData: FormData) {
    setBusyAction("ai");
    setMessage("AI 평가/피드백 초안을 생성하는 중입니다...");

    try {
      const payload = buildReviewPayload(formData);
      const response = await fetch("/api/ai/evaluate-tutor-feedback-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentExplanation: submission.studentExplanation,
          tutorObservation: payload.tutorObservation,
          keyConnections: payload.keyConnections,
          strengths: payload.strengths,
          misconceptions: payload.misconceptions,
          nextStep: payload.nextStep
        })
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "AI draft failed.");
      }

      const saved = await saveStoredTutorReview({
        ...payload,
        id: review?.id,
        evaluationJson: json.evaluation,
        feedbackDraft: json.evaluation.feedbackDraft,
        status: "ai_drafted"
      });

      await updateStoredSubmissionStatus(submission.id, "under_review");
      setReview(saved);
      setMessage("AI 초안을 저장했습니다. 튜터가 수정 후 승인할 수 있습니다.");
      await onReviewSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI draft failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function approveReview() {
    if (!review) {
      setMessage("먼저 리뷰 초안 또는 AI 초안을 저장해 주세요.");
      return;
    }

    const saved = await saveStoredTutorReview({
      ...review,
      status: "published"
    });

    await updateStoredSubmissionStatus(submission.id, "feedback_published");
    setReview(saved);
    setMessage("피드백을 published 상태로 승인했습니다.");
    await onReviewSaved?.();
  }

  return (
    <div className="review-workspace">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{submission.status}</p>
            <h2>{submission.sessionTitle}</h2>
          </div>
          <span className="status review">튜터 검토</span>
        </div>

        <div className="metadata-grid">
          <span>학생: {submission.studentName}</span>
          <span>연결: {submission.importantConnection || "미입력"}</span>
          <span>사진: {submission.imageName || "없음"}</span>
          <span>상태: {submission.status}</span>
        </div>

        <div className="submission-review-grid">
          <div>
            <h3>학생 설명</h3>
            <p>{submission.studentExplanation || "설명이 없습니다."}</p>
            <h3>어려웠던 부분</h3>
            <p>{submission.difficultPart || "입력된 내용이 없습니다."}</p>
          </div>
          <div className="submission-preview">
            {submission.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="학생 스케치" src={submission.imageDataUrl} />
            ) : (
              <div>
                <ImageIcon aria-hidden="true" size={28} />
                <p>제출된 이미지가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <form className="panel" onSubmit={saveDraft}>
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Tutor Input</p>
            <h2>관찰과 피드백 방향</h2>
          </div>
          <div className="row-actions">
            <button className="secondary-button" type="submit">
              <Save aria-hidden="true" size={17} />
              초안 저장
            </button>
            <button
              disabled={busyAction === "ai"}
              onClick={(event) => {
                const form = event.currentTarget.form;
                if (form) {
                  void generateAiDraft(new FormData(form));
                }
              }}
              type="button"
            >
              <Sparkles aria-hidden="true" size={17} />
              {busyAction === "ai" ? "AI 작성 중" : "AI 초안"}
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="tutorObservation">튜터 관찰</label>
          <textarea
            id="tutorObservation"
            name="tutorObservation"
            defaultValue={review?.tutorObservation || ""}
            placeholder="학생이 무엇을 잘 표현했고, 무엇을 혼동했는지 기록합니다."
          />
        </div>

        <div className="grid-two">
          <div className="field">
            <label htmlFor="keyConnections">핵심 연결</label>
            <textarea
              id="keyConnections"
              name="keyConnections"
              defaultValue={
                joinLines(review?.keyConnections) || submission.importantConnection
              }
              placeholder="한 줄에 하나씩 입력"
            />
          </div>
          <div className="field">
            <label htmlFor="strengths">강점</label>
            <textarea
              id="strengths"
              name="strengths"
              defaultValue={joinLines(review?.strengths)}
              placeholder="한 줄에 하나씩 입력"
            />
          </div>
          <div className="field">
            <label htmlFor="misconceptions">오해/보완점</label>
            <textarea
              id="misconceptions"
              name="misconceptions"
              defaultValue={joinLines(review?.misconceptions)}
              placeholder="한 줄에 하나씩 입력"
            />
          </div>
          <div className="field">
            <label htmlFor="nextStep">다음 과제</label>
            <textarea
              id="nextStep"
              name="nextStep"
              defaultValue={review?.nextStep || ""}
              placeholder="다음 활동에서 시도할 것을 적습니다."
            />
          </div>
        </div>

        {message ? <p className="save-message">{message}</p> : null}
      </form>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">AI Draft</p>
            <h2>평가와 피드백 초안</h2>
          </div>
          <button className="secondary-button" onClick={approveReview} type="button">
            <ClipboardCheck aria-hidden="true" size={17} />
            승인/공개
          </button>
        </div>

        {review?.feedbackDraft ? (
          <div className="feedback-draft-grid">
            <article>
              <h3>학생 피드백</h3>
              <p>{review.feedbackDraft.studentFacing}</p>
            </article>
            <article>
              <h3>튜터 노트</h3>
              <p>{review.feedbackDraft.tutorNotes}</p>
            </article>
            <article>
              <h3>보호자 요약</h3>
              <p>{review.feedbackDraft.parentSummary}</p>
            </article>
          </div>
        ) : (
          <div className="empty-inline">
            <strong>아직 AI 초안이 없습니다.</strong>
            <p>튜터 관찰을 입력한 뒤 AI 초안 버튼을 눌러 주세요.</p>
          </div>
        )}

        <div className="analysis-preview">
          <h3>평가 JSON</h3>
          <pre>
            {review?.evaluationJson
              ? JSON.stringify(review.evaluationJson, null, 2)
              : "AI 평가 초안이 생성되면 여기에 JSON이 표시됩니다."}
          </pre>
        </div>
      </section>
    </div>
  );
}
