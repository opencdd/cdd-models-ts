/**
 * YamlEntity — semantic CDD YAML model for one entity.
 *
 * Ported from Ruby's Opencdd::Entity::Yaml (lib/opencdd/entity/yaml.rb).
 * Uses CDD-native attribute names (preferred_name, superclass,
 * class_type) — NOT wire-format keys (MDC_P004, MDC_P010). Multilingual
 * fields are nested {lang: text} hashes; sets are arrays. Unknown
 * properties fall through to `extra` for lossless round-trip.
 */

import { Entity } from "../models/Entity";
import { IRDI } from "../models/IRDI";
import { Klass } from "../models/Klass";
import { Property } from "../models/Property";
import { Unit } from "../models/Unit";
import { ValueList } from "../models/ValueList";
import { ValueTerm } from "../models/ValueTerm";
import { Relation } from "../models/Relation";
import { ViewControl } from "../models/ViewControl";
import { ENTITY_CONSTRUCTORS } from "../models/entityConstructors";
import * as Pids from "../models/PropertyIds.generated";
import { rejoin } from "../models/StructuredValues";

export interface YamlEntityData {
  irdi: string | null;
  type: string | null;
  code: string | null;
  guid?: string;
  version?: string;
  revision?: string;
  preferred_name?: Record<string, string>;
  short_name?: Record<string, string>;
  definition?: Record<string, string>;
  note?: Record<string, string>;
  remark?: Record<string, string>;
  description?: Record<string, string>;
  class_type?: string;
  superclass?: string;
  is_case_of?: string[];
  applicable_properties?: string[];
  imported_properties?: string[];
  sub_class_selection?: string[];
  data_type?: string;
  value_format?: string;
  definition_class?: string;
  unit?: string;
  condition?: string;
  property_data_element_type?: string;
  unit_structure?: string;
  unit_text?: string;
  list_type?: string;
  code_list?: string[];
  term_irdis?: string[];
  enumeration_code?: string;
  relation_type?: string;
  codomain?: string;
  formula?: string;
  controlled_classes?: string[];
  shown_properties?: string[];
  extra?: Record<string, unknown>;
}

const KNOWN_WIRE_BASES = new Set([
  "MDC_P002_1",
  "MDC_P002_2",
  "MDC_P066",
  "MDC_P004",
  "MDC_P005",
  "MDC_P006",
  "MDC_P008",
  "MDC_P009",
  "MDC_P112",
  "MDC_P011",
  "MDC_P010",
  "MDC_P010_1",
  "MDC_P013",
  "MDC_P014",
  "MDC_P090",
  "MDC_P016",
  "MDC_P022",
  "MDC_P024",
  "MDC_P021",
  "MDC_P041",
  "MDC_P028",
  "MDC_P020",
  "MDC_P023",
  "MDC_P023_1",
  "MDC_P046",
  "MDC_P044",
  "MDC_P043",
  "MDC_P200",
  "MDC_P203",
  "MDC_P204",
  "EXT_P002",
  "EXT_P003",
]);

