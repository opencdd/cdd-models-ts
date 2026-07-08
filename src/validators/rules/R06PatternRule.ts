import type { Rule, ValidationContext } from "../Rule";
import { isEmpty, rubyInspect } from "./shared";

export class R06PatternRule implements Rule {
  readonly ruleId = "R06";

  applies(ctx: ValidationContext): boolean {
    return ctx.pattern !== undefined && ctx.pattern.trim().length > 0;
  }

  call(value: unknown, ctx: ValidationContext): boolean {
    if (isEmpty(value)) return true;
    try {
      return new RegExp(ctx.pattern ?? "").test(String(value));
    } catch {
      return false;
    }
  }

  message(value: unknown, ctx: ValidationContext): string {
    return `R06: ${rubyInspect(value)} does not match pattern ${rubyInspect(ctx.pattern)}`;
  }
}
