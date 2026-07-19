"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "./logout-button";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileMenu({ name, email }: { name: string; email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-accent-default text-xs font-semibold text-white outline-none"
      >
        {initials(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-semibold">{name}</DropdownMenuLabel>
        <div className="-mt-1 px-2 pb-2 text-[11.5px] text-text-secondary">{email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings">Settings</Link>} />
        <DropdownMenuItem render={<Link href="/admin">Administration</Link>} />
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<LogoutButton className="w-full text-left">Log Out</LogoutButton>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
