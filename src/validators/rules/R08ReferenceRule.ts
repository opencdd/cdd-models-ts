/**
 * R08 Reference — every reference (single or in a set) must resolve.
 *
 * Ported from Cdd::Validator::ReferenceRule (lib/cdd/validator/reference_rule.rb).
 * Applies to identifier_ref, set_of_refs, and class_ref columns. Splits
 * set literals of the form `{...}` / `(...)` into individual tokens, parses
 * each as an IRDI (or short code), and verifies the entity exists in the
 * database. Returns true only when every token resolves.
 */

import type { Rule, ValidationContext } from "../Rule";
import { IRDI } from "../../models/IRDI";
import { isEmpty, rubyInspect } from "./shared";

export class R08ReferenceRule implements Rule {
  readonly ruleId = "R08";

  applies(ctx: ValidationContext): boolean {
    return (
      ctx.valueKind === "identifier_ref" ||
      ctx.valueKind === "set_of_refs" ||
      ctx.valueKind === "class_ref"
    );
  }

  call(value: unknown, ctx: ValidationContext): boolean {
    if (isEmpty(value)) return true;
    const db = ctx.database;
    if (!db) return false;
    const tokens = referenceTokens(String(value));
    return tokens.every((ref) => {
      const parsed = IRDI.parse(ref);
      if (parsed) {
        return db.find(parsed) !== null || db.findByCode(ref) !== null;
      }
      return db.findByCode(ref) !== null;
    });
  }

  message(value: unknown): string {
    return `R08: reference ${rubyInspect(value)} does not resolve in this database`;
  }
}

function referenceTokens(raw: string): string[] {
  const s = raw.trim();
  const unwrapped = unwrapDelimiters(s);
  return unwrapped
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function unwrapDelimiters(s: string): string {
  if (s.startsWith("{") && s.endsWith("}")) return s.slice(1, -1);
  if (s.startsWith("(") && s.endsWith(")")) return s.slice(1, -1);
  return s;
}
