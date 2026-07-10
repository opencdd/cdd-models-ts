/**
 * Version history — per-version provenance captured in
 * `_entity.json#versions`.
 *
 * Ported from Cdd::Entity::VersionHistory (lib/cdd/entity/version_history.rb).
 * Each entry represents one historical version of the entity.
 */
export interface VersionHistoryEntry {
  version: string | null;
  revision: string | null;
  status: string | null;
  timestamp: string | null;
  user: string | null;
  changeRequestId: string | null;
  unid: string | null;
  isCurrent: boolean;
}

export class VersionHistory {
  readonly entries: readonly VersionHistoryEntry[];

  constructor(entries: readonly VersionHistoryEntry[] = []) {
    this.entries = Array.from(entries);
    Object.freeze(this);
  }

  get size(): number {
    return this.entries.length;
  }

  get empty(): boolean {
    return this.entries.length === 0;
  }

  get current(): VersionHistoryEntry | undefined {
    return this.entries.find((e) => e.isCurrent) ?? this.entries[0];
  }

  get previous(): readonly VersionHistoryEntry[] {
    const cur = this.current;
    return this.entries.filter((e) => e !== cur);
  }

  toArray(): VersionHistoryEntry[] {
    return [...this.entries];
  }

  [Symbol.iterator](): Iterator<VersionHistoryEntry> {
    return this.entries[Symbol.iterator]();
  }
}
