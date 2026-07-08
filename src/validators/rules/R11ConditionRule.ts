import type { Rule, ValidationContext } from "../Rule";
import * as Pids from "../../models/PropertyIds.generated";
import { Condition, ConditionSyntaxError } from "../../models/Condition";
import { isEmpty, rubyInspect } from "./shared";

export class R11ConditionRule implements Rule {
  readonly ruleId = "R11";

  applies(ctx: ValidationContext): boolean {
    return ctx.columnIri === Pids.MDC_P028 || ctx.valueKind === "condition";
  }

  call(value: unknown, _ctx: ValidationContext): boolean {
    if (isEmpty(value)) return true;
    try {
      return Condition.parse(String(value)) !== null;
    } catch (err) {
      if (err instanceof ConditionSyntaxError) return false;
      throw err;
    }
  }

  message(value: unknown): string {
    return `R11: condition expression ${rubyInspect(value)} is not well-formed`;
  }
}
