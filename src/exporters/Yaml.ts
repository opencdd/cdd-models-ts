/**
 * YAML exporter for CDD databases.
 *
 * Ported from Cdd::Exporters::Yaml (lib/cdd/exporters/yaml.rb). Builds the
 * same node list as JsonExporter and serializes as YAML 1.1 / 1.2 plain
 * text. We ship a minimal inline YAML emitter rather than pulling in a
 * runtime dependency — the node shapes are flat arrays of records with
 * scalar and string-array leaves, so a full YAML library is overkill.
 *
 * Unlike Ruby's Psych, this emitter uses string keys (not Symbol keys).
 * Callers in TS consume the output via a YAML parser that returns string
 * keys, which is the conventional shape in the JS ecosystem.
 */

import { Database } from "../models/Database";
import { JsonExporter, type JsonNode } from "./Json";
import { emitYaml } from "./yamlEmitter";

export class YamlExporter {
  private readonly json = new JsonExporter();

  toYAML(database: Database): string {
    const nodes = this.json.buildNodes(database);
    return emitYaml(nodes);
  }

  buildNodes(database: Database): JsonNode[] {
    return this.json.buildNodes(database);
  }
}
