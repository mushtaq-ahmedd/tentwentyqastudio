/** Next.js instrumentation hook — runs once when the server process starts. Used here to
 * populate the Engine Registry (docs/03) exactly once, not per-request. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/engines/register");
  }
}
