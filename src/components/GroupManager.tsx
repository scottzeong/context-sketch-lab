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

export function GroupManager() {
  const [groups, setGroups] = useState<LearningGroupRecord[]>([]);
  const [students, setStudents] = useState<GroupStudentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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
      setMessage(error instanceof Error ? error.message : "그룹을 불러오지 못했습니다.");
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
    ? students.filter(
        (student) =>
          !selectedGroup.students.some((member) => member.id === student.id)
      )
    : students;

  async function saveGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setMessage("그룹을 저장했습니다.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "그룹 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function createNewGroup() {
    setSelectedId(null);
    setMessage("새 그룹 정보를 입력한 뒤 저장하세요.");
  }

  async function removeGroup() {
    if (!selectedGroup) {
      return;
    }

    await deleteLearningGroup(selectedGroup.id);
    setSelectedId(null);
    setMessage("그룹을 삭제했습니다.");
    await refresh();
  }

  async function addStudent(studentId: string) {
    if (!selectedGroup || !studentId) {
      return;
    }

    await addStudentToGroup(selectedGroup.id, studentId);
    await refresh();
  }

  async function removeStudent(studentId: string) {
    if (!selectedGroup) {
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
            <p className="section-kicker">Groups</p>
            <h2>수업 그룹</h2>
          </div>
          <button className="secondary-button" onClick={createNewGroup} type="button">
            <Plus aria-hidden="true" size={17} />
            새 그룹
          </button>
        </div>

        {message ? <p className="save-message">{message}</p> : null}

        <label className="search-box" htmlFor="group-search">
          <Search aria-hidden="true" size={17} />
          <input
            id="group-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="그룹명, 연령대 검색"
            value={query}
          />
        </label>

        <div className="text-list">
          {filteredGroups.length ? (
            filteredGroups.map((group) => (
              <button
                className={`text-list-item ${
                  selectedGroup?.id === group.id ? "active" : ""
                }`}
                key={group.id}
                onClick={() => setSelectedId(group.id)}
                type="button"
              >
                <span>
                  <strong>{group.name}</strong>
                  <small>
                    {group.ageRange || "연령 미설정"} · 학생 {group.studentCount}명
                  </small>
                </span>
                <Users aria-hidden="true" size={18} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              <strong>아직 그룹이 없습니다.</strong>
              <p>새 그룹을 만들어 학생을 배정하세요.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel group-detail">
        <form key={selectedGroup?.id || "new"} onSubmit={saveGroup}>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Group Detail</p>
              <h2>{selectedGroup?.name || "새 그룹"}</h2>
            </div>
            <div className="row-actions">
              {selectedGroup ? (
                <button className="danger-button" onClick={removeGroup} type="button">
                  <Trash2 aria-hidden="true" size={17} />
                  삭제
                </button>
              ) : null}
              <button disabled={isSaving} type="submit">
                <Save aria-hidden="true" size={17} />
                {isSaving ? "저장 중" : "저장"}
              </button>
            </div>
          </div>

          <div className="grid-two">
            <div className="field">
              <label htmlFor="name">그룹명</label>
              <input id="name" name="name" defaultValue={selectedGroup?.name || ""} />
            </div>
            <div className="field">
              <label htmlFor="ageRange">연령대</label>
              <input
                id="ageRange"
                name="ageRange"
                defaultValue={selectedGroup?.ageRange || ""}
                placeholder="예: AGE_9_10, 초등 3-4"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              name="description"
              defaultValue={selectedGroup?.description || ""}
              placeholder="그룹의 수업 목표나 운영 메모를 적습니다."
            />
          </div>
        </form>

        {selectedGroup ? (
          <div className="group-members-section">
            <div className="panel-heading compact-heading">
              <div>
                <p className="section-kicker">Members</p>
                <h2>학생 배정</h2>
              </div>
            </div>

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

            <div className="group-member-list">
              {selectedGroup.students.length ? (
                selectedGroup.students.map((student) => (
                  <article key={student.id}>
                    <div>
                      <strong>{student.displayName}</strong>
                      <p>{student.email}</p>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => void removeStudent(student.id)}
                      type="button"
                    >
                      제거
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-inline">
                  <strong>아직 배정된 학생이 없습니다.</strong>
                  <p>위 선택창에서 학생을 그룹에 추가하세요.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
