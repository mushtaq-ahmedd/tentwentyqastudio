import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-bg-page text-center">
      <FileQuestion className="size-8 text-text-secondary" />
      <div className="text-base font-semibold">We couldn&apos;t find that page</div>
      <p className="max-w-sm text-[13px] text-text-secondary">
        It may have been moved, renamed, or the link might be out of date. Head back to your dashboard to
        keep going.
      </p>
      <Button render={<Link href="/dashboard" />} nativeButton={false}>Go to Dashboard</Button>
    </div>
  );
}