export function yamlEntityFromEntity(entity: Entity): YamlEntityData {
  const data: YamlEntityData = {
    irdi: entity.irdi?.toString() ?? null,
    type: entity.type ?? null,
    code: entity.code ?? null,
  };

  const guid = entity.get<string>(Pids.MDC_P066);
  if (guid) data.guid = String(guid);
  const version = entity.get<string>(Pids.MDC_P002_1);
  if (version) data.version = String(version);
  const revision = entity.get<string>(Pids.MDC_P002_2);
  if (revision) data.revision = String(revision);

  setMl(data, "preferred_name", extractMl(entity, Pids.MDC_P004));
  setMl(data, "short_name", extractMl(entity, Pids.MDC_P005));
  setMl(data, "definition", extractMl(entity, Pids.MDC_P006));
  setMl(data, "note", extractMl(entity, Pids.MDC_P008));
  setMl(data, "remark", extractMl(entity, Pids.MDC_P009));
  setMl(data, "description", extractMl(entity, Pids.MDC_P112));

  switch (entity.type) {
    case "class": {
      const k = entity as Klass;
      if (k.classType) data.class_type = String(k.classType);
      if (k.superclassIrdi) data.superclass = k.superclassIrdi.toString();
      if (k.isCaseOfIrdis.length > 0)
        data.is_case_of = k.isCaseOfIrdis.map((i) => i.toString());
      if (k.applicablePropertyIrdis.length > 0)
        data.applicable_properties = k.applicablePropertyIrdis.map((i) =>
          i.toString(),
        );
      if (k.importedPropertyIrdis.length > 0)
        data.imported_properties = k.importedPropertyIrdis.map((i) =>
          i.toString(),
        );
      if (k.subClassSelectionIrdis.length > 0)
        data.sub_class_selection = k.subClassSelectionIrdis.map((i) =>
          i.toString(),
        );
      break;
    }
    case "property": {
      const p = entity as Property;
      if (p.dataTypeRaw) data.data_type = p.dataTypeRaw;
      if (p.valueFormat) data.value_format = p.valueFormat;
      if (p.definitionClassIrdi)
        data.definition_class = p.definitionClassIrdi.toString();
      if (p.unitIrdi) data.unit = p.unitIrdi.toString();
      if (p.conditionRaw) data.condition = p.conditionRaw;
      if (p.dataElementType)
        data.property_data_element_type = String(p.dataElementType);
      break;
    }
    case "unit": {
      const u = entity as Unit;
      if (u.structure) data.unit_structure = u.structure;
      if (u.textRepresentation) data.unit_text = u.textRepresentation;
      break;
    }
    case "value_list": {
      const vl = entity as ValueList;
      if (vl.listType) data.list_type = vl.listType;
      if (vl.codeList.length > 0) data.code_list = vl.codeList;
      if (vl.termIrdis.length > 0)
        data.term_irdis = vl.termIrdis.map((i) => i.toString());
      break;
    }
    case "value_term": {
      const vt = entity as ValueTerm;
      if (vt.enumerationCode) data.enumeration_code = vt.enumerationCode;
      break;
    }
    case "relation": {
      const r = entity as Relation;
      if (r.relationType) data.relation_type = r.relationType;
      if (r.codomainIrdi) data.codomain = r.codomainIrdi.toString();
      if (r.formula) data.formula = r.formula;
      break;
    }
    case "view_control": {
      const vc = entity as ViewControl;
      if (vc.controlledClassIrdis.length > 0)
        data.controlled_classes = vc.controlledClassIrdis.map((i) =>
          i.toString(),
        );
      if (vc.shownPropertyIrdis.length > 0)
        data.shown_properties = vc.shownPropertyIrdis.map((i) => i.toString());
      break;
    }
  }

  const extra = extractExtra(entity);
  if (extra) data.extra = extra;

  return data;
}

