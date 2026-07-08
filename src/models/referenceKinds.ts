/**
 * Reference-kind registry — single source of truth for "which property IDs
 * point at other entities?".
 *
 * Used by:
 *   - Database (renameEntity back-reference rewrite, normalizeReferenceCollections)
 *   - Builder (resolvePropertyReferences pass)
 *
 * Lives here rather than in PropertyIds.generated.ts because the value_kind
 * → reference classification is a domain predicate, not a registry fact.
 */

import { REGISTRY } from "./PropertyIds.generated";

export const REFERENCE_VALUE_KINDS: ReadonlySet<string> = new Set([
  "identifier_ref",
  "set_of_refs",
  "class_ref",
]);

export const SET_OF_REFS_KIND = "set_of_refs";

let cachedReferencePropertyIds: readonly string[] | null = null;
let cachedSetOfRefsPropertyIds: readonly string[] | null = null;

export function referencePropertyIds(): readonly string[] {
  if (cachedReferencePropertyIds === null) {
    cachedReferencePropertyIds = Object.entries(REGISTRY)
      .filter(([, e]) => REFERENCE_VALUE_KINDS.has(e.valueKind))
      .map(([id]) => id);
  }
  return cachedReferencePropertyIds;
}

export function setOfRefsPropertyIds(): readonly string[] {
  if (cachedSetOfRefsPropertyIds === null) {
    cachedSetOfRefsPropertyIds = Object.entries(REGISTRY)
      .filter(([, e]) => e.valueKind === SET_OF_REFS_KIND)
      .map(([id]) => id);
  }
  return cachedSetOfRefsPropertyIds;
}
