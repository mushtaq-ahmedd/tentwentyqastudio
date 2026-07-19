import {
  LayoutDashboard,
  FolderKanban,
  PlayCircle,
  AlertTriangle,
  FileText,
  History,
  Settings,
  ShieldCheck,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * docs/09-dashboard-ux.md: "Sidebar (fixed, primary nav): Dashboard, Projects, Audit Center,
 * Findings, Reports, History, Settings, Administration." The HTML prototype instead had a
 * "Testing Runs" entry duplicating History's screen with no Audit Center entry at all —
 * per the confirmed nav decision, this follows the doc.
 */
export const NAV_TOP: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/audit-center", label: "Audit Center", icon: PlayCircle },
  { href: "/findings", label: "Findings", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/history", label: "History", icon: History },
];

export const NAV_BOTTOM: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Administration", icon: ShieldCheck },
  { href: "/help", label: "Help", icon: HelpCircle },
];
