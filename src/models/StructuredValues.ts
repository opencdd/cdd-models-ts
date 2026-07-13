import { IRDI } from "./IRDI";
import { Condition, ConditionSyntaxError } from "./Condition";
import { DataType } from "./DataType";
import { ValueFormat } from "./ValueFormat";

export interface SynonymPair {
  readonly lang: string;
  readonly name: string;
}

export function parseSynonyms(value: unknown): SynonymPair[] {
  if (value === null || value === undefined) return [];
  const s = String(value).trim();
  if (s.length === 0) return [];
  return parseSynonymTuples(s);
}

export function serializeSynonyms(
  pairs: readonly SynonymPair[] | null,
): string {
  if (!pairs || pairs.length === 0) return "";
  const tuples = pairs.map((p) => `(${p.name},${p.lang})`);
  return `{${tuples.join(",")}}`;
}

export function parseRefSet(value: unknown): IRDI[] {
  if (value === null || value === undefined) return [];
  let s = String(value).trim();
  if (s.length === 0) return [];
  if (s.startsWith("{") && s.endsWith("}")) s = s.slice(1, -1);
  return s
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => IRDI.parse(t))
    .filter((irdi): irdi is IRDI => irdi !== null);
}

export function serializeRefSet(
  irdis: readonly (IRDI | string)[] | null,
): string {
  if (!irdis || irdis.length === 0) return "";
  const elements = irdis.map((i) =>
    i instanceof IRDI ? i.toString() : String(i),
  );
  return `{${elements.join(",")}}`;
}

export function parseClassRef(value: unknown): IRDI | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s.length === 0) return null;
  return IRDI.parse(s);
}

export function serializeClassRef(irdi: IRDI | string | null): string {
  if (irdi === null) return "";
  return irdi instanceof IRDI ? irdi.toString() : String(irdi);
}

export function parseDataTypeValue(value: unknown): DataType | string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s.length === 0) return null;
  return DataType.parseOrString(s);
}

export function serializeDataTypeValue(dt: DataType | string | null): string {
  if (dt === null) return "";
  return dt instanceof DataType ? dt.toString() : String(dt);
}

export function parseConditionValue(value: unknown): Condition | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s.length === 0) return null;
  try {
    return Condition.parse(s);
  } catch (err) {
    if (err instanceof ConditionSyntaxError) return null;
    throw err;
  }
}

export function serializeConditionValue(condition: Condition | null): string {
  if (condition === null) return "";
  return condition.toString();
}

export function parseValueFormat(value: unknown): ValueFormat | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s.length === 0) return null;
  return ValueFormat.parse(s);
}

export function serializeValueFormat(format: ValueFormat | null): string {
  if (format === null) return "";
  return format.toString();
}

function parseSynonymTuples(raw: string): SynonymPair[] {
  const s = raw.trim();
  const inner = unwrapSet(s);
  if (inner === null) return [];
  return inner
    .split(/(?<=\))\s*,\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((tuple) => parseSingleSynonymTuple(tuple))
    .filter((p): p is SynonymPair => p !== null);
}

function unwrapSet(s: string): string | null {
  if (s.startsWith("{") && s.endsWith("}")) return s.slice(1, -1);
  if (s.startsWith("(") && s.endsWith(")")) return s;
  return null;
}

function parseSingleSynonymTuple(raw: string): SynonymPair | null {
  const s = raw.trim();
  if (!s.startsWith("(") || !s.endsWith(")")) return null;
  const inner = s.slice(1, -1).trim();
  const parts = splitAtTopLevelCommas(inner);
  if (parts.length < 2) return null;
  return { name: unquotePart(parts[0]), lang: unquotePart(parts[1]) };
}

export function unwrapAndSplit(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  const s = String(value).trim();
  if (s.length === 0) return [];
  const unwrapped =
    (s.startsWith("{") && s.endsWith("}")) ||
    (s.startsWith("(") && s.endsWith(")"))
      ? s.slice(1, -1)
      : s;
  return splitAtTopLevelCommas(unwrapped);
}

export function rejoin(
  elements: readonly (string | IRDI)[] | null | undefined,
): string {
  if (!elements || elements.length === 0) return "";
  const strs = elements
    .map((e) => (e instanceof IRDI ? e.toString() : String(e)))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (strs.length === 0) return "";
  return `{${strs.join(",")}}`;
}

function splitAtTopLevelCommas(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inQuote: string | null = null;
  let current = "";
  for (const ch of s) {
    if (inQuote !== null) {
      current += ch;
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      current += ch;
      continue;
    }
    if (ch === "(" || ch === "{") depth++;
    if (ch === ")" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim().length > 0) out.push(current.trim());
  return out;
}

function unquotePart(s: string): string {
  const trimmed = s.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
