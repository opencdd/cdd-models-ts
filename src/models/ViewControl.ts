import { Entity } from "./Entity";
import { IRDI } from "./IRDI";
import * as Pids from "./PropertyIds.generated";
import { parseIrdiList } from "./helpers";

/**
 * A CDD ViewControl entity (IEC 61360 extension meta-class EXT_C001).
 * Ported from Cdd::ViewControl (lib/cdd/view_control.rb).
 */
export class ViewControl extends Entity {
  get controlledClassIrdis(): IRDI[] {
    return parseIrdiList(this.get(Pids.EXT_P002));
  }

  get shownPropertyIrdis(): IRDI[] {
    return parseIrdiList(this.get(Pids.EXT_P003));
  }

  get dataObjectIdentifier(): string | undefined {
    return this.getString(Pids.MDC_P066);
  }

  get timeStamp(): string | undefined {
    return this.getString(Pids.MDC_P067);
  }
}
