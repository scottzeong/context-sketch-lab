import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, UserRole } from "@/lib/supabase/database.types";

const protectedPrefixes = ["/tutor", "/student", "/admin", "/parent", "/onboarding"];

const roleHome: Record<UserRole, string> = {
  admin: "/admin/users",
  tutor: "/tutor/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard"
};

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function roleAllowed(pathname: string, role: UserRole) {
  if (role === "admin") {
    return true;
  }

  if (pathname.startsWith("/tutor")) {
    return role === "tutor";
  }

  if (pathname.startsWith("/student")) {
    return role === "student";
  }

  if (pathname.startsWith("/parent")) {
    return role === "parent";
  }

  if (pathname.startsWith("/onboarding")) {
    return true;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isProtectedPath(pathname)) {
    return response;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.account_status === "disabled" || !roleAllowed(pathname, profile.role)) {
    return NextResponse.redirect(new URL(profile ? roleHome[profile.role] : "/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/tutor/:path*",
    "/student/:path*",
    "/admin/:path*",
    "/parent/:path*",
    "/onboarding/:path*",
    "/onboarding"
  ]
};
