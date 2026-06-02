"use client";

import { PlusCircle, Save, Settings2, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ConfigOptionCategory,
  ConfigOptionRecord,
  configCategoryLabels,
  createConfigOption,
  deleteConfigOption,
  getConfigOptions,
  updateConfigOption
} from "@/lib/configOptions";

const categories = Object.keys(configCategoryLabels) as ConfigOptionCategory[];

export function AdminConfigOptions() {
  const [options, setOptions] = useState<ConfigOptionRecord[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ConfigOptionCategory>("age_range");
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
        .filter((option) => option.category === selectedCategory)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [options, selectedCategory]
  );

  async function addOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const saved = await createConfigOption({
        category: selectedCategory,
        label: String(formData.get("label") || "").trim(),
        value: String(formData.get("value") || "").trim(),
        sortOrder: Number(formData.get("sortOrder") || 100)
      });

      setOptions((current) => [...current, saved]);
      event.currentTarget.reset();
      setMessage("드롭다운 메뉴를 추가했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "메뉴 추가에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveOption(option: ConfigOptionRecord, formData: FormData) {
    setIsSaving(true);
    setMessage(null);

    try {
      const saved = await updateConfigOption(option.id, {
        label: String(formData.get("label") || "").trim(),
        value: String(formData.get("value") || "").trim(),
        sortOrder: Number(formData.get("sortOrder") || option.sortOrder),
        isActive: formData.get("isActive") === "on"
      });

      setOptions((current) =>
        current.map((currentOption) =>
          currentOption.id === saved.id ? saved : currentOption
        )
      );
      setMessage("드롭다운 메뉴를 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "메뉴 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeOption(id: string) {
    setIsSaving(true);
    setMessage(null);

    try {
      await deleteConfigOption(id);
      setOptions((current) => current.filter((option) => option.id !== id));
      setMessage("드롭다운 메뉴를 삭제했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "메뉴 삭제에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel admin-config-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Dropdown Settings</p>
          <h2>글 작성 드롭다운 관리</h2>
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

      <form className="admin-config-add-form" onSubmit={addOption}>
        <div className="field">
          <label htmlFor="config-label">표시 이름</label>
          <input id="config-label" name="label" placeholder="예: 600자" required />
        </div>
        <div className="field">
          <label htmlFor="config-value">저장 값</label>
          <input id="config-value" name="value" placeholder="예: 600자" required />
        </div>
        <div className="field">
          <label htmlFor="config-sort">순서</label>
          <input id="config-sort" name="sortOrder" type="number" defaultValue={100} />
        </div>
        <button disabled={isSaving} type="submit">
          <PlusCircle aria-hidden="true" size={17} />
          추가
        </button>
      </form>

      <div className="config-option-list">
        {visibleOptions.map((option) => (
          <form
            className="config-option-row"
            key={option.id}
            onSubmit={(event) => {
              event.preventDefault();
              void saveOption(option, new FormData(event.currentTarget));
            }}
          >
            <input name="label" defaultValue={option.label} aria-label="표시 이름" />
            <input name="value" defaultValue={option.value} aria-label="저장 값" />
            <input
              name="sortOrder"
              type="number"
              defaultValue={option.sortOrder}
              aria-label="순서"
            />
            <label className="compact-check">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={option.isActive}
              />
              사용
            </label>
            <button className="secondary-button" disabled={isSaving} type="submit">
              <Save aria-hidden="true" size={16} />
            </button>
            <button
              className="danger-button"
              disabled={isSaving}
              onClick={() => void removeOption(option.id)}
              type="button"
              aria-label={`${option.label} 삭제`}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
