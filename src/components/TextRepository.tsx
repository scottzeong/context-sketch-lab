"use client";

import { BookOpenText, CheckCircle2, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteStoredText,
  getStoredTexts,
  StoredTextRecord
} from "@/lib/textRepository";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function TextRepository() {
  const [texts, setTexts] = useState<StoredTextRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function refresh() {
      try {
        const nextTexts = await getStoredTexts();
        setTexts(nextTexts);
        setSelectedId((current) => current || nextTexts[0]?.id || null);
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Text load failed.");
      }
    }

    void refresh();
    window.addEventListener("text-repository-change", refresh);

    return () => window.removeEventListener("text-repository-change", refresh);
  }, []);

  const filteredTexts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return texts;
    }

    return texts.filter((item) =>
      [item.title, item.body, item.learningGoal, item.structureType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [query, texts]);

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
      setMessage(error instanceof Error ? error.message : "Delete failed.");
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
          <span className="status done">{texts.length} drafts</span>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="text-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="text-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 목표, 구조 검색"
            value={query}
          />
        </label>

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
                    {item.structureType} · {item.difficultyLevel} ·{" "}
                    {formatDate(item.updatedAt)}
                  </small>
                </span>
                <BookOpenText aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>저장된 글이 없습니다.</strong>
              <p>AI Workbench에서 글을 생성한 뒤 저장해 보세요.</p>
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
                <span className="status review">{selectedText.status}</span>
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
              <span>연령: {selectedText.ageRange}</span>
              <span>난이도: {selectedText.difficultyLevel}</span>
              <span>구조: {selectedText.structureType}</span>
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
                  : "아직 저장된 구조 분석이 없습니다. Workbench에서 구조 분석 후 다시 저장하면 함께 보관됩니다."}
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
