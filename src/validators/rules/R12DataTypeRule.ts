import type { Rule, ValidationContext } from "../Rule";
import * as Pids from "../../models/PropertyIds.generated";
import { DataType } from "../../models/DataType";
import { isEmpty, rubyInspect } from "./shared";

export class R12DataTypeRule implements Rule {
  readonly ruleId = "R12";

  applies(ctx: ValidationContext): boolean {
    return ctx.columnIri === Pids.MDC_P022;
  }

  call(value: unknown, _ctx: ValidationContext): boolean {
    if (isEmpty(value)) return true;
    try {
      return DataType.parse(String(value)) !== null;
    } catch {
      return false;
    }
  }

  message(value: unknown): string {
    return `R12: data type expression ${rubyInspect(value)} is not well-formed`;
  }
}
