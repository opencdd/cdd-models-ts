/**
 * Version history — per-version provenance captured in
 * `_entity.json#versions`.
 *
 * Ported from Cdd::Entity::VersionHistory (lib/cdd/entity/version_history.rb).
 * Each entry represents one historical version of the entity.
 *
 * Note: this is the class-backed entry shape with camelCase fields,
 * used by the interactive `VersionHistory` class below. The wire
 * format (snake_case) lives in `./jsonTypes.ts` as
 * `VersionHistoryEntry`. The two are deliberately separate types so
 * the model layer can evolve independently of the JSON shape.
 */
export interface VersionHistoryClassEntry {
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
  readonly entries: readonly VersionHistoryClassEntry[];

  constructor(entries: readonly VersionHistoryClassEntry[] = []) {
    this.entries = Array.from(entries);
    Object.freeze(this);
  }

  get size(): number {
    return this.entries.length;
  }

  get empty(): boolean {
    return this.entries.length === 0;
  }

  get current(): VersionHistoryClassEntry | undefined {
    return this.entries.find((e) => e.isCurrent) ?? this.entries[0];
  }

  get previous(): readonly VersionHistoryClassEntry[] {
    const cur = this.current;
    return this.entries.filter((e) => e !== cur);
  }

  toArray(): VersionHistoryClassEntry[] {
    return [...this.entries];
  }

  [Symbol.iterator](): Iterator<VersionHistoryClassEntry> {
    return this.entries[Symbol.iterator]();
  }
}
