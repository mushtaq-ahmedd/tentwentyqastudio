"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_BOTTOM, NAV_TOP, type NavItem } from "./nav-config";
import { LogoutButton } from "./logout-button";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "mb-px flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3.5 py-2.5 text-[12.5px] font-medium text-text-on-dark-secondary transition-colors hover:bg-white/5 hover:text-white",
        active && "border-accent-default bg-accent-default/22 text-white"
      )}
    >
      <Icon className={cn("size-[15px] shrink-0 opacity-80", active && "opacity-100")} />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex w-[244px] shrink-0 flex-col bg-bg-sidebar px-2.5 py-5">
      <div className="flex items-center gap-2 px-3 pt-1.5 pb-5.5">
        <span className="size-5 shrink-0 rounded-[5px] bg-accent-default" />
        <span className="text-sm font-semibold tracking-[-0.01em] text-white">tentwenty QA Studio</span>
      </div>

      {NAV_TOP.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}

      <div className="flex-1" />

      <div className="mt-1.5 border-t border-white/8 pt-1.5">
        {NAV_BOTTOM.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        <LogoutButton className="flex w-full items-center gap-2.5 rounded-md border-l-2 border-transparent px-3.5 py-2.5 text-[12.5px] font-medium text-text-on-dark-secondary transition-colors hover:bg-white/5 hover:text-white">
          <LogOut className="size-[15px] shrink-0 opacity-80" />
          <span>Log Out</span>
        </LogoutButton>
      </div>
    </nav>
  );
}
