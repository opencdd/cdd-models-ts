import { Entity } from "./Entity";
import { IRDI } from "./IRDI";
import * as Pids from "./PropertyIds.generated";

/**
 * A CDD ValueTerm entity (IEC 61360 meta-class MDC_C010).
 * Ported from Cdd::ValueTerm (lib/cdd/value_term.rb).
 */
export class ValueTerm extends Entity {
  get valueListIrdi(): IRDI | null {
    const raw =
      this.getString(Pids.MDC_P018_1) ??
      this.getString(Pids.MDC_P045) ??
      this.getString("VALUE_LIST_IRDI");
    return raw ? IRDI.parse(raw) : null;
  }

  get enumerationCode(): string | undefined {
    return this.getString(Pids.MDC_P044);
  }

  get termCode(): string | undefined {
    return this.enumerationCode;
  }

  get definitionClassIrdi(): IRDI | null {
    const raw = this.getString(Pids.MDC_P021);
    return raw ? IRDI.parse(raw) : null;
  }

  get dataType(): string | undefined {
    return this.getString(Pids.MDC_P022);
  }
}
