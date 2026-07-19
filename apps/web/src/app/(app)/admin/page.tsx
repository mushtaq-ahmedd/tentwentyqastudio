import { Plus } from "lucide-react";
import { SetHeader } from "@/components/shell/set-header";
import { Card, CardContent } from "@/components/ui/card";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { adminApi } from "@/lib/api";

export default async function AdminPage() {
  const res = await adminApi.fetchAdminUsers();
  if (!res.success) throw new Error(res.error.message);

  return (
    <>
      <SetHeader
        title="Administration"
        action={{ label: "Invite User", icon: <Plus className="size-3.5" />, modal: "invite-user" }}
      />
      <Card>
        <CardContent>
          <AdminUsersTable users={res.data} />
        </CardContent>
      </Card>
    </>
  );
}
