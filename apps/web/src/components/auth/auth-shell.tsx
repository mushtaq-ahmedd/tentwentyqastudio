export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <div className="flex w-[42%] shrink-0 flex-col justify-between bg-bg-sidebar p-12 text-white">
        <div className="flex items-center gap-2.5">
          <span className="size-6 rounded-md bg-accent-default" />
          <span className="text-base font-semibold">tentwenty QA Studio</span>
        </div>
        <div>
          <h2 className="max-w-[380px] text-[28px] font-semibold leading-[1.3] tracking-[-0.01em]">
            Ship with confidence. Let the audits run themselves.
          </h2>
          <p className="mt-3.5 max-w-[340px] text-[13.5px] text-text-on-dark-secondary">
            Connect a project, upload your requirements and test cases, and tentwenty QA Studio
            handles UI validation, content, and functional testing — automatically.
          </p>
        </div>
        <div className="text-xs text-text-on-dark-secondary">© 2026 tentwenty. All audits, one workspace.</div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-bg-page">{children}</div>
    </div>
  );
}
