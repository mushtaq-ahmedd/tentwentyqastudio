import { prisma, type User as DbUser } from "@tentwenty/db";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = DbUser;

/**
 * Resolves the authenticated Supabase Auth user to our public.users profile row (name, role,
 * status). Returns null if unauthenticated. Safe to call from Server Components, Server
 * Actions, and Route Handlers.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const profile = await prisma.user.findUnique({ where: { id: authUser.id } });
  return profile;
}

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
