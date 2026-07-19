import { prisma } from "@tentwenty/db";
import type { AdminUser, ApiResponse, UserRole } from "@/lib/types";
import { requireAdministrator, requireUser } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fail, guarded, ok } from "./client";
import { toAdminUser, USER_ROLE_TO_DB } from "./mappers";

export async function fetchAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
  return guarded(async () => {
    await requireAdministrator();
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return ok(users.map(toAdminUser));
  });
}

/**
 * Real invite flow: calls Supabase Auth's inviteUserByEmail() admin API, which creates a real
 * auth.users row and sends the actual invite email. packages/db/prisma/triggers/
 * auth_user_sync.sql's trigger then creates the matching public.users profile row automatically
 * (same trigger self-service signup uses) — but it always defaults to role QA_ENGINEER and
 * status ACTIVE, since it has no way to know this was an admin invite with a specific role. So
 * this immediately updates that row to the requested role and status INVITED once the trigger
 * has run (both happen inside the same auth.users insert transaction the admin API call awaits,
 * so the row is guaranteed to exist by the time inviteUserByEmail() resolves).
 */
export async function inviteUser(input: {
  name: string;
  email: string;
  role: UserRole;
}): Promise<ApiResponse<AdminUser>> {
  return guarded(async () => {
    await requireAdministrator();
    if (!input.email.trim()) return fail("VALIDATION_ERROR", "Email is required.");

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return fail("VALIDATION_ERROR", "A user with that email already exists.");

    const { data, error } = await supabaseAdmin().auth.admin.inviteUserByEmail(input.email, {
      data: { name: input.name || undefined },
    });
    if (error || !data.user) {
      return fail("INVITE_FAILED", error?.message ?? "Failed to send invite.");
    }

    const user = await prisma.user.update({
      where: { id: data.user.id },
      data: {
        name: input.name || undefined,
        role: USER_ROLE_TO_DB[input.role],
        status: "INVITED",
      },
    });
    return ok(toAdminUser(user), "Invite sent successfully.");
  });
}

export async function toggleUserStatus(userId: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireAdministrator();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail("USER_NOT_FOUND", "User does not exist.");
    await prisma.user.update({
      where: { id: userId },
      data: { status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" },
    });
    return ok(null, "User status updated.");
  });
}

export async function removeUser(userId: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireAdministrator();
    await prisma.user.delete({ where: { id: userId } });
    return ok(null, "User removed.");
  });
}

export async function fetchCurrentUser(): Promise<ApiResponse<AdminUser>> {
  return guarded(async () => {
    const user = await requireUser();
    return ok(toAdminUser(user));
  });
}
