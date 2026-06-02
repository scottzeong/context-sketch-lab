import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";
import type { AccountStatus, AgeRange, UserRole } from "@/lib/supabase/database.types";

export type ManagedProfileRecord = {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
  organizationId: string;
  birthDate?: string;
  ageRange?: AgeRange;
  readingLevel?: string;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type ParentStudentLinkStatus = "pending" | "approved" | "revoked";

export type ParentStudentLinkRecord = {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  relationship: string;
  status: ParentStudentLinkStatus;
  createdAt: string;
  updatedAt: string;
};

function mapProfile(row: {
  id: string;
  role: UserRole;
  display_name: string | null;
  email: string | null;
  organization_id: string | null;
  birth_date: string | null;
  age_range: AgeRange | null;
  reading_level: string | null;
  account_status?: AccountStatus | null;
  created_at: string;
  updated_at: string;
}): ManagedProfileRecord {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name || row.email || "Unnamed user",
    email: row.email || "",
    organizationId: row.organization_id || "",
    birthDate: row.birth_date || undefined,
    ageRange: row.age_range || undefined,
    readingLevel: row.reading_level || undefined,
    accountStatus: row.account_status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getManagedProfiles(): Promise<ManagedProfileRecord[]> {
  const { supabase, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 사용자 목록을 볼 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("role", { ascending: true })
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapProfile);
}

export async function updateManagedProfile(
  id: string,
  updates: {
    role: UserRole;
    displayName: string;
    ageRange?: AgeRange | "";
    readingLevel?: string;
    accountStatus?: AccountStatus;
  }
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: updates.role,
      display_name: updates.displayName || null,
      age_range: updates.ageRange || null,
      account_status: updates.accountStatus || undefined,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

export async function updateManagedProfileStatus(
  id: string,
  accountStatus: AccountStatus
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      account_status: accountStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

function mapParentStudentLink(row: {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string | null;
  status: ParentStudentLinkStatus;
  created_at: string;
  updated_at: string;
  parent?: { display_name: string | null; email: string | null } | null;
  student?: { display_name: string | null; email: string | null } | null;
}): ParentStudentLinkRecord {
  const parentName = row.parent?.display_name || row.parent?.email || "Parent";
  const studentName = row.student?.display_name || row.student?.email || "Student";

  return {
    id: row.id,
    parentId: row.parent_id,
    parentName,
    parentEmail: row.parent?.email || "",
    studentId: row.student_id,
    studentName,
    studentEmail: row.student?.email || "",
    relationship: row.relationship || "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getParentStudentLinks(): Promise<ParentStudentLinkRecord[]> {
  const { supabase, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 부모-학생 연결을 관리할 수 있습니다.");
  }

  const { data: orgProfiles, error: orgProfilesError } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", profile.organization_id);

  if (orgProfilesError) {
    throw orgProfilesError;
  }

  const organizationProfileIds = new Set((orgProfiles || []).map((item) => item.id));

  const { data, error } = await supabase
    .from("parent_student_links")
    .select(
      "*, parent:profiles!parent_student_links_parent_id_fkey(display_name, email), student:profiles!parent_student_links_student_id_fkey(display_name, email)"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as unknown as Parameters<typeof mapParentStudentLink>[0][])
    .filter(
      (row) =>
        organizationProfileIds.has(row.parent_id) &&
        organizationProfileIds.has(row.student_id)
    )
    .map(mapParentStudentLink);
}

export async function saveParentStudentLink(input: {
  parentId: string;
  studentId: string;
  relationship?: string;
  status: ParentStudentLinkStatus;
}): Promise<ParentStudentLinkRecord> {
  const { supabase, user, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 부모-학생 연결을 저장할 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("parent_student_links")
    .upsert(
      {
        parent_id: input.parentId,
        student_id: input.studentId,
        relationship: input.relationship || null,
        status: input.status,
        approved_by: input.status === "approved" ? user.id : null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "parent_id,student_id" }
    )
    .select(
      "*, parent:profiles!parent_student_links_parent_id_fkey(display_name, email), student:profiles!parent_student_links_student_id_fkey(display_name, email)"
    )
    .single();

  if (error) {
    throw error;
  }

  return mapParentStudentLink(data as unknown as Parameters<typeof mapParentStudentLink>[0]);
}

export async function updateParentStudentLinkStatus(
  linkId: string,
  status: ParentStudentLinkStatus
): Promise<ParentStudentLinkRecord> {
  const { supabase, user, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 부모-학생 연결 상태를 변경할 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("parent_student_links")
    .update({
      status,
      approved_by: status === "approved" ? user.id : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", linkId)
    .select(
      "*, parent:profiles!parent_student_links_parent_id_fkey(display_name, email), student:profiles!parent_student_links_student_id_fkey(display_name, email)"
    )
    .single();

  if (error) {
    throw error;
  }

  return mapParentStudentLink(data as unknown as Parameters<typeof mapParentStudentLink>[0]);
}
