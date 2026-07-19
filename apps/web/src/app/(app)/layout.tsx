import { AppShell } from "@/components/shell/app-shell";
import { auditsApi, adminApi } from "@/lib/api";

// Every page under this layout reads the authenticated user — never worth prerendering.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [activeAuditRes, currentUserRes] = await Promise.all([
    auditsApi.fetchActiveAudit(),
    adminApi.fetchCurrentUser(),
  ]);

  const activeAudit = activeAuditRes.success ? activeAuditRes.data : null;
  // Middleware already redirects unauthenticated requests before they reach this layout — this
  // fallback is a defensive safety net, not an expected path.
  const currentUser = currentUserRes.success
    ? currentUserRes.data
    : { id: "unknown", name: "You", email: "", role: "Viewer" as const, status: "Active" as const, lastActiveAt: null };

  return (
    <AppShell activeAudit={activeAudit} currentUser={currentUser}>
      {children}
    </AppShell>
  );
}
