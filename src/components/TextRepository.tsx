"use client";

import { BookOpenText, CheckCircle2, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteStoredText,
  getStoredTexts,
  StoredTextRecord
} from "@/lib/textRepository";

const statusLabels: Record<StoredTextRecord["status"], string> = {
  draft: "초안",
  approved: "승인",
  archived: "보관"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function uniqueValues(texts: StoredTextRecord[], key: keyof StoredTextRecord) {
  return Array.from(
    new Set(texts.map((text) => String(text[key] || "")).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export function TextRepository() {
  const [texts, setTexts] = useState<StoredTextRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [structureFilter, setStructureFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    try {
      const nextTexts = await getStoredTexts();
      setTexts(nextTexts);
      setSelectedId((current) => current || nextTexts[0]?.id || null);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "글 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void refresh();
    window.addEventListener("text-repository-change", refresh);

    return () => window.removeEventListener("text-repository-change", refresh);
  }, []);

  const structureOptions = useMemo(
    () => uniqueValues(texts, "structureType"),
    [texts]
  );
  const difficultyOptions = useMemo(
    () => uniqueValues(texts, "difficultyLevel"),
    [texts]
  );

  const filteredTexts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return texts.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesStructure =
        structureFilter === "all" || item.structureType === structureFilter;
      const matchesDifficulty =
        difficultyFilter === "all" || item.difficultyLevel === difficultyFilter;
      const matchesQuery =
        !normalized ||
        [
          item.title,
          item.body,
          item.learningGoal,
          item.structureType,
          item.difficultyLevel,
          item.ageRange,
          item.textType
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));

      return matchesStatus && matchesStructure && matchesDifficulty && matchesQuery;
    });
  }, [difficultyFilter, query, statusFilter, structureFilter, texts]);

  const selectedText =
    texts.find((item) => item.id === selectedId) || filteredTexts[0] || null;

  async function removeText(id: string) {
    try {
      await deleteStoredText(id);
      const nextTexts = await getStoredTexts();
      setTexts(nextTexts);
      setSelectedId(nextTexts[0]?.id || null);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "글 삭제에 실패했습니다.");
    }
  }

  return (
    <div className="repository-grid">
      <section className="panel repository-list">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Repository</p>
            <h2>저장된 글</h2>
          </div>
          <span className="status done">{texts.length}개</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="text-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="text-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 본문, 목표, 구조 검색"
            value={query}
          />
        </label>

        <div className="grid-two compact-filter-grid">
          <div className="field">
            <label htmlFor="text-status-filter">상태</label>
            <select
              id="text-status-filter"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="all">전체</option>
              <option value="draft">초안</option>
              <option value="approved">승인</option>
              <option value="archived">보관</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="text-structure-filter">구조</label>
            <select
              id="text-structure-filter"
              onChange={(event) => setStructureFilter(event.target.value)}
              value={structureFilter}
            >
              <option value="all">전체</option>
              {structureOptions.map((structure) => (
                <option key={structure} value={structure}>
                  {structure}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="text-difficulty-filter">난이도</label>
            <select
              id="text-difficulty-filter"
              onChange={(event) => setDifficultyFilter(event.target.value)}
              value={difficultyFilter}
            >
              <option value="all">전체</option>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-list">
          {filteredTexts.length ? (
            filteredTexts.map((item) => (
              <button
                className={`text-list-item ${selectedText?.id === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.structureType || "구조 미지정"} ·{" "}
                    {item.difficultyLevel || "난이도 미지정"} · {formatDate(item.updatedAt)}
                  </small>
                </span>
                <BookOpenText aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>조건에 맞는 글이 없습니다.</strong>
              <p>검색어, 상태, 구조, 난이도 필터를 조정해 보세요.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel repository-detail">
        {selectedText ? (
          <>
            <div className="panel-heading">
              <div>
                <p className="section-kicker">{selectedText.sourceType}</p>
                <h2>{selectedText.title}</h2>
              </div>
              <div className="row-actions">
                <span className="status review">{statusLabels[selectedText.status]}</span>
                <button
                  className="danger-button"
                  onClick={() => removeText(selectedText.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={17} />
                  삭제
                </button>
              </div>
            </div>

            <div className="metadata-grid">
              <span>연령: {selectedText.ageRange || "미지정"}</span>
              <span>난이도: {selectedText.difficultyLevel || "미지정"}</span>
              <span>구조: {selectedText.structureType || "미지정"}</span>
              <span>수정: {formatDate(selectedText.updatedAt)}</span>
            </div>

            {selectedText.learningGoal ? (
              <div className="note-box">
                <CheckCircle2 aria-hidden="true" size={18} />
                <p>{selectedText.learningGoal}</p>
              </div>
            ) : null}

            <article className="text-body-preview">{selectedText.body}</article>

            <div className="analysis-preview">
              <h3>구조 분석 JSON</h3>
              <pre>
                {selectedText.analysisJson
                  ? JSON.stringify(selectedText.analysisJson, null, 2)
                  : "아직 저장된 구조 분석이 없습니다. Workbench에서 구조 분석 후 다시 저장하면 여기에 표시됩니다."}
              </pre>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>선택된 글이 없습니다.</strong>
            <p>저장된 글이 생기면 이곳에서 본문과 분석을 확인합니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
