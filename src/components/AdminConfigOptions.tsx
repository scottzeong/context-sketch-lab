"use client";

import { ArrowDown, ArrowUp, PlusCircle, Save, Settings2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ConfigOptionCategory, ConfigOptionRecord } from "@/lib/configOptions";
import {
  configCategoryLabels,
  createConfigOption,
  deleteConfigOption,
  getConfigOptions,
  updateConfigOption
} from "@/lib/configOptions";

type EditableOption = ConfigOptionRecord & {
  isNew?: boolean;
  isDeleted?: boolean;
};

const categories = Object.keys(configCategoryLabels) as ConfigOptionCategory[];

function makeTempId() {
  return `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AdminConfigOptions() {
  const [options, setOptions] = useState<EditableOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ConfigOptionCategory>("age_range");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function loadOptions() {
    const nextOptions = await getConfigOptions(true);
    setOptions(nextOptions);
  }

  useEffect(() => {
    void loadOptions();
  }, []);

  const visibleOptions = useMemo(
    () =>
      options
        .filter((option) => option.category === selectedCategory && !option.isDeleted)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [options, selectedCategory]
  );

  function updateLocal(id: string, updates: Partial<EditableOption>) {
    setOptions((current) =>
      current.map((option) => (option.id === id ? { ...option, ...updates } : option))
    );
  }

  function normalizeCategoryRows(rows: EditableOption[]) {
    return rows.map((row, index) => ({ ...row, sortOrder: index + 1 }));
  }

  function replaceCategoryRows(rows: EditableOption[]) {
    const normalized = normalizeCategoryRows(rows);
    setOptions((current) => [
      ...current.filter((option) => option.category !== selectedCategory),
      ...normalized
    ]);
  }

  function addOption() {
    const nextRows = [
      ...visibleOptions,
      {
        id: makeTempId(),
        category: selectedCategory,
        label: "",
        value: "",
        sortOrder: visibleOptions.length + 1,
        isActive: true,
        isNew: true
      }
    ];
    replaceCategoryRows(nextRows);
  }

  function moveOption(id: string, direction: -1 | 1) {
    const index = visibleOptions.findIndex((option) => option.id === id);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= visibleOptions.length) {
      return;
    }

    const nextRows = [...visibleOptions];
    const [item] = nextRows.splice(index, 1);
    nextRows.splice(targetIndex, 0, item);
    replaceCategoryRows(nextRows);
  }

  function markDeleted(option: EditableOption) {
    if (option.isNew) {
      setOptions((current) => current.filter((item) => item.id !== option.id));
      return;
    }

    updateLocal(option.id, { isDeleted: true });
  }

  async function saveCategory() {
    setIsSaving(true);
    setMessage(null);

    try {
      const categoryOptions = options.filter((option) => option.category === selectedCategory);
      const activeRows = normalizeCategoryRows(categoryOptions.filter((option) => !option.isDeleted));
      const deletedRows = categoryOptions.filter((option) => option.isDeleted && !option.isNew);

      for (const row of activeRows) {
        if (!row.label.trim() || !row.value.trim()) {
          throw new Error("표시 이름과 저장 값은 비워둘 수 없습니다.");
        }

        if (row.isNew) {
          await createConfigOption({
            category: row.category,
            label: row.label.trim(),
            value: row.value.trim(),
            sortOrder: row.sortOrder,
            isActive: row.isActive
          });
        } else {
          await updateConfigOption(row.id, {
            label: row.label.trim(),
            value: row.value.trim(),
            sortOrder: row.sortOrder,
            isActive: row.isActive
          });
        }
      }

      for (const row of deletedRows) {
        await deleteConfigOption(row.id);
      }

      await loadOptions();
      setMessage(`${configCategoryLabels[selectedCategory]} 항목을 저장했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel admin-config-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Settings</p>
          <h2>운영 옵션 관리</h2>
        </div>
        <span className="status done">
          <Settings2 aria-hidden="true" size={14} />
          {options.length}개
        </span>
      </div>

      {message ? <p className="save-message">{message}</p> : null}

      <div className="settings-tabs" aria-label="설정 항목">
        {categories.map((category) => (
          <button
            className={selectedCategory === category ? "active" : ""}
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {configCategoryLabels[category]}
          </button>
        ))}
      </div>

      <div className="admin-config-toolbar">
        <button className="secondary-button" onClick={addOption} type="button">
          <PlusCircle aria-hidden="true" size={17} />
          항목 추가
        </button>
        <button disabled={isSaving} onClick={saveCategory} type="button">
          <Save aria-hidden="true" size={17} />
          {configCategoryLabels[selectedCategory]} 저장
        </button>
      </div>

      <div className="config-option-list">
        {visibleOptions.map((option, index) => (
          <div className="config-option-row" key={option.id}>
            <span className="config-order">{index + 1}</span>
            <input
              aria-label="표시 이름"
              onChange={(event) => updateLocal(option.id, { label: event.target.value })}
              placeholder="표시 이름"
              value={option.label}
            />
            <input
              aria-label="저장 값"
              onChange={(event) => updateLocal(option.id, { value: event.target.value })}
              placeholder="저장 값"
              value={option.value}
            />
            <label className="compact-check">
              <input
                checked={option.isActive}
                onChange={(event) => updateLocal(option.id, { isActive: event.target.checked })}
                type="checkbox"
              />
              사용
            </label>
            <button
              className="icon-button"
              disabled={index === 0}
              onClick={() => moveOption(option.id, -1)}
              type="button"
              aria-label="위로 이동"
            >
              <ArrowUp aria-hidden="true" size={16} />
            </button>
            <button
              className="icon-button"
              disabled={index === visibleOptions.length - 1}
              onClick={() => moveOption(option.id, 1)}
              type="button"
              aria-label="아래로 이동"
            >
              <ArrowDown aria-hidden="true" size={16} />
            </button>
            <button
              className="danger-button"
              disabled={isSaving}
              onClick={() => markDeleted(option)}
              type="button"
              aria-label={`${option.label || "항목"} 삭제`}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
