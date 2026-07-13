/**
 * YamlDatabase — single-document database YAML serialization.
 *
 * Ported from Ruby's Opencdd::Model::YamlDatabase
 * (lib/opencdd/model/yaml_database.rb). Wraps a collection of
 * YamlEntity records with dictionary-level metadata (source language,
 * translation languages).
 *
 *   ---
 *   source_language: en
 *   translation_languages:
 *     - fr
 *     - ja
 *   entities:
 *     - irdi: 0112/2///61360_4#AAA001
 *       type: class
 *       code: AAA001
 *       preferred_name:
 *         en: Vehicle
 *       ...
 *
 * Uses the `yaml` npm package (eemeli/yaml) — browser-compatible.
 */

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { Database } from "../models/Database";
import {
  yamlEntityFromEntity,
  entityFromYamlEntity,
  type YamlEntityData,
} from "./YamlEntity";

export interface YamlDatabaseData {
  source_language: string;
  translation_languages: string[];
  entities: YamlEntityData[];
}

export function databaseToYaml(db: Database): string {
  const data: YamlDatabaseData = {
    source_language: "en",
    translation_languages: [],
    entities: db.entities().map(yamlEntityFromEntity),
  };
  return stringifyYaml(data);
}

export function databaseFromYaml(yaml: string, base?: Database): Database {
  const data = parseYaml(yaml) as YamlDatabaseData | null;
  const db = base ?? new Database();
  if (data && Array.isArray(data.entities)) {
    for (const ye of data.entities) {
      db.addEntity(entityFromYamlEntity(ye));
    }
  }
  db.finalize();
  return db;
}
