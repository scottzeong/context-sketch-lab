"use client";

import { BookOpenText, CheckCircle2, ListChecks, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ConfigOptionCategory,
  ConfigOptionRecord,
  defaultConfigOptions,
  getConfigOptions
} from "@/lib/configOptions";
import { saveStoredText } from "@/lib/textRepository";

type GeneratedTextView = {
  title?: string;
  body?: string;
  estimatedReadingLevel?: string;
  difficultyLevel?: string;
  structureType?: string;
  tutorRevisionNotes?: string[];
  safetyNotes?: string[];
};

type TextAnalysisView = {
  summary?: string;
  mainIdea?: string;
  structureType?: string;
  paragraphs?: Array<{
    index?: number;
    role?: string;
    summary?: string;
    keyDetails?: string[];
  }>;
  keyRelations?: Array<{
    from?: string;
    to?: string;
    relationType?: string;
    explanation?: string;
  }>;
  discussionQuestions?: string[];
  worksheetSuggestions?: string[];
};

type TextMode = "ai" | "manual";
type TextSourceType = "ai_generated" | "tutor_written";

const defaults = {
  topic: "친구의 웃음소리를 오해해 발표를 멈춘 상황",
  learningGoal: "감정 추론과 원인-결과 구조를 구분해 설명하기",
  mustInclude: "오해\n긴장\n발표\n다시 확인하기",
  avoid: "설교처럼 들리는 결론",
  tone: "따뜻하고 현실적인 이야기"
};

function splitLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function groupOptions(options: ConfigOptionRecord[]) {
  const grouped = { ...defaultConfigOptions };

  (Object.keys(grouped) as ConfigOptionCategory[]).forEach((category) => {
    const categoryOptions = options.filter((option) => option.category === category);

    if (categoryOptions.length) {
      grouped[category] = categoryOptions;
    }
  });

  return grouped;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getStatusMessage(action: string | null) {
  if (action === "generate") return "글을 생성하는 중입니다...";
  if (action === "analyze") return "글의 구조를 분석하는 중입니다...";
  if (action === "save") return "Text 저장소에 저장하는 중입니다...";
  return null;
}

export function TutorAIWorkbench() {
  const [generatedText, setGeneratedText] = useState<GeneratedTextView | null>(null);
  const [analysis, setAnalysis] = useState<TextAnalysisView | null>(null);
  const [configOptions, setConfigOptions] = useState<ConfigOptionRecord[]>([]);
  const [textMode, setTextMode] = useState<TextMode>("ai");
  const [textSourceType, setTextSourceType] = useState<TextSourceType>("ai_generated");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [savedTextId, setSavedTextId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const statusMessage = getStatusMessage(busyAction);
  const dropdownOptions = useMemo(() => groupOptions(configOptions), [configOptions]);

  useEffect(() => {
    async function loadOptions() {
      setConfigOptions(await getConfigOptions());
    }

    void loadOptions();
  }, []);

  async function postJson(endpoint: string, payload: unknown) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || "요청에 실패했습니다.");
    }

    return json;
  }

  async function generateText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("generate");
    setSaveMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const json = await postJson("/api/ai/generate-text-test", {
        topic: formData.get("topic"),
        ageRange: formData.get("ageRange"),
        difficultyLevel: formData.get("difficultyLevel"),
        targetLength: formData.get("targetLength"),
        textType: formData.get("textType"),
        textStructure: formData.get("textStructure"),
        learningGoal: formData.get("learningGoal"),
        mustInclude: splitLines(formData.get("mustInclude")),
        avoid: splitLines(formData.get("avoid")),
        tone: formData.get("tone")
      });

      setGeneratedText(json.generatedText);
      setTextSourceType("ai_generated");
      setAnalysis(null);
      setSavedTextId(null);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "글 생성에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  async function inputText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("manualTitle") || "").trim();
    const body = String(formData.get("manualBody") || "").trim();

    if (!body) {
      setSaveMessage("붙여 넣을 글 본문을 입력해 주세요.");
      return;
    }

    setGeneratedText({
      title: title || "튜터 입력 글",
      body,
      estimatedReadingLevel: String(formData.get("ageRange") || ""),
      difficultyLevel: String(formData.get("difficultyLevel") || ""),
      structureType: String(formData.get("textStructure") || ""),
      tutorRevisionNotes: ["튜터가 직접 입력한 글입니다. 저장 후 구조 분석을 실행하세요."],
      safetyNotes: ["수업 전 표현과 사실 관계를 최종 확인하세요."]
    });
    setTextSourceType("tutor_written");
    setAnalysis(null);
    setSavedTextId(null);
  }

  async function saveCurrentText() {
    if (!generatedText) {
      setSaveMessage("먼저 글을 작성해 주세요.");
      return;
    }

    setBusyAction("save");
    setSaveMessage(null);

    try {
      const record = await saveStoredText({
        id: savedTextId || undefined,
        title: asString(generatedText.title, "Untitled text"),
        body: asString(generatedText.body),
        ageRange: asString(generatedText.estimatedReadingLevel, "AGE_9_10"),
        difficultyLevel: asString(generatedText.difficultyLevel, "L3"),
        textType: "story",
        structureType: asString(generatedText.structureType, "narrative"),
        status: "draft",
        sourceType: textSourceType,
        learningGoal: defaults.learningGoal,
        analysisJson: analysis || undefined
      });

      setSavedTextId(record.id);
      setSaveMessage(
        analysis
          ? "글과 구조 분석을 Text 저장소에 저장했습니다."
          : "글을 Text 저장소에 저장했습니다. 이제 구조 분석을 실행할 수 있습니다."
      );
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  async function analyzeText() {
    if (!generatedText || !savedTextId || analysis) {
      return;
    }

    setBusyAction("analyze");
    setSaveMessage(null);

    try {
      const json = await postJson("/api/ai/analyze-text-structure-test", {
        title: generatedText.title,
        body: generatedText.body,
        learningGoal: defaults.learningGoal,
        targetAgeRange: generatedText.estimatedReadingLevel
      });

      setAnalysis(json.analysis);
      setSaveMessage("구조 분석이 완료되었습니다. 분석 결과를 보관하려면 다시 저장하세요.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "구조 분석에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <div className="status-strip" aria-label="Workbench status">
        <span className={generatedText ? "status done" : "status"}>글 작성</span>
        <span className={savedTextId ? "status done" : "status"}>저장</span>
        <span className={analysis ? "status done" : "status"}>구조 분석</span>
        <span className="status review">세션 연결 전 튜터 확인</span>
      </div>

      {statusMessage ? <p className="workbench-status">{statusMessage}</p> : null}

      <div className="workbench workbench-wide">
        <section className="stack">
          <form className="panel" onSubmit={textMode === "ai" ? generateText : inputText}>
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Step 1</p>
                <h2>글 작성</h2>
              </div>
              <div className="segmented-actions">
                <button
                  className={textMode === "ai" ? "" : "secondary-button"}
                  disabled={busyAction === "generate"}
                  onClick={() => setTextMode("ai")}
                  type={textMode === "ai" ? "submit" : "button"}
                >
                  <Sparkles aria-hidden="true" size={18} />
                  {busyAction === "generate" ? "생성 중" : "글 생성"}
                </button>
                <button
                  className={textMode === "manual" ? "" : "secondary-button"}
                  onClick={() => setTextMode("manual")}
                  type={textMode === "manual" ? "submit" : "button"}
                >
                  <BookOpenText aria-hidden="true" size={18} />
                  글 입력
                </button>
              </div>
            </div>

            <div className="grid-two">
              <div className="field">
                <label htmlFor="topic">주제</label>
                <input id="topic" name="topic" defaultValue={defaults.topic} />
              </div>
              <div className="field">
                <label htmlFor="learningGoal">학습 목표</label>
                <input id="learningGoal" name="learningGoal" defaultValue={defaults.learningGoal} />
              </div>
              <div className="field">
                <label htmlFor="ageRange">연령</label>
                <select id="ageRange" name="ageRange" defaultValue="AGE_9_10">
                  {dropdownOptions.age_range.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="difficultyLevel">난이도</label>
                <select id="difficultyLevel" name="difficultyLevel" defaultValue="L3">
                  {dropdownOptions.difficulty_level.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="targetLength">분량</label>
                <select id="targetLength" name="targetLength" defaultValue="600자">
                  {dropdownOptions.target_length.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="textStructure">글 구조</label>
                <select id="textStructure" name="textStructure" defaultValue="cause_effect">
                  {dropdownOptions.text_structure.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input name="textType" type="hidden" value="story" />

            {textMode === "ai" ? (
              <>
                <div className="grid-two">
                  <div className="field">
                    <label htmlFor="mustInclude">포함할 요소</label>
                    <textarea id="mustInclude" name="mustInclude" defaultValue={defaults.mustInclude} />
                  </div>
                  <div className="field">
                    <label htmlFor="avoid">피할 요소</label>
                    <textarea id="avoid" name="avoid" defaultValue={defaults.avoid} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="tone">톤</label>
                  <input id="tone" name="tone" defaultValue={defaults.tone} />
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="manualTitle">글 제목</label>
                  <input id="manualTitle" name="manualTitle" placeholder="붙여 넣을 글의 제목" />
                </div>
                <div className="field">
                  <label htmlFor="manualBody">글 본문</label>
                  <textarea
                    className="manual-textarea"
                    id="manualBody"
                    name="manualBody"
                    placeholder="튜터가 직접 작성했거나 외부에서 준비한 글을 여기에 붙여 넣으세요."
                  />
                </div>
              </>
            )}
          </form>
        </section>

        <section className="stack">
          <section className="panel generated-result-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Generated Text</p>
                <h2>{generatedText?.title || "작성된 글"}</h2>
              </div>
              <div className="row-actions">
                <button
                  className="secondary-button"
                  disabled={!generatedText || busyAction === "save"}
                  onClick={saveCurrentText}
                  type="button"
                >
                  <Save aria-hidden="true" size={17} />
                  저장
                </button>
                <button
                  disabled={!savedTextId || Boolean(analysis) || busyAction === "analyze"}
                  onClick={analyzeText}
                  type="button"
                >
                  <ListChecks aria-hidden="true" size={18} />
                  {busyAction === "analyze" ? "분석 중" : "구조 분석"}
                </button>
              </div>
            </div>

            {generatedText ? (
              <>
                <div className="metadata-grid compact workbench-meta">
                  <span>{generatedText.estimatedReadingLevel}</span>
                  <span>{generatedText.difficultyLevel}</span>
                  <span>{generatedText.structureType}</span>
                  <span>{textSourceType === "ai_generated" ? "AI draft" : "Tutor input"}</span>
                </div>
                <article className="generated-text-body">{generatedText.body}</article>
                <div className="insight-grid">
                  <article>
                    <h3>튜터 수정 메모</h3>
                    <ul>
                      {(generatedText.tutorRevisionNotes || []).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </article>
                  <article>
                    <h3>안전/표현 점검</h3>
                    <ul>
                      {(generatedText.safetyNotes || []).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </>
            ) : (
              <div className="empty-inline">
                <BookOpenText aria-hidden="true" size={24} />
                <strong>아직 작성된 글이 없습니다.</strong>
                <p>왼쪽에서 AI로 생성하거나 튜터가 직접 글을 입력하세요.</p>
              </div>
            )}

            {saveMessage ? (
              <p className="save-message">
                {saveMessage} <Link href="/tutor/texts">저장소 보기</Link>
              </p>
            ) : null}
          </section>

          <section className="panel readable-analysis-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Structure Analysis</p>
                <h2>구조 분석 결과</h2>
              </div>
              <span className={analysis ? "status done" : "status"}>analysis</span>
            </div>

            {analysis ? (
              <>
                <div className="analysis-summary-grid">
                  <article>
                    <h3>핵심 구조</h3>
                    <strong>{analysis.structureType}</strong>
                    <p>{analysis.mainIdea}</p>
                  </article>
                  <article>
                    <h3>요약</h3>
                    <p>{analysis.summary}</p>
                  </article>
                </div>

                <div className="analysis-section">
                  <h3>전개 흐름</h3>
                  <ol className="paragraph-flow-list">
                    {(analysis.paragraphs || []).map((paragraph) => (
                      <li key={`${paragraph.index}-${paragraph.role}`}>
                        <strong>
                          {paragraph.index}. {paragraph.role}
                        </strong>
                        <p>{paragraph.summary}</p>
                        {paragraph.keyDetails?.length ? <small>{paragraph.keyDetails.join(" / ")}</small> : null}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="analysis-section">
                  <h3>핵심 관계</h3>
                  <div className="relation-list">
                    {(analysis.keyRelations || []).map((relation) => (
                      <article key={`${relation.from}-${relation.to}`}>
                        <strong>
                          {relation.from} - {relation.to}
                        </strong>
                        <span>{relation.relationType}</span>
                        <p>{relation.explanation}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="analysis-section">
                  <h3>질문 후보</h3>
                  <ul className="question-list">
                    {(analysis.discussionQuestions || []).map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </div>

                <div className="analysis-section">
                  <h3>활동지 제안</h3>
                  <ul className="question-list">
                    {(analysis.worksheetSuggestions || []).map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="empty-inline">
                <CheckCircle2 aria-hidden="true" size={24} />
                <strong>저장 후 구조 분석을 실행할 수 있습니다.</strong>
                <p>글을 먼저 Text 저장소에 저장하면 구조 분석 버튼이 활성화됩니다.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </>
  );
}
