/**
 * Report file storage — a dedicated `reports` Supabase Storage bucket, separate from `evidence`
 * (docs/03 Evidence Schema is specifically about per-finding proof; a report is a whole-audit
 * document, a different concern). Server-side only — uses the service role key.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "reports";

let client: SupabaseClient | null = null;

function storageClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Report storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/** Path convention: `{auditId}/{kind}.{ext}` — one audit's reports group together in the bucket. */
export async function uploadReport(
  auditId: string,
  kind: string,
  data: Buffer | string,
  contentType: string
): Promise<string> {
  const ext = contentType === "application/pdf" ? "pdf" : contentType === "text/csv" ? "csv" : "bin";
  const path = `${auditId}/${kind}.${ext}`;
  const { error } = await storageClient()
    .storage.from(BUCKET)
    .upload(path, data, { contentType, upsert: true });
  if (error) throw new Error(`Failed to upload report "${path}": ${error.message}`);
  return path;
}

/** Short-lived signed URL for downloading a generated report from the frontend. */
export async function getSignedReportUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await storageClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(`Failed to sign report URL "${path}": ${error?.message}`);
  return data.signedUrl;
}
