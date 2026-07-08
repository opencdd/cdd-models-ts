import { describe, expect, it } from "vitest";
import * as Models from "../src/index";

describe("package public surface", () => {
  it("exports the value-object classes", () => {
    expect(typeof Models.Klass).toBe("function");
    expect(typeof Models.Property).toBe("function");
    expect(typeof Models.Unit).toBe("function");
    expect(typeof Models.ValueList).toBe("function");
    expect(typeof Models.ValueTerm).toBe("function");
    expect(typeof Models.Relation).toBe("function");
    expect(typeof Models.ViewControl).toBe("function");
  });

  it("exports the Database class", () => {
    expect(typeof Models.Database).toBe("function");
  });

  it("exports IRDI helpers", () => {
    expect(typeof Models.IRDI).toBe("function");
  });

  it("exports tree walkers", () => {
    expect(typeof Models.ClassTree).toBe("function");
    expect(typeof Models.EffectiveProperties).toBe("function");
  });

  it("exports the validators namespace", () => {
    expect(Models.Validators).toBeDefined();
    expect(typeof Models.Validators.runValidation).toBe("function");
    expect(Models.Validators.allRules).toBeDefined();
  });

  it("exports CDDAL parser pieces", () => {
    expect(typeof Models.Lexer).toBe("function");
    expect(typeof Models.Parser).toBe("function");
  });

  it("exports the Parcel sheet schema", () => {
    expect(typeof Models.ParcelMetadata).toBe("function");
    expect(typeof Models.SheetSchema).toBe("function");
  });

  it("exports the exporters", () => {
    expect(typeof Models.JsonExporter).toBe("function");
    expect(typeof Models.YamlExporter).toBe("function");
    expect(typeof Models.MermaidExporter).toBe("function");
    expect(typeof Models.CsvWriter).toBe("function");
  });

  it("can construct a Database and finalize it without error", () => {
    const klass = new Models.Klass({
      irdi: "0112/2///61360_4#AAA001",
      code: "AAA001",
      preferredName: "Test class",
    });
    const db = new Models.Database();
    db.addEntity(klass);
    expect(() => db.finalize()).not.toThrow();
  });
});
