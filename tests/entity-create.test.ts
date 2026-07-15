import { describe, expect, it } from "vitest";
import { Klass, Property, IRDI } from "../src";

describe("Entity.create options-bag factory", () => {
  it("constructs a Klass from an options bag", () => {
    const klass = Klass.create({
      irdi: "0112/2///61360_4#AAA001",
      properties: { "MDC_P004.en": "Vehicle" },
      metaClassIrdi: "MDC_C002",
    });
    expect(klass).toBeInstanceOf(Klass);
    expect(klass.irdi?.toString()).toBe("0112/2///61360_4#AAA001");
    expect(klass.preferredName("en")).toBe("Vehicle");
    expect(klass.type).toBe("class");
  });

  it("constructs a Property from an options bag", () => {
    const prop = Property.create({
      irdi: "0112/2///61360_4#AAAP001",
      properties: { "MDC_P004.en": "vehicle length" },
      metaClassIrdi: "MDC_C003",
    });
    expect(prop).toBeInstanceOf(Property);
    expect(prop.type).toBe("property");
  });

  it("accepts an IRDI instance", () => {
    const irdi = IRDI.parse("0112/2///61360_4#AAA001");
    const klass = Klass.create({ irdi, metaClassIrdi: "MDC_C002" });
    expect(klass.irdi?.equals(irdi!)).toBe(true);
  });

  it("defaults irdi to null when omitted", () => {
    const klass = Klass.create({ metaClassIrdi: "MDC_C002" });
    expect(klass.irdi).toBeNull();
  });

  it("defaults properties to empty when omitted", () => {
    const klass = Klass.create({
      irdi: "0112/2///61360_4#AAA001",
      metaClassIrdi: "MDC_C002",
    });
    expect(klass.properties.size).toBe(0);
  });
});
