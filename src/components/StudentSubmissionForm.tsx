"use client";

import { CheckCircle2, ImageUp } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getStoredSessions, StoredSessionRecord } from "@/lib/sessionRepository";
import { saveStoredSubmission } from "@/lib/submissionRepository";

type StudentSubmissionFormProps = {
  sessionId: string;
};

export function StudentSubmissionForm({ sessionId }: StudentSubmissionFormProps) {
  const [session, setSession] = useState<StoredSessionRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        setSession((await getStoredSessions()).find((item) => item.id === sessionId) || null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "세션을 불러오지 못했습니다.");
      }
    }

    void loadSession();
  }, [sessionId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setMessage("세션을 찾을 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const image = formData.get("image");
      const imageFile = image instanceof File && image.size > 0 ? image : null;

      await saveStoredSubmission({
        sessionId: session.id,
        sessionTitle: session.title,
        studentName: String(formData.get("studentName") || "Student"),
        studentExplanation: String(formData.get("studentExplanation") || ""),
        importantConnection: String(formData.get("importantConnection") || ""),
        difficultPart: String(formData.get("difficultPart") || ""),
        imageName: imageFile?.name,
        imageFile,
        status: "submitted"
      });

      setMessage("제출이 완료되었습니다. 튜터 검토 후 피드백이 공개됩니다.");
      form.reset();
      setPreviewUrl(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!session) {
    return (
      <section className="panel empty-state">
        <strong>세션을 찾을 수 없습니다.</strong>
        <p>학생 대시보드에서 다시 세션을 선택해 주세요.</p>
        <Link className="primary-link" href="/student/dashboard">
          학생 대시보드
        </Link>
      </section>
    );
  }

  return (
    <form className="submission-grid" onSubmit={onSubmit}>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Upload</p>
            <h2>스케치 제출</h2>
          </div>
          <button disabled={isSubmitting} type="submit">
            <CheckCircle2 aria-hidden="true" size={18} />
            {isSubmitting ? "제출 중" : "제출 완료"}
          </button>
        </div>

        <div className="field">
          <label htmlFor="studentName">이름</label>
          <input id="studentName" name="studentName" placeholder="이름을 입력하세요" />
        </div>

        <div className="field">
          <label htmlFor="image">스케치 사진</label>
          <input
            accept="image/png,image/jpeg,image/webp"
            id="image"
            name="image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
            type="file"
          />
        </div>

        <div className="field">
          <label htmlFor="studentExplanation">내 스케치 설명</label>
          <textarea
            id="studentExplanation"
            name="studentExplanation"
            placeholder="무엇을 가장 중요하게 그렸는지 짧게 적어 보세요."
          />
        </div>

        <div className="field">
          <label htmlFor="importantConnection">가장 중요한 연결</label>
          <input
            id="importantConnection"
            name="importantConnection"
            placeholder="예: 단서 -> 오해 -> 긴장"
          />
        </div>

        <div className="field">
          <label htmlFor="difficultPart">어려웠던 부분</label>
          <textarea
            id="difficultPart"
            name="difficultPart"
            placeholder="헷갈렸던 부분이나 다시 보고 싶은 부분을 적어 주세요."
          />
        </div>

        {message ? <p className="save-message">{message}</p> : null}
      </section>

      <aside className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Preview</p>
            <h2>{session.title}</h2>
          </div>
        </div>

        <div className="submission-preview">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="스케치 미리보기" src={previewUrl} />
          ) : (
            <div>
              <ImageUp aria-hidden="true" size={28} />
              <p>업로드한 스케치 사진이 여기에 표시됩니다.</p>
            </div>
          )}
        </div>

        <div className="note-box">
          <CheckCircle2 aria-hidden="true" size={18} />
          <p>AI가 이미지를 해석하지 않습니다. 튜터가 사진과 설명을 보고 피드백합니다.</p>
        </div>
      </aside>
    </form>
  );
}
