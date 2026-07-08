/**
 * CDDAL Builder — constructs a Database from a parsed CDDAL Document.
 *
 * Ported from Cdd::Cddal::Builder (lib/cdd/cddal/builder.rb). The Ruby
 * version supports `import "..."` declarations that pull subdocuments
 * from the filesystem; in the browser that pathway is unavailable, so
 * imports are recorded but not auto-fetched. Callers that need import
 * resolution should pre-fetch the URLs and pass the merged Document.
 */

import type {
  AliasDecl,
  ClassReferenceNode,
  ConditionNode,
  Declaration,
  Document,
  ImportDecl,
  InstanceDecl,
  Literal,
  MetaClassDecl,
  PropertyAssignment,
  SetNode,
  TupleNode,
  ValueNode,
} from "./AST";
import {
  isAliasDecl,
  isImportDecl,
  isInstanceDecl,
  isMetaClassDecl,
} from "./AST";
import { Database } from "../models/Database";
import { AliasTable, AliasTableError } from "../models/AliasTable";
import { Entity } from "../models/Entity";
import { IRDI } from "../models/IRDI";
import { CODE_PROPERTY_CANDIDATES } from "../models/codeProperty";
import { referencePropertyIds } from "../models/referenceKinds";
import { ENTITY_CONSTRUCTORS } from "../models/entityConstructors";
import { entityTypeFor as metaTypeFor } from "../models/MetaClasses.generated";

export interface BuildResult {
  readonly database: Database;
  readonly importedUrls: readonly string[];
  readonly warnings: readonly string[];
}

export class Builder {
  readonly database: Database;
  readonly aliasTable: AliasTable;
  private readonly symbolTable = new Map<string, InstanceDecl>();
  private readonly instanceDecls: InstanceDecl[] = [];
  private readonly metaClassOverrides = new Map<string, { allowedPropertyIds: Set<string> }>();
  private readonly importedUrls = new Set<string>();
  private readonly warnings: string[] = [];

  constructor(database?: Database) {
    this.database = database ?? new Database();
    this.aliasTable = this.database.aliasTable;
  }

  build(document: Document): BuildResult {
    this.applyAliasDeclarations(document.declarations);
    this.applyMetaClassDeclarations(document.declarations);
    this.applyImportDeclarations(document.declarations);
    this.registerInstanceSymbols(document.declarations);
    this.instantiateEntities();
    this.resolvePropertyReferences();
    this.database.finalize();
    return {
      database: this.database,
      importedUrls: [...this.importedUrls],
      warnings: [...this.warnings],
    };
  }

  private applyAliasDeclarations(decls: readonly Declaration[]): void {
    for (const decl of decls) {
      if (!isAliasDecl(decl)) continue;
      try {
        this.aliasTable.declare(decl.aliasName, resolvePropertyId(this.aliasTable, decl.propertyId));
      } catch (err) {
        if (err instanceof AliasTableError) {
          this.warnings.push(err.message);
        } else {
          throw err;
        }
      }
    }
  }

  private applyMetaClassDeclarations(decls: readonly Declaration[]): void {
    for (const decl of decls) {
      if (!isMetaClassDecl(decl)) continue;
      const allowed = new Set(decl.propertyIdentifiers.map((id) => resolvePropertyId(this.aliasTable, id)));
      this.metaClassOverrides.set(decl.irdi, { allowedPropertyIds: allowed });
    }
  }

  private applyImportDeclarations(decls: readonly Declaration[]): void {
    for (const decl of decls) {
      if (!isImportDecl(decl)) continue;
      if (this.importedUrls.has(decl.url)) continue;
      this.importedUrls.add(decl.url);
      this.warnings.push(`import "${decl.url}" not fetched — caller must pre-merge`);
    }
  }

  private registerInstanceSymbols(decls: readonly Declaration[]): void {
    for (const decl of decls) {
      if (!isInstanceDecl(decl)) continue;
      this.instanceDecls.push(decl);
      if (decl.name) this.registerSymbolName(decl.name, decl);
    }
  }

  private registerSymbolName(name: string, decl: InstanceDecl): void {
    if (this.symbolTable.has(name) && this.symbolTable.get(name) !== decl) {
      this.warnings.push(`Symbol ${JSON.stringify(name)} already declared; ignoring redefinition`);
      return;
    }
    this.symbolTable.set(name, decl);
  }

  private instantiateEntities(): void {
    for (const decl of this.instanceDecls) {
      const entity = this.buildEntity(decl);
      if (!entity) continue;
      this.database.addEntity(entity);
      if (decl.name) this.database.registerSymbol(decl.name, entity);
    }
  }

