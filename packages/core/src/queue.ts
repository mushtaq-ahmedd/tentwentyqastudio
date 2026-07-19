/**
 * BullMQ job queue (docs/08/docs/11) — replaces the previous in-process synchronous execution
 * model. `startAudit()` now enqueues a job and returns immediately instead of blocking the web
 * request until every engine finishes; a separate worker process (apps/web/scripts/worker.ts)
 * consumes the queue and calls `runAudit()`. This is what actually lets the web app stay
 * responsive while an audit runs, and lets audits survive a web-server restart (the job persists
 * in Redis until a worker picks it up).
 */
import { Queue, Worker, type Job } from "bullmq";
import Redis from "ioredis";
import { runAudit } from "./orchestrator";

const AUDIT_QUEUE_NAME = "audit-execution";

let connection: Redis | null = null;

/** BullMQ requires `maxRetriesPerRequest: null` on the connection it's given — its blocking
 * commands (used to wait for new jobs) need unlimited retries; a finite limit makes BullMQ throw
 * on startup. */
function redisConnection(): Redis {
  if (connection) return connection;
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required for the audit job queue (see docs/11's Redis section).");
  }
  connection = new Redis(url, { maxRetriesPerRequest: null });
  return connection;
}

export type AuditJobData = { auditId: string };

let queueInstance: Queue<AuditJobData> | null = null;

export function auditQueue(): Queue<AuditJobData> {
  if (queueInstance) return queueInstance;
  queueInstance = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
    connection: redisConnection(),
    defaultJobOptions: {
      // 2 attempts: not a retry for an audit that failed on its own merits (runAudit's own
      // top-level try/catch already marks those FAILED and resolves normally, so BullMQ never
      // sees them as a failed job) — this is purely a safety net for the worker *process itself*
      // crashing (OOM, forced restart) before that try/catch gets a chance to run. Re-invoking
      // runAudit() is safe: it only re-processes engines still WAITING, not ones already
      // COMPLETED/FAILED.
      attempts: 2,
      backoff: { type: "fixed", delay: 5000 },
      // Bounded history — Upstash's free tier has a real storage cap; keep enough for debugging
      // without growing Redis usage unbounded over time.
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 200 },
    },
  });
  return queueInstance;
}

/** Enqueues an audit for a worker to pick up — does not run it inline. Call sites should leave
 * the Audit row at QUEUED status; the worker (via `runAudit`) transitions it to RUNNING itself. */
export async function enqueueAudit(auditId: string): Promise<void> {
  await auditQueue().add("run-audit", { auditId });
}

/** Starts a worker that consumes the audit queue — call this once from a long-running process
 * (apps/web/scripts/worker.ts), never from a request/response handler. `concurrency` bounds how
 * many audits this one worker process runs at once; horizontal scaling (docs/11) means running
 * more worker processes, not raising this indefinitely. */
export function createAuditWorker(concurrency = 4): Worker<AuditJobData> {
  return new Worker<AuditJobData>(
    AUDIT_QUEUE_NAME,
    async (job: Job<AuditJobData>) => {
      await runAudit(job.data.auditId);
    },
    { connection: redisConnection(), concurrency }
  );
}
