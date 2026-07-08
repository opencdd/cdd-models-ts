import type { Rule, ValidationContext } from "../Rule";
import { isEmpty, rubyInspect } from "./shared";

export class R04EnumRule implements Rule {
  readonly ruleId = "R04";

  applies(ctx: ValidationContext): boolean {
    return ctx.dataType !== undefined && ctx.dataType.startsWith("ENUM_");
  }

  call(value: unknown, ctx: ValidationContext): boolean {
    if (isEmpty(value)) return true;
    if (!ctx.enumTermsResolver) return true;
    const terms = ctx.enumTermsResolver(ctx.dataType ?? "");
    if (terms.length === 0) return true;
    return terms.some((t) => String(t) === String(value));
  }

  message(value: unknown, _ctx: ValidationContext): string {
    return `R04: ${rubyInspect(value)} is not a member of the value list`;
  }
}