  private buildEntity(decl: InstanceDecl): Entity | null {
    const metaClassRef = resolveMetaClassRef(this.aliasTable, decl.metaClassRef);
    if (!metaClassRef) return null;
    const ctor = ENTITY_CONSTRUCTORS[metaClassRef];
    if (!ctor) return null;
    const properties = this.buildProperties(decl);
    const irdi = extractIrdi(properties);
    return new ctor(irdi, properties, metaClassRef);
  }

  private buildProperties(decl: InstanceDecl): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    for (const assignment of decl.assignments) {
      const propertyId = resolvePropertyId(this.aliasTable, assignment.identifier);
      const key = assignment.languageTag ? `${propertyId}.${assignment.languageTag}` : propertyId;
      const value = serializeValue(assignment.value);
      props[key] = mergePropertyValue(props[key], value);
    }
    return props;
  }

  private resolvePropertyReferences(): void {
    const referencePropertyIdsList = referencePropertyIds();
    for (const entity of this.database.entities()) {
      for (const key of entity.keys()) {
        const base = key.replace(/\.\w+$/, "");
        if (!referencePropertyIdsList.includes(base)) continue;
        const value = entity.properties.get(key);
        if (value === undefined) continue;
        const s = String(value).trim();
        if (s.length === 0) continue;
        const resolved = resolvePropertyValue(this.database, s);
        if (resolved !== s) entity.setPropertyValue(key, resolved);
      }
    }
  }
}

function resolvePropertyValue(database: Database, raw: string): string {
  const s = raw.trim();
  if (!isWrappedCollection(s)) {
    return resolveSingleReference(database, s);
  }
  const inner = s.slice(1, -1);
  const elements = inner.split(",").map((x) => x.trim()).filter((x) => x.length > 0);
  const resolved = elements.map((e) => resolveSingleReference(database, e)).filter((x) => x.length > 0);
  return `{${resolved.join(",")}}`;
}

function isWrappedCollection(s: string): boolean {
  return (s.startsWith("(") && s.endsWith(")")) || (s.startsWith("{") && s.endsWith("}"));
}

function resolveSingleReference(database: Database, token: string): string {
  const target = database.resolveReference(token);
  return target?.irdi?.toString() ?? token;
}

function resolvePropertyId(aliasTable: AliasTable, name: string): string {
  if (/^MDC_P\d+/.test(name) || /^EXT_P\d+/.test(name) || /^CIM_P\d+/.test(name)) return name;
  return aliasTable.resolve(name) ?? name;
}

function resolveMetaClassRef(aliasTable: AliasTable, ref: string): string | null {
  if (!ref) return null;
  if (/^MDC_C\d+$/.test(ref) || /^EXT_C\d+$/.test(ref)) return ref;
  const canonical = aliasTable.resolve(ref);
  if (canonical && (metaTypeFor(canonical) !== undefined || ENTITY_CONSTRUCTORS[canonical])) {
    return canonical;
  }
  if (ENTITY_CONSTRUCTORS[ref]) return ref;
  return canonical ?? null;
}

function mergePropertyValue(existing: unknown, newValue: unknown): unknown {
  if (existing === undefined) return newValue;
  if (Array.isArray(existing) || Array.isArray(newValue)) {
    return [...(Array.isArray(existing) ? existing : [existing]), ...(Array.isArray(newValue) ? newValue : [newValue])];
  }
  return newValue;
}

function serializeValue(value: ValueNode): unknown {
  return valueNodeToString(value);
}

function valueNodeToString(value: ValueNode): string {
  switch (value.node) {
    case "literal": return value.raw;
    case "identifier_ref": return identifierRefToString(value);
    case "set": return `{${value.elements.map(valueNodeToString).join(",")}}`;
    case "tuple": return `(${value.elements.map(valueNodeToString).join(",")})`;
    case "class_reference": return `${value.typeName}(${valueNodeToString(value.argument)})`;
    case "condition": return `${value.left} ${value.operator} ${valueNodeToString(value.right)}`;
  }
}

function identifierRefToString(ref: { name: string; owner: string | null }): string {
  return ref.owner ? `${ref.owner}.${ref.name}` : ref.name;
}

function extractIrdi(properties: Record<string, unknown>): IRDI | null {
  for (const pid of CODE_PROPERTY_CANDIDATES) {
    const raw = properties[pid];
    if (typeof raw === "string" && raw.length > 0) return IRDI.parse(raw);
  }
  return null;
}

export type {
  AliasDecl,
  ClassReferenceNode,
  ConditionNode,
  Declaration,
  Document,
  ImportDecl,
  InstanceDecl,
  Literal,
  MetaClassDecl,
  PropertyAssignment,
  SetNode,
  TupleNode,
};
