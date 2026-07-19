import { cache } from "react";
import { prisma, type User as DbUser } from "@tentwenty/db";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = DbUser;

/**
 * Resolves the authenticated Supabase Auth user to our public.users profile row (name, role,
 * status). Returns null if unauthenticated. Safe to call from Server Components, Server
 * Actions, and Route Handlers.
 *
 * Wrapped in React's `cache()` — every one of `requireUser()`/`requireNotViewer()`/etc.'s callers
 * ends up calling this, and each call was doing two full network round trips
 * (`supabase.auth.getUser()` genuinely re-validates against Supabase's auth servers, not just a
 * local cookie read, plus a Postgres lookup). A single page like Audit Center calls a `lib/api/*`
 * function per project to fetch its environments — 8 projects meant 8 separate full auth
 * round-trips on top of the 1 for the project list itself, all for the identical result. `cache()`
 * memoizes this per-request (Next.js's standard fix for exactly this shape of problem — see
 * https://nextjs.org/docs/app/building-your-application/caching#request-memoization), so every
 * caller within the same request/render reuses the same in-flight promise instead of re-fetching.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const profile = await prisma.user.findUnique({ where: { id: authUser.id } });
  return profile;
});

export class AuthError extends Error {
  status: number;
  code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.code = code;
    this.status = code === "UNAUTHORIZED" ? 401 : 403;
  }
}

/** Throws AuthError if unauthenticated — use in lib/api/* functions and Route Handlers. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHORIZED", "You must be logged in.");
  if (user.status === "DISABLED") throw new AuthError("FORBIDDEN", "Your account has been disabled.");
  return user;
}

/**
 * RBAC policy (first pass — see docs/05 "Authorization"). Flagging per docs/10's discipline:
 * this is a reasonable default, not sourced from a documented per-endpoint permission matrix.
 * Confirm/refine against real usage before this is load-bearing for anything sensitive.
 *
 *  - Viewer: read-only everywhere.
 *  - QA Engineer / QA Lead: full read-write on Projects/Environments/Knowledge/Audits/Findings.
 *  - Administrator: the above, plus Admin user management and platform Settings.
 */
export async function requireRole(...allowed: DbUser["role"][]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    throw new AuthError("FORBIDDEN", `This action requires one of: ${allowed.join(", ")}.`);
  }
  return user;
}

export async function requireNotViewer(): Promise<CurrentUser> {
  return requireRole("ADMINISTRATOR", "QA_LEAD", "QA_ENGINEER");
}

export async function requireAdministrator(): Promise<CurrentUser> {
  return requireRole("ADMINISTRATOR");
}
