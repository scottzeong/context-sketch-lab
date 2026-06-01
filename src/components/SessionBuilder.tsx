"use client";

import { ArrowRight, ClipboardCheck, LibraryBig } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getStoredTexts, StoredTextRecord } from "@/lib/textRepository";
import {
  saveStoredSession,
  WorksheetTemplateType
} from "@/lib/sessionRepository";

const templateLabels: Record<WorksheetTemplateType, string> = {
  basic: "기본형",
  cause_effect: "원인-결과형",
  compare_contrast: "비교-대조형",
  problem_solution: "문제-해결형",
  claim_evidence: "주장-근거형"
};

function recommendTemplate(structureType?: string): WorksheetTemplateType {
  if (structureType === "cause_effect") return "cause_effect";
  if (structureType === "compare_contrast") return "compare_contrast";
  if (structureType === "problem_solution") return "problem_solution";
  if (structureType === "claim_evidence") return "claim_evidence";
  return "basic";
}

export function SessionBuilder() {
  const [texts, setTexts] = useState<StoredTextRecord[]>([]);
  const [selectedTextId, setSelectedTextId] = useState("");
  const [worksheetTemplate, setWorksheetTemplate] =
    useState<WorksheetTemplateType>("basic");
  const [message, setMessage] = useState<string | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTexts() {
      try {
        const storedTexts = await getStoredTexts();
        setTexts(storedTexts);
        setSelectedTextId(storedTexts[0]?.id || "");
        setWorksheetTemplate(recommendTemplate(storedTexts[0]?.structureType));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Text load failed.");
      }
    }

    void loadTexts();
  }, []);

  const selectedText = useMemo(
    () => texts.find((item) => item.id === selectedTextId) || null,
    [selectedTextId, texts]
  );

  function onTextChange(textId: string) {
    const nextText = texts.find((item) => item.id === textId);
    setSelectedTextId(textId);
    setWorksheetTemplate(recommendTemplate(nextText?.structureType));
    setMessage(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedText) {
      setMessage("먼저 Text 저장소에 글을 저장해 주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const session = await saveStoredSession({
      title: String(formData.get("title") || selectedText.title),
      textId: selectedText.id,
      textTitle: selectedText.title,
      learningGoal: String(formData.get("learningGoal") || selectedText.learningGoal || ""),
      worksheetTemplate,
      groupName: String(formData.get("groupName") || "AGE_9_10 독해 A"),
      status: String(formData.get("status") || "draft") as "draft" | "published",
      scheduledFor: String(formData.get("scheduledFor") || "")
    });

    setSavedSessionId(session.id);
    setMessage("세션을 저장했습니다. Sessions 화면에서 상태를 관리할 수 있습니다.");
  }

  if (!texts.length) {
    return (
      <section className="panel empty-state">
        <LibraryBig aria-hidden="true" size={28} />
        <strong>아직 저장된 글이 없습니다.</strong>
        <p>먼저 AI Workbench에서 글을 생성하고 Text 저장소에 저장해 주세요.</p>
        <Link className="primary-link" href="/tutor/workbench">
          AI Workbench로 이동
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>
    );
  }

  return (
    <div className="session-builder-grid">
      <form className="panel" onSubmit={onSubmit}>
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Builder</p>
            <h2>세션 정보</h2>
          </div>
          <button type="submit">
            <ClipboardCheck aria-hidden="true" size={18} />
            세션 저장
          </button>
        </div>

        <div className="field">
          <label htmlFor="textId">사용할 글</label>
          <select
            id="textId"
            name="textId"
            onChange={(event) => onTextChange(event.target.value)}
            value={selectedTextId}
          >
            {texts.map((text) => (
              <option key={text.id} value={text.id}>
                {text.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid-two">
          <div className="field">
            <label htmlFor="title">세션 제목</label>
            <input
              id="title"
              name="title"
              defaultValue={selectedText ? `${selectedText.title} 읽기` : ""}
            />
          </div>
          <div className="field">
            <label htmlFor="groupName">배포 그룹</label>
            <select id="groupName" name="groupName" defaultValue="AGE_9_10 독해 A">
              <option value="AGE_9_10 독해 A">AGE_9_10 독해 A</option>
              <option value="AGE_11_12 구조화 B">AGE_11_12 구조화 B</option>
              <option value="AGE_13_15 리프레이밍">AGE_13_15 리프레이밍</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="learningGoal">학습 목표</label>
          <textarea
            id="learningGoal"
            name="learningGoal"
            defaultValue={selectedText?.learningGoal || "글의 핵심 관계를 스케치로 구조화하기"}
          />
        </div>

        <div className="grid-two">
          <div className="field">
            <label htmlFor="worksheetTemplate">활동지 템플릿</label>
            <select
              id="worksheetTemplate"
              name="worksheetTemplate"
              onChange={(event) =>
                setWorksheetTemplate(event.target.value as WorksheetTemplateType)
              }
              value={worksheetTemplate}
            >
              {Object.entries(templateLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">상태</label>
            <select id="status" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="scheduledFor">수업 예정일</label>
            <input id="scheduledFor" name="scheduledFor" type="date" />
          </div>
        </div>

        {message ? (
          <p className="save-message">
            {message}{" "}
            {savedSessionId ? <Link href="/tutor/sessions">목록 보기</Link> : null}
          </p>
        ) : null}
      </form>

      <aside className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Selected Text</p>
            <h2>{selectedText?.title || "선택된 글"}</h2>
          </div>
        </div>
        <div className="metadata-grid compact">
          <span>{selectedText?.ageRange}</span>
          <span>{selectedText?.difficultyLevel}</span>
          <span>{selectedText?.structureType}</span>
          <span>{selectedText?.status}</span>
        </div>
        <article className="text-body-preview">{selectedText?.body}</article>
      </aside>
    </div>
  );
}
