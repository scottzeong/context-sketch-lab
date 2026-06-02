"use client";

import { ArrowRight, ClipboardCheck, LibraryBig, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getLearningGroups, LearningGroupRecord } from "@/lib/groupRepository";
import { getStoredTexts, StoredTextRecord } from "@/lib/textRepository";
import { saveStoredSession, WorksheetTemplateType } from "@/lib/sessionRepository";

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
  const [groups, setGroups] = useState<LearningGroupRecord[]>([]);
  const [selectedTextId, setSelectedTextId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [textQuery, setTextQuery] = useState("");
  const [worksheetTemplate, setWorksheetTemplate] = useState<WorksheetTemplateType>("basic");
  const [message, setMessage] = useState<string | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [storedTexts, storedGroups] = await Promise.all([
          getStoredTexts(),
          getLearningGroups()
        ]);
        setTexts(storedTexts);
        setGroups(storedGroups);
        setSelectedTextId(storedTexts[0]?.id || "");
        setSelectedGroupId(storedGroups[0]?.id || "");
        setWorksheetTemplate(recommendTemplate(storedTexts[0]?.structureType));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
      }
    }

    void loadData();
  }, []);

  const filteredTexts = useMemo(() => {
    const normalized = textQuery.trim().toLowerCase();
    if (!normalized) {
      return texts;
    }

    return texts.filter((text) =>
      [text.title, text.body, text.learningGoal, text.structureType, text.difficultyLevel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [textQuery, texts]);

  const selectedText = useMemo(
    () => texts.find((item) => item.id === selectedTextId) || filteredTexts[0] || null,
    [filteredTexts, selectedTextId, texts]
  );
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (!texts.some((text) => text.id === selectedTextId) && filteredTexts[0]) {
      setSelectedTextId(filteredTexts[0].id);
    }
  }, [filteredTexts, selectedTextId, texts]);

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

    setIsSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const session = await saveStoredSession({
        title: String(formData.get("title") || selectedText.title),
        textId: selectedText.id,
        textTitle: selectedText.title,
        groupId: selectedGroup?.id,
        learningGoal: String(formData.get("learningGoal") || selectedText.learningGoal || ""),
        worksheetTemplate,
        groupName: selectedGroup?.name || "전체 학생",
        status: String(formData.get("status") || "draft") as "draft" | "published",
        scheduledFor: String(formData.get("scheduledFor") || "")
      });

      setSavedSessionId(session.id);
      setMessage("세션을 저장했습니다. 세션 목록에서 상태와 Class를 관리할 수 있습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "세션 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
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
          <button disabled={isSaving} type="submit">
            <ClipboardCheck aria-hidden="true" size={18} />
            {isSaving ? "저장 중" : "세션 저장"}
          </button>
        </div>

        <label className="search-box" htmlFor="session-text-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="session-text-search"
            onChange={(event) => setTextQuery(event.target.value)}
            placeholder="사용할 글 제목, 목표, 구조 검색"
            value={textQuery}
          />
        </label>

        <div className="field">
          <label htmlFor="textId">사용할 글</label>
          <select
            id="textId"
            name="textId"
            onChange={(event) => onTextChange(event.target.value)}
            value={selectedTextId}
          >
            {filteredTexts.map((text) => (
              <option key={text.id} value={text.id}>
                {text.title} | {text.structureType || "구조 미지정"}
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
            <label htmlFor="groupId">배포 Class</label>
            <select
              id="groupId"
              name="groupId"
              onChange={(event) => setSelectedGroupId(event.target.value)}
              value={selectedGroupId}
            >
              <option value="">전체 학생</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.studentCount}명)
                </option>
              ))}
            </select>
          </div>
        </div>

        {!groups.length ? (
          <div className="empty-inline">
            <strong>아직 Class가 없습니다.</strong>
            <p>Class를 만들면 세션을 특정 수업반에 배포할 수 있습니다.</p>
            <Link className="quiet-link" href="/tutor/groups">
              Class 만들기
            </Link>
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="learningGoal">학습 목표</label>
          <textarea
            id="learningGoal"
            name="learningGoal"
            defaultValue={selectedText?.learningGoal || "글의 핵심 관계를 맥락 스케치로 구조화하기"}
          />
        </div>

        <div className="grid-two">
          <div className="field">
            <label htmlFor="worksheetTemplate">활동지 템플릿</label>
            <select
              id="worksheetTemplate"
              name="worksheetTemplate"
              onChange={(event) => setWorksheetTemplate(event.target.value as WorksheetTemplateType)}
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
              <option value="draft">초안</option>
              <option value="published">공개</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="scheduledFor">수업 예정일</label>
            <input id="scheduledFor" name="scheduledFor" type="date" />
          </div>
        </div>

        {message ? (
          <p className="save-message">
            {message} {savedSessionId ? <Link href="/tutor/sessions">목록 보기</Link> : null}
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
          <span>{selectedText?.ageRange || "연령 미지정"}</span>
          <span>{selectedText?.difficultyLevel || "난이도 미지정"}</span>
          <span>{selectedText?.structureType || "구조 미지정"}</span>
          <span>{selectedGroup?.name || "전체 학생"}</span>
        </div>
        <article className="text-body-preview">{selectedText?.body}</article>
      </aside>
    </div>
  );
}
