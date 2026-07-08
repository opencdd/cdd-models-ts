import { Entity } from "./Entity";
import { IRDI } from "./IRDI";
import * as Pids from "./PropertyIds.generated";

/**
 * A CDD Unit entity (IEC 61360 meta-class MDC_C009).
 * Ported from Cdd::Unit (lib/cdd/unit.rb).
 */
export class Unit extends Entity {
  get structure(): string | undefined {
    return this.getString(Pids.MDC_P023);
  }

  get textRepresentation(): string | undefined {
    return this.getString(Pids.MDC_P023_1);
  }

  get symbol(): string | undefined {
    return this.textRepresentation;
  }

  get sgmlRepresentation(): string | undefined {
    return this.getString(Pids.MDC_P023_2);
  }

  get definitionClassIrdi(): IRDI | null {
    const raw = this.getString(Pids.MDC_P021);
    return raw ? IRDI.parse(raw) : null;
  }
}
