"use client";

import { usePathname } from "next/navigation";
import type { AdminUser, Audit } from "@/lib/types";
import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";
import { UIProvider } from "./ui-provider";
import { ModalHost } from "@/components/modals/modal-host";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";

export function AppShell({
  activeAudit,
  currentUser,
  children,
}: {
  activeAudit: Audit | null;
  currentUser: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <UIProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-200 focus:rounded-md focus:bg-accent-default focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader activeAudit={activeAudit} currentUser={currentUser} />
          <main id="main-content" className="flex-1 overflow-y-auto px-7 py-6">
            {/* Keyed by pathname so the fade-in replays on every navigation, not just first mount. */}
            <div key={pathname} className="content-enter flex flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ModalHost />
      <ConfirmDialog />
    </UIProvider>
  );
}
