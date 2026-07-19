"use server";

import { revalidatePath } from "next/cache";
import { adminApi } from "@/lib/api";
import type { AdminUser, ApiResponse, UserRole } from "@/lib/types";

export async function inviteUserAction(input: {
  name: string;
  email: string;
  role: UserRole;
}): Promise<ApiResponse<AdminUser>> {
  const result = await adminApi.inviteUser(input);
  revalidatePath("/admin");
  return result;
}

export async function toggleUserStatusAction(userId: string): Promise<ApiResponse<null>> {
  const result = await adminApi.toggleUserStatus(userId);
  revalidatePath("/admin");
  return result;
}

export async function removeUserAction(userId: string): Promise<ApiResponse<null>> {
  const result = await adminApi.removeUser(userId);
  revalidatePath("/admin");
  return result;
}
