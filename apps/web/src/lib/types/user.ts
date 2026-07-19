import type { UserRole } from "./common";

export type AdminUserStatus = "Active" | "Disabled" | "Invited";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;
  lastActiveAt: string | null;
};
