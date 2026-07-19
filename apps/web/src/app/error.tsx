"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col items-center justify-center gap-3 bg-[#F5F6F8] text-center font-sans">
        <div className="text-base font-semibold">Something went wrong</div>
        <p className="max-w-sm text-[13px] text-[#6B7684]">
          The app hit an unexpected error. Try reloading — if it keeps happening, let your QA Lead know.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#0F6B5C] px-4 py-2 text-[13px] font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
