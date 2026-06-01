import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AgeRange, UserRole } from "@/lib/supabase/database.types";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  role: z.enum(["admin", "tutor", "student", "parent"]),
  ageRange: z
    .enum(["AGE_7_8", "AGE_9_10", "AGE_11_12", "AGE_13_15", "AGE_16_18", "ADULT"])
    .optional()
    .or(z.literal("")),
  readingLevel: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = createUserSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "관리자만 계정을 생성할 수 있습니다." },
        { status: 403 }
      );
    }

    if (!adminProfile.organization_id) {
      return NextResponse.json(
        { ok: false, error: "관리자 profile에 organization_id가 없습니다." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          role: payload.role,
          display_name: payload.displayName,
          organization_id: adminProfile.organization_id,
          age_range: payload.ageRange || null,
          reading_level: payload.readingLevel || null
        }
      });

    if (createError || !created.user) {
      return NextResponse.json(
        { ok: false, error: createError?.message || "계정 생성에 실패했습니다." },
        { status: 400 }
      );
    }

    const { error: upsertError } = await adminClient.from("profiles").upsert({
      id: created.user.id,
      email: payload.email,
      display_name: payload.displayName,
      role: payload.role as UserRole,
      organization_id: adminProfile.organization_id,
      age_range: (payload.ageRange || null) as AgeRange | null,
      reading_level: payload.readingLevel || null,
      updated_at: new Date().toISOString()
    });

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: created.user.id,
        email: payload.email,
        role: payload.role,
        displayName: payload.displayName
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "계정 생성에 실패했습니다."
      },
      { status: 400 }
    );
  }
}
