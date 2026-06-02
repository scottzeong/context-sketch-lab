"use client";

import { CheckCircle2, ClipboardCheck, Eye, ImageIcon, Save, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { getConfigOptions } from "@/lib/configOptions";
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

type FeedbackDraft = {
  studentFacing: string;
  tutorNotes: string;
  parentSummary: string;
};

const statusLabels: Record<StoredSubmissionRecord["status"], string> = {
  submitted: "제출 완료",
  under_review: "검토 중",
  feedback_published: "피드백 공개"
};

const reviewStatusLabels: Record<StoredTutorReviewRecord["status"], string> = {
  draft: "튜터 초안",
  ai_drafted: "AI 초안",
  approved: "승인됨",
  published: "공개됨"
};

const defaultRubricAxisLabels: Record<string, string> = {
  situation_inference: "상황 추론",
  structure: "구조 이해",
  abstraction: "추상화",
  perspective_shift: "관점 전환",
  expression_integration: "표현 통합"
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

function getRubricScores(evaluationJson: unknown) {
  if (
    evaluationJson &&
    typeof evaluationJson === "object" &&
    "rubricScores" in evaluationJson &&
    Array.isArray(evaluationJson.rubricScores)
  ) {
    return evaluationJson.rubricScores as Array<{
      axis?: string;
      score?: number;
      rationale?: string;
    }>;
  }

  return [];
}

export function TutorReviewWorkspace({ submission, onReviewSaved }: TutorReviewWorkspaceProps) {
  const [review, setReview] = useState<StoredTutorReviewRecord | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft>({
    studentFacing: "",
    tutorNotes: "",
    parentSummary: ""
  });
  const [rubricAxisLabels, setRubricAxisLabels] = useState(defaultRubricAxisLabels);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    async function loadReview() {
      try {
        const [storedReview, configOptions] = await Promise.all([
          getReviewForSubmission(submission.id),
          getConfigOptions()
        ]);
        const rubricOptions = configOptions.filter((option) => option.category === "rubric_axis");
        setRubricAxisLabels({
          ...defaultRubricAxisLabels,
          ...Object.fromEntries(rubricOptions.map((option) => [option.value, option.label]))
        });
        setReview(storedReview);
        setFeedbackDraft({
          studentFacing: storedReview?.feedbackDraft?.studentFacing || "",
          tutorNotes: storedReview?.feedbackDraft?.tutorNotes || "",
          parentSummary: storedReview?.feedbackDraft?.parentSummary || ""
        });
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "리뷰를 불러오지 못했습니다.");
      }
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
    setBusyAction("save");
    setMessage("튜터 리뷰 초안을 저장하는 중입니다...");

    try {
      const formData = new FormData(event.currentTarget);
      const saved = await saveStoredTutorReview({
        ...buildReviewPayload(formData),
        id: review?.id,
        evaluationJson: review?.evaluationJson,
        feedbackDraft: feedbackDraft.studentFacing.trim() ? feedbackDraft : review?.feedbackDraft,
        status: review?.status === "published" ? "published" : "draft"
      });

      await updateStoredSubmissionStatus(submission.id, "under_review");
      setReview(saved);
      setMessage("튜터 리뷰 초안을 저장했습니다.");
      await onReviewSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  async function generateAiDraft(formData: FormData) {
    setBusyAction("ai");
    setMessage("AI가 피드백 초안을 생성하는 중입니다...");

    try {
      const payload = buildReviewPayload(formData);
      const response = await fetch("/api/ai/evaluate-tutor-feedback-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        throw new Error(json.error || "AI 초안 생성에 실패했습니다.");
      }

      const nextFeedback = json.evaluation.feedbackDraft as FeedbackDraft;
      const saved = await saveStoredTutorReview({
        ...payload,
        id: review?.id,
        evaluationJson: json.evaluation,
        feedbackDraft: nextFeedback,
        status: "ai_drafted"
      });

      await updateStoredSubmissionStatus(submission.id, "under_review");
      setReview(saved);
      setFeedbackDraft(nextFeedback);
      setMessage("AI 피드백 초안을 만들었습니다. 공개 전 튜터가 반드시 수정하고 확인해 주세요.");
      await onReviewSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 초안 생성에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  async function saveEditedFeedback(status: StoredTutorReviewRecord["status"]) {
    if (!review) {
      setMessage("먼저 튜터 리뷰를 저장하거나 AI 초안을 생성해 주세요.");
      return;
    }

    if (!feedbackDraft.studentFacing.trim()) {
      setMessage("학생에게 공개할 피드백을 입력해 주세요.");
      return;
    }

    setBusyAction(status === "published" ? "publish" : "feedback-save");
    setMessage(
      status === "published"
        ? "피드백을 공개하는 중입니다..."
        : "최종 피드백을 저장하는 중입니다..."
    );

    try {
      const saved = await saveStoredTutorReview({
        ...review,
        feedbackDraft,
        status
      });

      if (status === "published") {
        await updateStoredSubmissionStatus(submission.id, "feedback_published");
      }

      setReview(saved);
      setMessage(
        status === "published"
          ? "튜터가 수정한 최종 피드백을 공개했습니다."
          : "최종 피드백을 저장했습니다. 이제 피드백 보기를 사용할 수 있습니다."
      );
      await onReviewSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "피드백 저장에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  const rubricScores = getRubricScores(review?.evaluationJson);
  const canViewFeedback = review?.status === "approved" || review?.status === "published";

  return (
    <div className="review-workspace enhanced-review-workspace">
      <section className="panel review-submission-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{statusLabels[submission.status]}</p>
            <h2>{submission.sessionTitle}</h2>
          </div>
          <span className="status review">튜터 검토</span>
        </div>

        <div className="review-status-flow" aria-label="Review status">
          <span className="done">제출</span>
          <span className={submission.status !== "submitted" ? "done" : ""}>검토</span>
          <span className={submission.status === "feedback_published" ? "done" : ""}>공개</span>
        </div>

        <div className="metadata-grid">
          <span>학생: {submission.studentName}</span>
          <span>상태: {statusLabels[submission.status]}</span>
          <span>이미지: {submission.imageName || "없음"}</span>
          <span>리뷰: {review ? reviewStatusLabels[review.status] : "미작성"}</span>
        </div>

        <div className="review-submission-grid">
          <div className="review-image-frame">
            {submission.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="학생 스케치 제출 이미지" src={submission.imageDataUrl} />
            ) : (
              <div>
                <ImageIcon aria-hidden="true" size={30} />
                <p>제출된 이미지가 없습니다.</p>
              </div>
            )}
          </div>

          <div className="review-student-notes">
            <article>
              <h3>학생 설명</h3>
              <p>{submission.studentExplanation || "학생 설명이 없습니다."}</p>
            </article>
            <article>
              <h3>학생이 고른 핵심 연결</h3>
              <p>{submission.importantConnection || "입력된 연결이 없습니다."}</p>
            </article>
            <article>
              <h3>어려웠던 부분</h3>
              <p>{submission.difficultPart || "입력된 내용이 없습니다."}</p>
            </article>
          </div>
        </div>
      </section>

      <form className="panel review-input-panel" key={review?.id || submission.id} onSubmit={saveDraft}>
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Tutor Input</p>
            <h2>관찰과 피드백 방향</h2>
          </div>
          <div className="row-actions">
            <button className="secondary-button" disabled={busyAction === "save"} type="submit">
              <Save aria-hidden="true" size={17} />
              리뷰 저장
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
              {busyAction === "ai" ? "AI 작성 중" : "AI 피드백 초안"}
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="tutorObservation">튜터 관찰</label>
          <textarea
            id="tutorObservation"
            name="tutorObservation"
            defaultValue={review?.tutorObservation || ""}
            placeholder="학생의 스케치와 설명에서 관찰한 내용을 기록합니다."
          />
        </div>

        <div className="grid-two">
          <div className="field">
            <label htmlFor="keyConnections">핵심 연결</label>
            <textarea
              id="keyConnections"
              name="keyConnections"
              defaultValue={joinLines(review?.keyConnections) || submission.importantConnection}
            />
          </div>
          <div className="field">
            <label htmlFor="strengths">강점</label>
            <textarea id="strengths" name="strengths" defaultValue={joinLines(review?.strengths)} />
          </div>
          <div className="field">
            <label htmlFor="misconceptions">오해/보완점</label>
            <textarea
              id="misconceptions"
              name="misconceptions"
              defaultValue={joinLines(review?.misconceptions)}
            />
          </div>
          <div className="field">
            <label htmlFor="nextStep">다음 과제</label>
            <textarea id="nextStep" name="nextStep" defaultValue={review?.nextStep || ""} />
          </div>
        </div>

        {message ? <p className="save-message">{message}</p> : null}
      </form>

      <section className="panel review-feedback-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Final Feedback</p>
            <h2>튜터 수정 피드백</h2>
          </div>
          <div className="row-actions">
            <button
              className="secondary-button"
              disabled={busyAction === "feedback-save" || !review}
              onClick={() => void saveEditedFeedback(review?.status === "published" ? "published" : "approved")}
              type="button"
            >
              <Save aria-hidden="true" size={17} />
              최종 저장
            </button>
            <button
              disabled={busyAction === "publish" || !canViewFeedback}
              onClick={() => void saveEditedFeedback("published")}
              type="button"
            >
              <ClipboardCheck aria-hidden="true" size={17} />
              {busyAction === "publish" ? "공개 중" : "피드백 보기"}
            </button>
          </div>
        </div>

        {review?.feedbackDraft ? (
          <>
            <div className="feedback-editor-grid">
              <div className="field">
                <label htmlFor="studentFacingFeedback">학생에게 공개할 피드백</label>
                <textarea
                  id="studentFacingFeedback"
                  value={feedbackDraft.studentFacing}
                  onChange={(event) =>
                    setFeedbackDraft((current) => ({ ...current, studentFacing: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="tutorNotesFeedback">튜터 메모</label>
                <textarea
                  id="tutorNotesFeedback"
                  value={feedbackDraft.tutorNotes}
                  onChange={(event) =>
                    setFeedbackDraft((current) => ({ ...current, tutorNotes: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="parentSummaryFeedback">보호자 요약</label>
                <textarea
                  id="parentSummaryFeedback"
                  value={feedbackDraft.parentSummary}
                  onChange={(event) =>
                    setFeedbackDraft((current) => ({ ...current, parentSummary: event.target.value }))
                  }
                />
              </div>
            </div>

            {rubricScores.length ? (
              <div className="review-rubric-grid">
                {rubricScores.map((score) => (
                  <article key={score.axis}>
                    <strong>{rubricAxisLabels[String(score.axis)] || score.axis}</strong>
                    <span>{score.score}/5</span>
                    <p>{score.rationale}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty-inline">
            <Eye aria-hidden="true" size={24} />
            <strong>아직 피드백 초안이 없습니다.</strong>
            <p>튜터 관찰을 입력한 뒤 AI 피드백 초안을 생성하세요. 이후 튜터가 수정해 최종 저장합니다.</p>
          </div>
        )}

        <div className="note-box review-publish-note">
          <CheckCircle2 aria-hidden="true" size={18} />
          <p>AI 초안은 최종 평가가 아닙니다. 학생에게 공개되는 내용은 튜터가 수정 저장한 최종 피드백입니다.</p>
        </div>
      </section>
    </div>
  );
}
