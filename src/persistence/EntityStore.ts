/**
 * EntityStore — per-entity YAML persistence in a sharded directory.
 *
 * Ported from Ruby's Opencdd::Model::EntityStore
 * (lib/opencdd/model/entity_store.rb). Each entity is stored as a
 * single YAML file in a sharded layout keyed by the first two chars
 * of the entity's code (or IRDI suffix). Diff-friendly at the entity
 * level — one git diff shows exactly which entity changed.
 *
 *   <path>/
 *   └── entities/
 *       ├── AA/
 *       │   ├── AAA001.yaml
 *       │   └── AAA010.yaml
 *       └── ...
 *
 * Node-only: uses node:fs/promises via dynamic import. In a browser
 * bundle, these functions throw at call time.
 */

import { stringify as stringifyYaml, parse as parseYaml } from "yaml";
import { Database } from "../models/Database";
import { Entity } from "../models/Entity";
import {
  yamlEntityFromEntity,
  entityFromYamlEntity,
  type YamlEntityData,
} from "./YamlEntity";

export async function saveToDirectory(
  db: Database,
  path: string,
): Promise<void> {
  const { mkdir, writeFile, readdir, rm } = await import("node:fs/promises");
  const entitiesDir = `${path}/entities`;
  await mkdir(entitiesDir, { recursive: true });
  await rm(entitiesDir, { recursive: true, force: true }).catch(
    () => undefined,
  );
  await mkdir(entitiesDir, { recursive: true });
  for (const entity of db.entities()) {
    const key = safeKey(entity);
    if (!key) continue;
    const shard = key.slice(0, 2).toUpperCase() || "_";
    const shardDir = `${entitiesDir}/${shard}`;
    await mkdir(shardDir, { recursive: true });
    const data = yamlEntityFromEntity(entity);
    await writeFile(`${shardDir}/${key}.yaml`, stringifyYaml(data), "utf8");
  }
}

export async function loadFromDirectory(path: string): Promise<Database> {
  const { readdir, readFile } = await import("node:fs/promises");
  const db = new Database();
  const entitiesDir = `${path}/entities`;
  let shards: string[];
  try {
    shards = await readdir(entitiesDir, { withFileTypes: true }).then(
      (entries) => entries.filter((e) => e.isDirectory()).map((e) => e.name),
    );
  } catch {
    return db;
  }
  for (const shard of shards) {
    const files = await readdir(`${entitiesDir}/${shard}`);
    for (const file of files) {
      if (!file.endsWith(".yaml")) continue;
      const raw = await readFile(`${entitiesDir}/${shard}/${file}`, "utf8");
      try {
        const data = parseYaml(raw) as YamlEntityData;
        db.addEntity(entityFromYamlEntity(data));
      } catch (err) {
        console.warn(
          `EntityStore: skipping ${shard}/${file}: ${(err as Error).message}`,
        );
      }
    }
  }
  db.finalize();
  return db;
}

function safeKey(entity: Entity): string | null {
  const code = entity.code ?? entity.irdi?.code;
  if (code && code.trim().length > 0) return sanitize(code);
  if (entity.irdi) return sanitize(entity.irdi.toString());
  return null;
}

function sanitize(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, "_");
}
