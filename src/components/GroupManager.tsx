"use client";

import { Plus, Save, Search, Trash2, UserPlus, Users } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addStudentToGroup,
  deleteLearningGroup,
  getLearningGroups,
  getOrganizationStudents,
  GroupStudentRecord,
  LearningGroupRecord,
  removeStudentFromGroup,
  saveLearningGroup
} from "@/lib/groupRepository";

export function GroupManager({ readOnly = false }: { readOnly?: boolean }) {
  const [groups, setGroups] = useState<LearningGroupRecord[]>([]);
  const [students, setStudents] = useState<GroupStudentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function refresh() {
    try {
      const [nextGroups, nextStudents] = await Promise.all([
        getLearningGroups(),
        getOrganizationStudents()
      ]);
      setGroups(nextGroups);
      setStudents(nextStudents);
      setSelectedId((current) => current || nextGroups[0]?.id || null);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Class 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void refresh();
    window.addEventListener("group-repository-change", refresh);

    return () => window.removeEventListener("group-repository-change", refresh);
  }, []);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return groups;
    }

    return groups.filter((group) =>
      [group.name, group.description, group.ageRange]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [groups, query]);

  const selectedGroup =
    groups.find((group) => group.id === selectedId) || filteredGroups[0] || null;
  const availableStudents = selectedGroup
    ? students.filter((student) => !selectedGroup.students.some((member) => member.id === student.id))
    : students;

  async function saveGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) {
      setMessage("관리자는 Class를 참조만 할 수 있습니다.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const saved = await saveLearningGroup({
        id: selectedGroup?.id,
        name: String(formData.get("name") || ""),
        description: String(formData.get("description") || ""),
        ageRange: String(formData.get("ageRange") || "")
      });
      setSelectedId(saved.id);
      setMessage("Class를 저장했습니다.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Class 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function createNewGroup() {
    if (readOnly) {
      return;
    }
    setSelectedId(null);
    setDeleteConfirm("");
    setMessage("새 Class 정보를 입력한 뒤 저장하세요.");
  }

  async function removeGroup() {
    if (!selectedGroup) {
      return;
    }

    if (readOnly && deleteConfirm.trim() !== "확인") {
      setMessage("삭제하려면 입력칸에 '확인'을 정확히 입력하세요.");
      return;
    }

    await deleteLearningGroup(selectedGroup.id);
    setSelectedId(null);
    setDeleteConfirm("");
    setMessage("Class를 삭제했습니다.");
    await refresh();
  }

  async function addStudent(studentId: string) {
    if (readOnly || !selectedGroup || !studentId) {
      return;
    }

    await addStudentToGroup(selectedGroup.id, studentId);
    await refresh();
  }

  async function removeStudent(studentId: string) {
    if (readOnly || !selectedGroup) {
      return;
    }

    await removeStudentFromGroup(selectedGroup.id, studentId);
    await refresh();
  }

  return (
    <div className="groups-layout">
      <section className="panel groups-list">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Classes</p>
            <h2>수업 Class</h2>
          </div>
          {!readOnly ? (
            <button className="secondary-button" onClick={createNewGroup} type="button">
              <Plus aria-hidden="true" size={17} />새 Class
            </button>
          ) : null}
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="group-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="group-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Class명, 연령대 검색"
            value={query}
          />
        </label>

        <div className="text-list">
          {filteredGroups.length ? (
            filteredGroups.map((group) => (
              <button
                className={`text-list-item ${selectedGroup?.id === group.id ? "active" : ""}`}
                key={group.id}
                onClick={() => {
                  setSelectedId(group.id);
                  setDeleteConfirm("");
                }}
                type="button"
              >
                <span>
                  <strong>{group.name}</strong>
                  <small>
                    {group.ageRange || "연령 미설정"} | 학생 {group.studentCount}명
                  </small>
                </span>
                <Users aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>아직 Class가 없습니다.</strong>
              <p>
                {readOnly
                  ? "튜터가 생성한 Class가 생기면 여기에 표시됩니다."
                  : "새 Class를 만들고 학생을 배정하세요."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="panel group-detail">
        <form key={selectedGroup?.id || "new"} onSubmit={saveGroup}>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Class Detail</p>
              <h2>{selectedGroup?.name || "새 Class"}</h2>
            </div>
            <div className="row-actions">
              {selectedGroup ? (
                <button className="danger-button" onClick={removeGroup} type="button">
                  <Trash2 aria-hidden="true" size={17} />
                  삭제
                </button>
              ) : null}
              {!readOnly ? (
                <button disabled={isSaving} type="submit">
                  <Save aria-hidden="true" size={17} />
                  {isSaving ? "저장 중" : "저장"}
                </button>
              ) : null}
            </div>
          </div>

          {readOnly && selectedGroup ? (
            <div className="delete-confirm-row">
              <div className="field">
                <label htmlFor="group-delete-confirm">삭제 안전 확인</label>
                <input
                  id="group-delete-confirm"
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  placeholder="삭제하려면 확인을 입력하세요"
                  value={deleteConfirm}
                />
              </div>
            </div>
          ) : null}

          <div className="grid-two">
            <div className="field">
              <label htmlFor="name">Class명</label>
              <input
                id="name"
                name="name"
                defaultValue={selectedGroup?.name || ""}
                readOnly={readOnly}
              />
            </div>
            <div className="field">
              <label htmlFor="ageRange">연령대</label>
              <input
                id="ageRange"
                name="ageRange"
                defaultValue={selectedGroup?.ageRange || ""}
                placeholder="예: 초등 3-4"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              name="description"
              defaultValue={selectedGroup?.description || ""}
              placeholder="Class의 수업 목표나 운영 메모를 적습니다."
              readOnly={readOnly}
            />
          </div>
        </form>

        {selectedGroup ? (
          <div className="group-members-section">
            <div className="panel-heading compact-heading">
              <div>
                <p className="section-kicker">Members</p>
                <h2>배정 학생</h2>
              </div>
            </div>

            {!readOnly ? (
              <div className="group-add-student">
                <select
                  aria-label="추가할 학생"
                  defaultValue=""
                  onChange={(event) => {
                    void addStudent(event.target.value);
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="">학생 선택</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.displayName} ({student.email})
                    </option>
                  ))}
                </select>
                <UserPlus aria-hidden="true" size={18} />
              </div>
            ) : null}

            <div className="group-member-list">
              {selectedGroup.students.length ? (
                selectedGroup.students.map((student) => (
                  <article key={student.id}>
                    <div>
                      <strong>{student.displayName}</strong>
                      <p>{student.email}</p>
                    </div>
                    {!readOnly ? (
                      <button
                        className="secondary-button"
                        onClick={() => void removeStudent(student.id)}
                        type="button"
                      >
                        제거
                      </button>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="empty-inline">
                  <strong>아직 배정된 학생이 없습니다.</strong>
                  <p>
                    {readOnly
                      ? "튜터가 학생을 배정하면 목록에 표시됩니다."
                      : "학생 선택창에서 학생을 Class에 추가하세요."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
