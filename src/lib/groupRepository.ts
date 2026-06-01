import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";
import type { AgeRange } from "@/lib/supabase/database.types";

export type GroupStudentRecord = {
  id: string;
  displayName: string;
  email: string;
  ageRange?: AgeRange;
  readingLevel?: string;
};

export type LearningGroupRecord = {
  id: string;
  name: string;
  description: string;
  ageRange: string;
  studentCount: number;
  students: GroupStudentRecord[];
  createdAt: string;
  updatedAt: string;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  age_range: string | null;
  created_at: string;
  updated_at: string;
};

type GroupMemberRow = {
  learning_group_id: string;
  profile_id: string;
  member_role: "tutor" | "student";
  profiles?: {
    id: string;
    display_name: string | null;
    email: string | null;
    age_range: AgeRange | null;
    reading_level: string | null;
  } | null;
};

type StudentRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  age_range: AgeRange | null;
  reading_level: string | null;
};

function emitGroupRepositoryChange() {
  window.dispatchEvent(new Event("group-repository-change"));
}

function mapStudent(row: StudentRow): GroupStudentRecord {
  return {
    id: row.id,
    displayName: row.display_name || row.email || "Unnamed student",
    email: row.email || "",
    ageRange: row.age_range || undefined,
    readingLevel: row.reading_level || undefined
  };
}

function mapGroup(row: GroupRow, students: GroupStudentRecord[]): LearningGroupRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    ageRange: row.age_range || "",
    studentCount: students.length,
    students,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getLearningGroups(): Promise<LearningGroupRecord[]> {
  const supabase = createSupabaseBrowserClient();
  const { data: groups, error: groupError } = await supabase
    .from("learning_groups")
    .select("*")
    .order("name", { ascending: true });

  if (groupError) {
    throw groupError;
  }

  const groupIds = (groups || []).map((group) => group.id);
  const membersByGroup = new Map<string, GroupStudentRecord[]>();

  if (groupIds.length) {
    const { data: members, error: memberError } = await supabase
      .from("learning_group_members")
      .select("learning_group_id, profile_id, member_role, profiles(id, display_name, email, age_range, reading_level)")
      .in("learning_group_id", groupIds)
      .eq("member_role", "student");

    if (memberError) {
      throw memberError;
    }

    ((members || []) as unknown as GroupMemberRow[]).forEach((member) => {
      if (!member.profiles) {
        return;
      }

      const current = membersByGroup.get(member.learning_group_id) || [];
      membersByGroup.set(member.learning_group_id, [
        ...current,
        mapStudent(member.profiles)
      ]);
    });
  }

  return ((groups || []) as GroupRow[]).map((group) =>
    mapGroup(group, membersByGroup.get(group.id) || [])
  );
}

export async function getOrganizationStudents(): Promise<GroupStudentRecord[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, age_range, reading_level")
    .eq("role", "student")
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data || []) as StudentRow[]).map(mapStudent);
}

export async function getCurrentStudentGroupIds(): Promise<string[]> {
  const { supabase, user } = await requireCurrentProfile();
  const { data, error } = await supabase
    .from("learning_group_members")
    .select("learning_group_id")
    .eq("profile_id", user.id)
    .eq("member_role", "student");

  if (error) {
    throw error;
  }

  return (data || []).map((row) => row.learning_group_id);
}

export async function saveLearningGroup(record: {
  id?: string;
  name: string;
  description?: string;
  ageRange?: string;
}) {
  const { supabase, user, profile } = await requireCurrentProfile();
  const payload = {
    name: record.name,
    description: record.description || null,
    age_range: record.ageRange || null,
    updated_at: new Date().toISOString()
  };

  const query = record.id
    ? supabase
        .from("learning_groups")
        .update(payload)
        .eq("id", record.id)
        .select("*")
        .single()
    : supabase
        .from("learning_groups")
        .insert({
          ...payload,
          organization_id: profile.organization_id,
          created_by: user.id
        })
        .select("*")
        .single();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  emitGroupRepositoryChange();
  return mapGroup(data as GroupRow, []);
}

export async function deleteLearningGroup(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("learning_groups").delete().eq("id", id);

  if (error) {
    throw error;
  }

  emitGroupRepositoryChange();
}

export async function addStudentToGroup(groupId: string, studentId: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("learning_group_members").insert({
    learning_group_id: groupId,
    profile_id: studentId,
    member_role: "student"
  });

  if (error) {
    throw error;
  }

  emitGroupRepositoryChange();
}

export async function removeStudentFromGroup(groupId: string, studentId: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("learning_group_members")
    .delete()
    .eq("learning_group_id", groupId)
    .eq("profile_id", studentId)
    .eq("member_role", "student");

  if (error) {
    throw error;
  }

  emitGroupRepositoryChange();
}
