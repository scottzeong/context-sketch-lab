"use client";

import {
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Save,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
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
  inferencePoints?: string[];
  vocabulary?: Array<{
    term?: string;
    meaning?: string;
    whyItMatters?: string;
  }>;
  discussionQuestions?: string[];
  worksheetSuggestions?: string[];
};

type FeedbackEvaluationView = {
  rubricScores?: Array<{
    axis?: string;
    score?: number;
    rationale?: string;
  }>;
  feedbackDraft?: {
    studentFacing?: string;
    tutorNotes?: string;
    parentSummary?: string;
  };
  recommendedNextActivities?: string[];
  needsTutorReview?: boolean;
};

type RawOutputs = {
  generated?: unknown;
  analysis?: unknown;
  evaluation?: unknown;
  error?: unknown;
};

const defaults = {
  topic: "친구의 웃음소리를 오해해 발표를 멈춘 상황",
  learningGoal: "감정 추론과 원인-결과 구조를 구분해 설명하기",
  mustInclude: "오해\n긴장\n발표\n다시 확인하기",
  avoid: "훈계처럼 들리는 결론",
  tone: "따뜻하고 현실적인 이야기",
  studentExplanation:
    "민수가 친구들이 자신을 비웃는다고 생각해서 발표를 멈춘 것 같다고 설명함.",
  tutorObservation:
    "학생은 감정 변화는 잘 잡았지만, 친구들의 실제 의도와 민수의 추측을 구분하는 데 도움이 필요함.",
  keyConnections: "웃음소리\n오해\n긴장\n발표 중단",
  strengths: "감정의 흐름을 그림과 설명으로 연결함",
  misconceptions: "사실과 추측을 아직 명확히 구분하지 못함",
  nextStep: "사실, 추측, 감정을 서로 다른 기호로 구분해 다시 표현하기"
};

