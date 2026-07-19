import type { AdminUser, UserRole } from "@/lib/types";

export let ADMIN_USERS: AdminUser[] = [
  { id: "user-1", name: "Mushtaq Ahmed", email: "mushtaq@tentwenty.me", role: "Administrator", status: "Active", lastActiveAt: "2026-07-17T12:00:00Z" },
  { id: "user-2", name: "Anika Suri", email: "anika@tentwenty.me", role: "QA Lead", status: "Active", lastActiveAt: "2026-07-17T09:00:00Z" },
  { id: "user-3", name: "Jordan Reyes", email: "jordan@tentwenty.me", role: "QA Engineer", status: "Active", lastActiveAt: "2026-07-16T15:00:00Z" },
  { id: "user-4", name: "Sam Patel", email: "sam@tentwenty.me", role: "Viewer", status: "Disabled", lastActiveAt: "2026-07-03T09:00:00Z" },
];

export const CURRENT_USER = ADMIN_USERS[0];

export function inviteUser(input: { name: string; email: string; role: UserRole }): AdminUser {
  const user: AdminUser = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name || "New User",
    email: input.email || "new.user@company.com",
    role: input.role,
    status: "Invited",
    lastActiveAt: null,
  };
  ADMIN_USERS = [...ADMIN_USERS, user];
  return user;
}

export function toggleUserStatus(id: string) {
  ADMIN_USERS = ADMIN_USERS.map((u) =>
    u.id === id ? { ...u, status: u.status === "Active" ? "Disabled" : "Active" } : u
  );
}

export function removeUser(id: string) {
  ADMIN_USERS = ADMIN_USERS.filter((u) => u.id !== id);
}
