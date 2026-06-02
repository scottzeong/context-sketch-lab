import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";

export type ConfigOptionCategory =
  | "age_range"
  | "difficulty_level"
  | "target_length"
  | "text_structure"
  | "rubric_axis";

export type ConfigOptionRecord = {
  id: string;
  category: ConfigOptionCategory;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
};

export const configCategoryLabels: Record<ConfigOptionCategory, string> = {
  age_range: "연령",
  difficulty_level: "난이도",
  target_length: "분량",
  text_structure: "글 구조",
  rubric_axis: "루브릭 평가구조"
};

export const defaultConfigOptions: Record<ConfigOptionCategory, ConfigOptionRecord[]> = {
  age_range: [
    { id: "default-age-7-8", category: "age_range", label: "7-8세", value: "AGE_7_8", sortOrder: 1, isActive: true },
    { id: "default-age-9-10", category: "age_range", label: "9-10세", value: "AGE_9_10", sortOrder: 2, isActive: true },
    { id: "default-age-11-12", category: "age_range", label: "11-12세", value: "AGE_11_12", sortOrder: 3, isActive: true },
    { id: "default-age-13-15", category: "age_range", label: "13-15세", value: "AGE_13_15", sortOrder: 4, isActive: true }
  ],
  difficulty_level: [
    { id: "default-difficulty-l2", category: "difficulty_level", label: "L2 기초", value: "L2", sortOrder: 1, isActive: true },
    { id: "default-difficulty-l3", category: "difficulty_level", label: "L3 보통", value: "L3", sortOrder: 2, isActive: true },
    { id: "default-difficulty-l4", category: "difficulty_level", label: "L4 중급", value: "L4", sortOrder: 3, isActive: true }
  ],
  target_length: [
    { id: "default-length-400", category: "target_length", label: "400자", value: "400자", sortOrder: 1, isActive: true },
    { id: "default-length-600", category: "target_length", label: "600자", value: "600자", sortOrder: 2, isActive: true },
    { id: "default-length-800", category: "target_length", label: "800자", value: "800자", sortOrder: 3, isActive: true }
  ],
  text_structure: [
    { id: "default-structure-narrative", category: "text_structure", label: "이야기 구조", value: "narrative", sortOrder: 1, isActive: true },
    { id: "default-structure-cause", category: "text_structure", label: "원인-결과", value: "cause_effect", sortOrder: 2, isActive: true },
    { id: "default-structure-problem", category: "text_structure", label: "문제-해결", value: "problem_solution", sortOrder: 3, isActive: true }
  ],
  rubric_axis: [
    { id: "default-rubric-situation", category: "rubric_axis", label: "상황 추론", value: "situation_inference", sortOrder: 1, isActive: true },
    { id: "default-rubric-structure", category: "rubric_axis", label: "구조 이해", value: "structure", sortOrder: 2, isActive: true },
    { id: "default-rubric-abstraction", category: "rubric_axis", label: "추상화", value: "abstraction", sortOrder: 3, isActive: true },
    { id: "default-rubric-perspective", category: "rubric_axis", label: "관점 전환", value: "perspective_shift", sortOrder: 4, isActive: true },
    { id: "default-rubric-expression", category: "rubric_axis", label: "표현 통합", value: "expression_integration", sortOrder: 5, isActive: true }
  ]
};

function mapOption(row: {
  id: string;
  category: ConfigOptionCategory;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
}): ConfigOptionRecord {
  return {
    id: row.id,
    category: row.category,
    label: row.label,
    value: row.value,
    sortOrder: row.sort_order,
    isActive: row.is_active
  };
}

export async function getConfigOptions(includeInactive = false) {
  const supabase = createSupabaseBrowserClient();
  const query = supabase
    .from("config_options")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  const { data, error } = includeInactive ? await query : await query.eq("is_active", true);

  if (error) {
    return Object.values(defaultConfigOptions).flat();
  }

  const mapped = (data || []).map((row) => mapOption(row as Parameters<typeof mapOption>[0]));
  const existingCategories = new Set(mapped.map((option) => option.category));
  const fallback = Object.entries(defaultConfigOptions).flatMap(([category, options]) =>
    existingCategories.has(category as ConfigOptionCategory) ? [] : options
  );

  return [...mapped, ...fallback];
}

export async function createConfigOption(input: {
  category: ConfigOptionCategory;
  label: string;
  value: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { supabase, user, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 설정 메뉴를 수정할 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("config_options")
    .insert({
      organization_id: profile.organization_id,
      category: input.category,
      label: input.label,
      value: input.value,
      sort_order: input.sortOrder || 1,
      is_active: input.isActive ?? true,
      created_by: user.id
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapOption(data as Parameters<typeof mapOption>[0]);
}

export async function updateConfigOption(
  id: string,
  updates: {
    label: string;
    value: string;
    sortOrder: number;
    isActive: boolean;
  }
) {
  const { supabase, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 설정 메뉴를 수정할 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("config_options")
    .update({
      label: updates.label,
      value: updates.value,
      sort_order: updates.sortOrder,
      is_active: updates.isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapOption(data as Parameters<typeof mapOption>[0]);
}

export async function deleteConfigOption(id: string) {
  const { supabase, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 설정 메뉴를 삭제할 수 있습니다.");
  }

  const { error } = await supabase.from("config_options").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
