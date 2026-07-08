/**
 * IRDI — International Registration Data Identifier (ISO/IEC 11179-6).
 *
 * Ported from Cdd::IRDI (lib/cdd/irdi.rb). The Ruby class is the source of
 * truth; this TypeScript class is a behavioral projection for the browser.
 *
 * An IRDI has two forms:
 *   - Full:  registrant/semantic///scheme#code  (e.g. "0112/2///61360_4#AAA001")
 *   - Short: code                                (e.g. "AAA001")
 *
 * The tree-path form (registrant-semantic---scheme%23code) is accepted by
 * parse() and emitted by toTreePath(); it is the shape used in Domino page
 * URLs on cdd.iec.ch.
 */
export class IRDI {
  private static readonly FULL_REGEX =
    /^(?<registrant>[^/#\s]+)\/(?<semantic>[^/#\s]*)\/\/\/(?<scheme>[^/#\s]+)#(?<code>[^#\s]+)(?:##(?<smver>\d+))?$/;

  private static readonly SHORT_REGEX = /^[^#/\s]+$/;

  private static readonly TREE_REGEX =
    /^(?<registrant>[^-]+)-(?<semantic>[^-]*)---(?<scheme>[^-]+)%23(?<code>[^%\s]+)$/;

  readonly registrant: string | null;
  readonly semantic: string | null;
  readonly scheme: string | null;
  readonly code: string;
  readonly version: string | null;

  private constructor(params: {
    registrant: string | null;
    semantic: string | null;
    scheme: string | null;
    code: string;
    version?: string | null;
  }) {
    this.registrant = params.registrant;
    this.semantic = params.semantic;
    this.scheme = params.scheme;
    this.code = params.code;
    this.version = params.version ?? null;
    Object.freeze(this);
  }

  static parse(value: string | null | undefined): IRDI | null {
    if (value === null || value === undefined) return null;
    const s = String(value).trim();
    if (s.length === 0) return null;

    const full = IRDI.FULL_REGEX.exec(s);
    if (full?.groups) return IRDI.fromMatch(full.groups);

    const tree = IRDI.TREE_REGEX.exec(s);
    if (tree?.groups) return IRDI.fromMatch(tree.groups);

    if (IRDI.SHORT_REGEX.test(s)) return IRDI.fromShort(s);

    if (s.includes("#")) {
      const stripped = s.replace(/\s+/g, "");
      const retry = IRDI.FULL_REGEX.exec(stripped);
      if (retry?.groups) return IRDI.fromMatch(retry.groups);
    }

    return IRDI.fromShort(s);
  }

  static fromShort(code: string): IRDI {
    return new IRDI({
      registrant: null,
      semantic: null,
      scheme: null,
      code: String(code),
    });
  }

  static coerce(value: string | IRDI | null | undefined): IRDI | null {
    if (value instanceof IRDI) return value;
    return IRDI.parse(value);
  }

  private static fromMatch(g: Record<string, string | undefined>): IRDI {
    return new IRDI({
      registrant: g.registrant ?? null,
      semantic: g.semantic ?? null,
      scheme: g.scheme ?? null,
      code: g.code ?? "",
      version: g.smver ?? null,
    });
  }

  get full(): boolean {
    return this.registrant !== null;
  }

  get short(): boolean {
    return this.registrant === null;
  }

  get sheetmapVersion(): string | null {
    return this.version;
  }

  toShort(): string {
    return this.code;
  }

  toString(): string {
    if (this.short) return this.code;
    return `${this.registrant}/${this.semantic}///${this.scheme}#${this.code}`;
  }

  toTreePath(): string {
    if (this.short) return this.code;
    return `${this.registrant}-${this.semantic}---${this.scheme}%23${this.code}`;
  }

  withCode(newCode: string): IRDI {
    return new IRDI({
      registrant: this.registrant,
      semantic: this.semantic,
      scheme: this.scheme,
      code: String(newCode),
      version: this.version,
    });
  }

  equals(other: IRDI): boolean {
    return other instanceof IRDI && this.toString() === other.toString();
  }

  toJSON(): string {
    return this.toString();
  }
}
