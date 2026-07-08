import { Entity } from "./Entity";
import { IRDI } from "./IRDI";
import * as Pids from "./PropertyIds.generated";
import { parseIrdiList, parseStringList, parseIntegerList } from "./helpers";

export const LIST_TYPE_ALIASES: Readonly<Record<string, string>> = {
  EXTENSIBLE: "extensible",
  CLOSED: "closed",
  OPEN: "open",
};

/**
 * A CDD ValueList entity (IEC 61360 meta-class MDC_C005).
 * Ported from Cdd::ValueList (lib/cdd/value_list.rb).
 */
export class ValueList extends Entity {
  get termIrdis(): IRDI[] {
    return parseIrdiList(this.get(Pids.MDC_P043));
  }

  get codeList(): string[] {
    return parseStringList(this.get(Pids.MDC_P044));
  }

  get selectionCount(): number[] | undefined {
    return parseIntegerList(this.get(Pids.MDC_P045));
  }

  get listType(): string | undefined {
    const raw = this.getString(Pids.MDC_P046);
    return raw ? (LIST_TYPE_ALIASES[raw] ?? raw) : undefined;
  }
}
