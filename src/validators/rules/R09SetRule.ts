import type { Rule, ValidationContext } from "../Rule";
import { isEmpty, rubyInspect } from "./shared";

export class R09SetRule implements Rule {
  readonly ruleId = "R09";

  applies(ctx: ValidationContext): boolean {
    return ctx.valueKind === "set_of_refs";
  }

  call(value: unknown, _ctx: ValidationContext): boolean {
    if (isEmpty(value)) return true;
    const s = String(value).trim();
    if (!s.startsWith("{") || !s.endsWith("}")) return false;
    return balanced(s.slice(1, -1));
  }

  message(value: unknown): string {
    return `R09: set literal ${rubyInspect(value)} is not well-formed`;
  }
}

function balanced(body: string): boolean {
  let depth = 0;
  for (const ch of body) {
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}
