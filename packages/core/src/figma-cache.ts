/**
 * Figma Engine's fetch + cache layer (docs/04 "Rule: parsed Figma data must be cached — never
 * re-download the same design repeatedly"). Server-side only — the access token must never reach
 * a client bundle. Lives in packages/core (not the Figma Engine package itself) for the same
 * reason evidence storage does (storage.ts): shared infrastructure engines call directly, kept
 * separate from the Orchestrator's own audit-coordination responsibilities.
 */
import { prisma } from "@tentwenty/db";
import { TransientEngineError, type FigmaFrame } from "./types";

const FIGMA_TIMEOUT_MS = 15_000;
const FIGMA_API_BASE = "https://api.figma.com/v1";

/** Figma file URLs look like `https://www.figma.com/design/<fileKey>/<name>` (current) or
 * `https://www.figma.com/file/<fileKey>/<name>` (older). */
export function extractFigmaFileKey(fileUrl: string): string | null {
  const match = fileUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function figmaFetch(path: string, accessToken: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIGMA_TIMEOUT_MS);
  try {
    return await fetch(`${FIGMA_API_BASE}${path}`, {
      headers: { "X-Figma-Token": accessToken },
      signal: controller.signal,
    });
  } catch (err) {
    throw new TransientEngineError(`Failed to reach the Figma API: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function authOrNotFoundError(status: number, fileKey: string): Error | null {
  if (status === 403 || status === 401) {
    return new Error("Figma rejected the access token — check the project's Figma access token.");
  }
  if (status === 404) {
    return new Error(`Figma file was not found (key "${fileKey}") — check the project's Figma file URL.`);
  }
  return null;
}

type FigmaNode = {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number } | null;
  children?: FigmaNode[];
};

/** Only top-level children of each Figma "page" (a CANVAS node) — see `FigmaFrame`'s doc comment
 * for why this doesn't recurse further yet. */
function extractFrames(document: FigmaNode): FigmaFrame[] {
  const frames: FigmaFrame[] = [];
  for (const canvas of document.children ?? []) {
    if (canvas.type !== "CANVAS") continue;
    for (const node of canvas.children ?? []) {
      frames.push({
        id: node.id,
        name: node.name,
        type: node.type,
        absoluteBoundingBox: node.absoluteBoundingBox ?? null,
        figmaPageId: canvas.id,
        figmaPageName: canvas.name,
      });
    }
  }
  return frames;
}

/**
 * Returns the extracted frame/component structure for a project's Figma file, reusing the cached
 * copy whenever Figma reports no changes since the last fetch — checked via the cheap `/meta`
 * endpoint (a small JSON payload), never by re-downloading the full document just to compare.
 */
export async function getFigmaFrames(
  projectId: string,
  fileUrl: string,
  accessToken: string
): Promise<FigmaFrame[]> {
  const fileKey = extractFigmaFileKey(fileUrl);
  if (!fileKey) throw new Error(`Could not parse a Figma file key from "${fileUrl}".`);

  const metaRes = await figmaFetch(`/files/${fileKey}/meta`, accessToken);
  const metaError = authOrNotFoundError(metaRes.status, fileKey);
  if (metaError) throw metaError;
  if (!metaRes.ok) throw new TransientEngineError(`Figma metadata request failed: HTTP ${metaRes.status}`);

  const meta = (await metaRes.json()) as { file: { last_touched_at: string } };
  const lastModified = meta.file.last_touched_at;

  const cached = await prisma.figmaFileCache.findUnique({
    where: { projectId_fileKey: { projectId, fileKey } },
  });
  if (cached && cached.lastModified === lastModified) {
    return cached.frames as unknown as FigmaFrame[];
  }

  const fileRes = await figmaFetch(`/files/${fileKey}`, accessToken);
  const fileError = authOrNotFoundError(fileRes.status, fileKey);
  if (fileError) throw fileError;
  if (!fileRes.ok) throw new TransientEngineError(`Figma file request failed: HTTP ${fileRes.status}`);

  const file = (await fileRes.json()) as { document: FigmaNode };
  const frames = extractFrames(file.document);

  await prisma.figmaFileCache.upsert({
    where: { projectId_fileKey: { projectId, fileKey } },
    create: { projectId, fileKey, lastModified, frames: frames as never },
    update: { lastModified, frames: frames as never, fetchedAt: new Date() },
  });

  return frames;
}

/** Used by the "Connect Figma" flow to validate a token/file before saving — same auth/not-found
 * distinction as the cache path above, but never writes to the cache (the project may not even
 * be persisted with this file/token yet). Returns the file's display name from Figma so the
 * caller doesn't have to invent one. */
export async function verifyFigmaAccess(fileUrl: string, accessToken: string): Promise<{ name: string }> {
  const fileKey = extractFigmaFileKey(fileUrl);
  if (!fileKey) throw new Error(`Could not parse a Figma file key from "${fileUrl}".`);
  const res = await figmaFetch(`/files/${fileKey}/meta`, accessToken);
  const error = authOrNotFoundError(res.status, fileKey);
  if (error) throw error;
  if (!res.ok) throw new Error(`Figma metadata request failed: HTTP ${res.status}`);
  const meta = (await res.json()) as { file: { name: string } };
  return { name: meta.file.name };
}
