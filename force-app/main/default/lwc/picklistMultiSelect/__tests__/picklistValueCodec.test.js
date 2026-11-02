import {
  formatPicklistValue,
  parsePicklistValue,
  resolveFieldReference,
  toComboboxOptions
} from "../picklistValueCodec";

describe("picklistValueCodec", () => {
  describe("parsePicklistValue", () => {
    it("splits on semicolons", () => {
      expect(parsePicklistValue("Banking;Energy")).toEqual([
        "Banking",
        "Energy"
      ]);
    });

    it("trims entries and drops blanks", () => {
      expect(parsePicklistValue(" Banking ;; Energy;")).toEqual([
        "Banking",
        "Energy"
      ]);
    });

    it.each([undefined, null, "", ["Banking"], 5])(
      "returns [] for %p",
      (value) => {
        expect(parsePicklistValue(value)).toEqual([]);
      }
    );
  });

  describe("formatPicklistValue", () => {
    it("joins with semicolons", () => {
      expect(formatPicklistValue(["Banking", "Energy"])).toBe("Banking;Energy");
    });

    it("returns an empty string for no values", () => {
      expect(formatPicklistValue([])).toBe("");
    });

    it("round-trips with parsePicklistValue", () => {
      expect(parsePicklistValue(formatPicklistValue(["A", "B", "C"]))).toEqual([
        "A",
        "B",
        "C"
      ]);
    });
  });

  describe("resolveFieldReference", () => {
    it("qualifies a bare field with the object", () => {
      expect(resolveFieldReference("Account", "Industry")).toEqual({
        objectApiName: "Account",
        qualifiedFieldApiName: "Account.Industry"
      });
    });

    it("keeps a qualified field and derives the object from it", () => {
      expect(resolveFieldReference(undefined, "Account.Industry")).toEqual({
        objectApiName: "Account",
        qualifiedFieldApiName: "Account.Industry"
      });
    });

    it("prefers the explicit object for the record type lookup", () => {
      expect(
        resolveFieldReference("Lead", "Account.Industry").objectApiName
      ).toBe("Lead");
    });

    it("cannot qualify a bare field without an object", () => {
      expect(
        resolveFieldReference(undefined, "Industry").qualifiedFieldApiName
      ).toBeUndefined();
    });

    it("has no field without a field name", () => {
      expect(resolveFieldReference("Account", undefined)).toEqual({
        objectApiName: "Account",
        qualifiedFieldApiName: undefined
      });
    });
  });

  describe("toComboboxOptions", () => {
    it("keeps only label and value", () => {
      const data = {
        values: [
          { label: "Banking", value: "Banking", attributes: null, validFor: [] }
        ]
      };
      expect(toComboboxOptions(data)).toEqual([
        { label: "Banking", value: "Banking" }
      ]);
    });

    it.each([undefined, null, {}])("returns [] for %p", (data) => {
      expect(toComboboxOptions(data)).toEqual([]);
    });
  });
});
