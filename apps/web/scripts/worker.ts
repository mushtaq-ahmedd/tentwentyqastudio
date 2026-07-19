/**
 * Standalone BullMQ worker process (docs/11 "Background Workers"). Run alongside `next dev`/the
 * production web server — never inside a request handler. Started via `pnpm --filter web run
 * worker` locally; in production this is its own container consuming the same Redis queue,
 * scaled independently from the web process (docs/11).
 *
 * Registers engines explicitly before starting, same reason apps/web/src/lib/api/audits.ts does:
 * this script is its own module graph/process, separate from the Next.js server's, so nothing
 * else has run registerEngine() for any engine package yet.
 */
import "../src/lib/engines/register";
import { createAuditWorker } from "@tentwenty/core";

const worker = createAuditWorker();

worker.on("active", (job) => {
  console.log(JSON.stringify({ event: "audit-job-active", jobId: job.id, auditId: job.data.auditId }));
});

worker.on("completed", (job) => {
  console.log(JSON.stringify({ event: "audit-job-completed", jobId: job.id, auditId: job.data.auditId }));
});

worker.on("failed", (job, err) => {
  console.error(
    JSON.stringify({
      event: "audit-job-failed",
      jobId: job?.id,
      auditId: job?.data?.auditId,
      error: err.message,
    })
  );
});

console.log("Audit worker started — waiting for jobs...");

async function shutdown() {
  console.log("Audit worker shutting down...");
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
