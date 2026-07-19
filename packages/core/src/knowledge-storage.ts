/**
 * Knowledge source file storage — a separate private `knowledge-sources` Supabase Storage bucket
 * (not `evidence` or `reports`): a knowledge source is an input document a human uploaded, not
 * something an Engine produced. Server-side only — uses the service role key.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "knowledge-sources";

let client: SupabaseClient | null = null;

function storageClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Knowledge source storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/** Path convention: `{projectId}/{sourceId}.{ext}`. `upsert: true` — re-uploading the same source
 * id (a future "replace file" action) should overwrite cleanly, same rationale as report-storage. */
export async function uploadKnowledgeSourceFile(
  projectId: string,
  sourceId: string,
  data: Buffer | string,
  contentType: string,
  ext: string
): Promise<string> {
  const path = `${projectId}/${sourceId}.${ext}`;
  const { error } = await storageClient()
    .storage.from(BUCKET)
    .upload(path, data, { contentType, upsert: true });
  if (error) throw new Error(`Failed to upload knowledge source "${path}": ${error.message}`);
  return path;
}

export async function downloadKnowledgeSourceText(path: string): Promise<string> {
  const { data, error } = await storageClient().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Failed to download knowledge source "${path}": ${error?.message}`);
  return data.text();
}
