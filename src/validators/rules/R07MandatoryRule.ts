import type { Rule, ValidationContext } from "../Rule";

export class R07MandatoryRule implements Rule {
  readonly ruleId = "R07";

  applies(ctx: ValidationContext): boolean {
    const req = (ctx.requirement ?? "").toUpperCase();
    return req === "MAND" || req === "KEY";
  }

  call(value: unknown, _ctx: ValidationContext): boolean {
    if (value === null || value === undefined) return false;
    return String(value).trim().length > 0;
  }

  message(_value: unknown, ctx: ValidationContext): string {
    return `R07: mandatory column ${ctx.columnIri} is empty`;
  }
}
