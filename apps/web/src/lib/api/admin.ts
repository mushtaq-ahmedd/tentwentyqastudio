import { prisma } from "@tentwenty/db";
import type { AdminUser, ApiResponse, UserRole } from "@/lib/types";
import { requireAdministrator, requireUser } from "@/lib/auth/session";
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
 * Scope for this pass: creates the public.users profile row directly (status INVITED). It does
 * NOT yet call Supabase Auth's inviteUserByEmail() admin API to actually send an invite email or
 * create a real login-capable account — see packages/db/prisma/triggers/auth_user_sync.sql's
 * comment for why. Follow-up, not done here.
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

    const user = await prisma.user.create({
      data: {
        name: input.name || "New User",
        email: input.email,
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
