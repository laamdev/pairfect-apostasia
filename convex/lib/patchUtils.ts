/**
 * Shared patch extraction and application utilities for the schema-driven
 * preferences chatbot. Adapted from kaizente's exercise-creation chatbot.
 *
 * No "use node" — must work in both Node.js actions and V8 mutations.
 */

import { applyPatch } from 'fast-json-patch';

/** Matches `<patch>...</patch>` blocks in LLM output. */
export const PATCH_BLOCK_RE = /<patch>([\s\S]*?)<\/patch>/gi;

/** Matches the end-of-process signal variants from LLM output. */
export const END_OF_PROCESS_RE = /<\s*(?:END|END_OF_PROCESS|GUARDAR|FIN(?:_DEL_PROCESO)?)\s*\/?\s*>/gi;

/**
 * Extract JSON Patch operations from `<patch>` blocks in LLM output.
 * Handles markdown code fences inside patch blocks. Malformed blocks are
 * logged and skipped.
 */
export function extractPatches(content: string, logPrefix = '[PatchUtils]'): unknown[] {
  const patches: unknown[] = [];
  PATCH_BLOCK_RE.lastIndex = 0;
  let match = PATCH_BLOCK_RE.exec(content);
  while (match !== null) {
    const raw = match[1]?.trim();
    if (raw) {
      try {
        const jsonStr = raw
          .replace(/^```(?:json|patch)?\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();
        const parsed = JSON.parse(jsonStr) as unknown;
        const ops = Array.isArray(parsed) ? parsed : [parsed];
        patches.push(...ops);
      } catch (e) {
        console.warn(
          `${logPrefix} Malformed patch block skipped:`,
          raw.slice(0, 200),
          e instanceof Error ? e.message : e,
        );
      }
    }
    match = PATCH_BLOCK_RE.exec(content);
  }
  return patches;
}

/** Remove all `<patch>...</patch>` blocks from content for display. */
export function stripPatchBlocks(content: string): string {
  return content.replace(PATCH_BLOCK_RE, '').trim();
}

/** Remove the end-of-process signal from content. */
export function stripEndToken(content: string): string {
  return content.replace(END_OF_PROCESS_RE, '').trim();
}

/** Validate that operations look like JSON Patch ops with string paths. */
export function filterValidOps(ops: unknown[]): Array<{ op: string; path: string; value?: unknown }> {
  return ops.filter(
    (op): op is { op: string; path: string; value?: unknown } =>
      typeof op === 'object' &&
      op !== null &&
      'op' in op &&
      typeof (op as { path?: string }).path === 'string',
  );
}

/**
 * Apply JSON Patch operations to a document (deep clone first). Tries the
 * whole batch atomically first; on failure, falls back to applying each op
 * individually so a single broken patch doesn't drop the rest of a turn.
 * `replace` on a missing leaf is transparently retried as `add`.
 */
export function applyPatchesToDocument(
  doc: Record<string, unknown>,
  operations: unknown[],
  logPrefix = '[PatchUtils]',
): Record<string, unknown> {
  const validOps = filterValidOps(operations);
  if (validOps.length === 0) return doc;

  try {
    const result = applyPatch(
      JSON.parse(JSON.stringify(doc)) as Record<string, unknown>,
      validOps as Parameters<typeof applyPatch>[1],
      true,
      false,
    );
    return result.newDocument as Record<string, unknown>;
  } catch (batchError) {
    console.warn(
      `${logPrefix} Batch patch failed — retrying ops individually. Reason:`,
      batchError instanceof Error ? batchError.message : batchError,
    );
  }

  let working: Record<string, unknown> = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
  for (let i = 0; i < validOps.length; i++) {
    const op = validOps[i];
    if (!op) continue;
    try {
      const result = applyPatch(working, [op] as Parameters<typeof applyPatch>[1], true, false);
      working = result.newDocument as Record<string, unknown>;
    } catch (opError) {
      const message = opError instanceof Error ? opError.message : '';
      const isUnresolvableReplace = op.op === 'replace' && /OPERATION_PATH_UNRESOLVABLE/.test(message);
      if (isUnresolvableReplace) {
        try {
          const upgraded = { ...op, op: 'add' };
          const result = applyPatch(working, [upgraded] as Parameters<typeof applyPatch>[1], true, false);
          working = result.newDocument as Record<string, unknown>;
          continue;
        } catch {
          // fall through to drop log
        }
      }
      console.warn(`${logPrefix} Dropped op #${i}:`, JSON.stringify(op).slice(0, 200), message);
    }
  }
  return working;
}
