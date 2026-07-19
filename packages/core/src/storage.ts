/**
 * Evidence object storage (docs/05: "evidence lives in object storage; only metadata lives in
 * PostgreSQL" — docs/03 Evidence Schema: "referenced, not embedded"). Backed by the private
 * `evidence` Supabase Storage bucket. Server-side only — uses the service role key, so this must
 * never be imported into client bundles.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "evidence";

let client: SupabaseClient | null = null;

function storageClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Evidence storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/**
 * Uploads one evidence artifact and returns its storage path — the value that lands in
 * `Evidence.storagePath`. Path convention: `{auditId}/{pageId}/{kind}-{timestamp}.{ext}`, so all
 * evidence for one audit/page groups together in the bucket.
 */
export async function uploadEvidence(
  auditId: string,
  pageId: string,
  kind: string,
  data: Buffer | string,
  contentType: string
): Promise<string> {
  const ext = contentType.split("/")[1]?.split(";")[0] ?? "bin";
  const path = `${auditId}/${pageId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await storageClient()
    .storage.from(BUCKET)
    .upload(path, data, { contentType, upsert: false });
  if (error) throw new Error(`Failed to upload evidence "${path}": ${error.message}`);
  return path;
}

/** Short-lived signed URL for displaying binary evidence (screenshots) in the frontend. */
export async function getSignedEvidenceUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await storageClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(`Failed to sign evidence URL "${path}": ${error?.message}`);
  return data.signedUrl;
}

/** Reads back small text evidence (DOM/CSS snapshots, console/network logs) for inline display. */
export async function downloadEvidenceText(path: string): Promise<string> {
  const { data, error } = await storageClient().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Failed to download evidence "${path}": ${error?.message}`);
  return data.text();
}