export function entityFromYamlEntity(data: YamlEntityData): Entity {
  const props: Record<string, unknown> = {};

  if (data.guid) props[Pids.MDC_P066] = data.guid;
  if (data.version) props[Pids.MDC_P002_1] = data.version;
  if (data.revision) props[Pids.MDC_P002_2] = data.revision;

  mergeMl(props, Pids.MDC_P004, data.preferred_name);
  mergeMl(props, Pids.MDC_P005, data.short_name);
  mergeMl(props, Pids.MDC_P006, data.definition);
  mergeMl(props, Pids.MDC_P008, data.note);
  mergeMl(props, Pids.MDC_P009, data.remark);
  mergeMl(props, Pids.MDC_P112, data.description);

  if (data.class_type) props[Pids.MDC_P011] = data.class_type;
  if (data.superclass) props[Pids.MDC_P010] = data.superclass;
  if (data.is_case_of?.length) props[Pids.MDC_P013] = rejoin(data.is_case_of);
  if (data.applicable_properties?.length)
    props[Pids.MDC_P014] = rejoin(data.applicable_properties);
  if (data.imported_properties?.length)
    props[Pids.MDC_P090] = rejoin(data.imported_properties);
  if (data.sub_class_selection?.length)
    props[Pids.MDC_P016] = rejoin(data.sub_class_selection);

  if (data.data_type) props[Pids.MDC_P022] = data.data_type;
  if (data.value_format) props[Pids.MDC_P024] = data.value_format;
  if (data.definition_class) props[Pids.MDC_P021] = data.definition_class;
  if (data.unit) props[Pids.MDC_P041] = data.unit;
  if (data.condition) props[Pids.MDC_P028] = data.condition;
  if (data.property_data_element_type)
    props[Pids.MDC_P020] = data.property_data_element_type;

  if (data.unit_structure) props[Pids.MDC_P023] = data.unit_structure;
  if (data.unit_text) props[Pids.MDC_P023_1] = data.unit_text;

  if (data.list_type) props[Pids.MDC_P046] = data.list_type;
  if (data.code_list?.length) props[Pids.MDC_P044] = rejoin(data.code_list);
  if (data.term_irdis?.length) props[Pids.MDC_P043] = rejoin(data.term_irdis);

  if (data.enumeration_code) props[Pids.MDC_P044] = data.enumeration_code;

  if (data.relation_type) props[Pids.MDC_P200] = data.relation_type;
  if (data.codomain) props[Pids.MDC_P203] = data.codomain;
  if (data.formula) props[Pids.MDC_P204] = data.formula;

  if (data.controlled_classes?.length)
    props["EXT_P002"] = rejoin(data.controlled_classes);
  if (data.shown_properties?.length)
    props["EXT_P003"] = rejoin(data.shown_properties);

  if (data.extra) {
    for (const [k, v] of Object.entries(data.extra)) props[k] = v;
  }

  const type = (data.type ?? "class") as keyof typeof ENTITY_CONSTRUCTORS;
  const ctor = ENTITY_CONSTRUCTORS[type] ?? ENTITY_CONSTRUCTORS.MDC_C002;
  const irdi = data.irdi ? IRDI.parse(data.irdi) : null;
  return new ctor(
    irdi,
    props,
    type === "class" ? "MDC_C002" : metaClassForType(type),
  );
}

function metaClassForType(type: string): string {
  switch (type) {
    case "class":
      return "MDC_C002";
    case "property":
      return "MDC_C003";
    case "value_list":
      return "MDC_C005";
    case "unit":
      return "MDC_C009";
    case "value_term":
      return "MDC_C010";
    case "relation":
      return "MDC_C011";
    case "view_control":
      return "EXT_C001";
    default:
      return "MDC_C002";
  }
}

function extractMl(
  entity: Entity,
  pid: string,
): Record<string, string> | undefined {
  const result: Record<string, string> = {};
  entity.eachProperty((key, value) => {
    if (!key.startsWith(`${pid}.`)) return;
    const lang = key.slice(pid.length + 1);
    if (value !== undefined && value !== null) result[lang] = String(value);
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function mergeMl(
  props: Record<string, unknown>,
  pid: string,
  hash: Record<string, string> | undefined,
): void {
  if (!hash) return;
  for (const [lang, val] of Object.entries(hash)) props[`${pid}.${lang}`] = val;
}

function setMl(
  data: YamlEntityData,
  field: keyof YamlEntityData,
  value: Record<string, string> | undefined,
): void {
  if (value)
    (data as unknown as Record<string, unknown>)[field as string] = value;
}

function extractExtra(entity: Entity): Record<string, unknown> | undefined {
  const extra: Record<string, unknown> = {};
  entity.eachProperty((key, value) => {
    if (key === "__row_index__") return;
    const base = key.split(".", 1)[0];
    if (KNOWN_WIRE_BASES.has(base)) return;
    extra[key] = value;
  });
  return Object.keys(extra).length > 0 ? extra : undefined;
}