const rubricAxisLabels: Record<string, string> = {
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

function pretty(json: unknown) {
  return JSON.stringify(json, null, 2);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getStatusMessage(action: string | null) {
  if (action === "generate") return "글을 생성하는 중입니다...";
  if (action === "analyze") return "글의 구조를 분석하는 중입니다...";
  if (action === "evaluate") return "튜터 입력을 피드백 초안으로 정리하는 중입니다...";
  if (action === "save") return "Text 저장소에 저장하는 중입니다...";
  return null;
}

export function TutorAIWorkbench() {
  const [generatedText, setGeneratedText] = useState<GeneratedTextView | null>(
    null
  );
  const [analysis, setAnalysis] = useState<TextAnalysisView | null>(null);
  const [evaluation, setEvaluation] = useState<FeedbackEvaluationView | null>(
    null
  );
  const [rawOutputs, setRawOutputs] = useState<RawOutputs>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [savedTextId, setSavedTextId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const statusMessage = getStatusMessage(busyAction);
  const rawJson = useMemo(() => pretty(rawOutputs), [rawOutputs]);

  async function postJson(endpoint: string, payload: unknown) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || "Request failed.");
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
      setAnalysis(null);
      setSavedTextId(null);
      setRawOutputs((current) => ({
        ...current,
        generated: json,
        analysis: undefined,
        error: undefined
      }));
    } catch (error) {
      setRawOutputs((current) => ({
        ...current,
        error: { action: "generate", message: String(error) }
      }));
    } finally {
      setBusyAction(null);
    }
  }

  async function analyzeText() {
    if (!generatedText) {
      setSaveMessage("먼저 글을 생성해 주세요.");
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
      setRawOutputs((current) => ({
        ...current,
        analysis: json,
        error: undefined
      }));
    } catch (error) {
      setRawOutputs((current) => ({
        ...current,
        error: { action: "analyze", message: String(error) }
      }));
    } finally {
      setBusyAction(null);
    }
  }

  async function evaluateFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("evaluate");
    setSaveMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const json = await postJson("/api/ai/evaluate-tutor-feedback-test", {
        studentExplanation: formData.get("studentExplanation"),
        tutorObservation: formData.get("tutorObservation"),
        keyConnections: splitLines(formData.get("keyConnections")),
        strengths: splitLines(formData.get("strengths")),
        misconceptions: splitLines(formData.get("misconceptions")),
        nextStep: formData.get("nextStep")
      });

      setEvaluation(json.evaluation);
      setRawOutputs((current) => ({
        ...current,
        evaluation: json,
        error: undefined
      }));
    } catch (error) {
      setRawOutputs((current) => ({
        ...current,
        error: { action: "evaluate", message: String(error) }
      }));
    } finally {
      setBusyAction(null);
    }
  }

  async function saveCurrentText() {
    if (!generatedText) {
      setSaveMessage("먼저 글을 생성해 주세요.");
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
        difficultyLevel: asString(generatedText.difficultyLevel, "L4"),
        textType: "story",
        structureType: asString(generatedText.structureType, "narrative"),
        status: "draft",
        sourceType: "ai_generated",
        learningGoal: defaults.learningGoal,
        analysisJson: analysis || undefined
      });

      setSavedTextId(record.id);
      setSaveMessage(
        analysis
          ? "글과 구조 분석을 Text 저장소에 저장했습니다."
          : "글 초안을 Text 저장소에 저장했습니다."
      );
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <div className="status-strip" aria-label="Workbench status">
        <span className={generatedText ? "status done" : "status"}>글 생성</span>
        <span className={analysis ? "status done" : "status"}>구조 분석</span>
        <span className={evaluation ? "status done" : "status"}>피드백 초안</span>
        <span className="status review">튜터 검토 필요</span>
      </div>

      {statusMessage ? <p className="workbench-status">{statusMessage}</p> : null}

      <div className="workbench workbench-wide">
        <section className="stack">
          <form className="panel" onSubmit={generateText}>
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Step 1</p>
                <h2>AI 글 생성</h2>
              </div>
              <button disabled={busyAction === "generate"} type="submit">
                <Sparkles aria-hidden="true" size={18} />
                {busyAction === "generate" ? "생성 중" : "글 생성"}
              </button>
            </div>

            <div className="grid-two">
              <div className="field">
                <label htmlFor="topic">주제</label>
                <input id="topic" name="topic" defaultValue={defaults.topic} />
              </div>
              <div className="field">
                <label htmlFor="learningGoal">학습 목표</label>
                <input
                  id="learningGoal"
                  name="learningGoal"
                  defaultValue={defaults.learningGoal}
                />
              </div>
              <div className="field">
                <label htmlFor="ageRange">연령</label>
                <select id="ageRange" name="ageRange" defaultValue="AGE_9_10">
                  <option value="AGE_7_8">AGE_7_8</option>
                  <option value="AGE_9_10">AGE_9_10</option>
                  <option value="AGE_11_12">AGE_11_12</option>
                  <option value="AGE_13_15">AGE_13_15</option>
                  <option value="AGE_16_18">AGE_16_18</option>
                  <option value="ADULT">ADULT</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="difficultyLevel">난이도</label>
                <input id="difficultyLevel" name="difficultyLevel" defaultValue="L4" />
              </div>
              <div className="field">
                <label htmlFor="targetLength">분량</label>
                <input id="targetLength" name="targetLength" defaultValue="600자" />
              </div>
              <div className="field">
                <label htmlFor="textStructure">글 구조</label>
                <select
                  id="textStructure"
                  name="textStructure"
                  defaultValue="cause_effect"
                >
                  <option value="narrative">narrative</option>
                  <option value="cause_effect">cause_effect</option>
                  <option value="compare_contrast">compare_contrast</option>
                  <option value="problem_solution">problem_solution</option>
                  <option value="claim_evidence">claim_evidence</option>
                  <option value="sequence">sequence</option>
                  <option value="perspective_shift">perspective_shift</option>
                </select>
              </div>
            </div>

            <input name="textType" type="hidden" value="story" />

            <div className="grid-two">
              <div className="field">
                <label htmlFor="mustInclude">포함할 요소</label>
                <textarea
                  id="mustInclude"
                  name="mustInclude"
                  defaultValue={defaults.mustInclude}
                />
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
          </form>

          <form className="panel compact-feedback-form" onSubmit={evaluateFeedback}>
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Step 3</p>
                <h2>튜터 입력 기반 피드백 초안</h2>
              </div>
              <button disabled={busyAction === "evaluate"} type="submit">
                <ClipboardCheck aria-hidden="true" size={18} />
                {busyAction === "evaluate" ? "작성 중" : "피드백 초안"}
              </button>
            </div>

            <div className="field">
              <label htmlFor="studentExplanation">학생 설명</label>
              <textarea
                id="studentExplanation"
                name="studentExplanation"
                defaultValue={defaults.studentExplanation}
              />
            </div>
            <div className="field">
              <label htmlFor="tutorObservation">튜터 관찰</label>
              <textarea
                id="tutorObservation"
                name="tutorObservation"
                defaultValue={defaults.tutorObservation}
              />
            </div>
            <div className="grid-two">
              <div className="field">
                <label htmlFor="keyConnections">핵심 연결</label>
                <textarea
                  id="keyConnections"
                  name="keyConnections"
                  defaultValue={defaults.keyConnections}
                />
              </div>
              <div className="field">
                <label htmlFor="strengths">강점</label>
                <textarea
                  id="strengths"
                  name="strengths"
                  defaultValue={defaults.strengths}
                />
              </div>
              <div className="field">
                <label htmlFor="misconceptions">오해/보완점</label>
                <textarea
                  id="misconceptions"
                  name="misconceptions"
                  defaultValue={defaults.misconceptions}
                />
              </div>
              <div className="field">
                <label htmlFor="nextStep">다음 과제</label>
                <textarea id="nextStep" name="nextStep" defaultValue={defaults.nextStep} />
              </div>
            </div>
          </form>
        </section>

        <section className="stack">
          <section className="panel generated-result-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Generated Text</p>
                <h2>{generatedText?.title || "생성된 글"}</h2>
              </div>
              <div className="row-actions">
                <button disabled={busyAction === "analyze"} onClick={analyzeText}>
                  <ListChecks aria-hidden="true" size={18} />
                  {busyAction === "analyze" ? "분석 중" : "구조 분석"}
                </button>
                <button
                  className="secondary-button"
                  disabled={!generatedText || busyAction === "save"}
                  onClick={saveCurrentText}
                  type="button"
                >
                  <Save aria-hidden="true" size={17} />
                  저장
                </button>
              </div>
            </div>

            {generatedText ? (
              <>
                <div className="metadata-grid compact workbench-meta">
                  <span>{generatedText.estimatedReadingLevel}</span>
                  <span>{generatedText.difficultyLevel}</span>
                  <span>{generatedText.structureType}</span>
                  <span>AI draft</span>
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
                <strong>아직 생성된 글이 없습니다.</strong>
                <p>왼쪽에서 주제와 구조를 정한 뒤 글 생성을 실행하세요.</p>
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
                        {paragraph.keyDetails?.length ? (
                          <small>{paragraph.keyDetails.join(" / ")}</small>
                        ) : null}
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
                          {relation.from} → {relation.to}
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
                <strong>구조 분석을 실행하면 여기에 정리됩니다.</strong>
                <p>핵심 구조, 문단 흐름, 관계, 질문 후보를 튜터용으로 보여줍니다.</p>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Feedback Draft</p>
                <h2>피드백 초안</h2>
              </div>
              <span className={evaluation ? "status done" : "status"}>draft</span>
            </div>

            {evaluation?.feedbackDraft ? (
              <>
                <div className="feedback-draft-grid">
                  <article>
                    <h3>학생용</h3>
                    <p>{evaluation.feedbackDraft.studentFacing}</p>
                  </article>
                  <article>
                    <h3>튜터 메모</h3>
                    <p>{evaluation.feedbackDraft.tutorNotes}</p>
                  </article>
                  <article>
                    <h3>보호자 요약</h3>
                    <p>{evaluation.feedbackDraft.parentSummary}</p>
                  </article>
                </div>
                <div className="rubric-strip">
                  {(evaluation.rubricScores || []).map((score) => (
                    <article key={score.axis}>
                      <strong>
                        {rubricAxisLabels[String(score.axis)] || score.axis}
                      </strong>
                      <span>{score.score}/5</span>
                      <p>{score.rationale}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-inline">
                <strong>아직 피드백 초안이 없습니다.</strong>
                <p>왼쪽 하단의 튜터 입력을 바탕으로 AI 초안을 생성하세요.</p>
              </div>
            )}
          </section>

          <details className="panel raw-json-details">
            <summary>원본 JSON 보기</summary>
            <pre>{rawJson}</pre>
          </details>
        </section>
      </div>
    </>
  );
}
