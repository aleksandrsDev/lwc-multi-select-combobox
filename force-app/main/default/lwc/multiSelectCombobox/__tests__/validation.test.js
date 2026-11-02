import { computeValidity, errorMessageFor } from "../validation";

const baseState = {
  disabled: false,
  required: false,
  selectedCount: 0,
  maxSelections: undefined,
  customMessage: ""
};

const MESSAGES = {
  customMessage: "Custom problem",
  valueMissing: "Required!",
  rangeOverflow: "At most {0}"
};

describe("validation", () => {
  describe("computeValidity", () => {
    it("is valid by default", () => {
      expect(computeValidity(baseState)).toEqual({
        valid: true,
        valueMissing: false,
        rangeOverflow: false,
        customError: false
      });
    });

    it("flags valueMissing when required and nothing is selected", () => {
      const validity = computeValidity({ ...baseState, required: true });
      expect(validity.valueMissing).toBe(true);
      expect(validity.valid).toBe(false);
    });

    it("is valid when required and something is selected", () => {
      expect(
        computeValidity({ ...baseState, required: true, selectedCount: 1 })
          .valid
      ).toBe(true);
    });

    it.each([
      [1, false],
      [2, false],
      [3, true]
    ])(
      "with limit 2, %p selected -> rangeOverflow %p",
      (selectedCount, overflow) => {
        const validity = computeValidity({
          ...baseState,
          selectedCount,
          maxSelections: 2
        });
        expect(validity.rangeOverflow).toBe(overflow);
        expect(validity.valid).toBe(!overflow);
      }
    );

    it("flags customError when a custom message is set", () => {
      const validity = computeValidity({ ...baseState, customMessage: "x" });
      expect(validity.customError).toBe(true);
      expect(validity.valid).toBe(false);
    });

    it("is always valid when disabled", () => {
      const validity = computeValidity({
        ...baseState,
        disabled: true,
        required: true,
        selectedCount: 5,
        maxSelections: 1,
        customMessage: "x"
      });
      expect(validity.valid).toBe(true);
    });

    it("reports several failures at once", () => {
      const validity = computeValidity({
        ...baseState,
        selectedCount: 3,
        maxSelections: 1,
        customMessage: "x"
      });
      expect(validity).toMatchObject({
        rangeOverflow: true,
        customError: true,
        valid: false
      });
    });
  });

  describe("errorMessageFor", () => {
    it("returns an empty string when valid", () => {
      expect(errorMessageFor(computeValidity(baseState), MESSAGES)).toBe("");
    });

    it("prefers the custom message over other failures", () => {
      const validity = {
        valid: false,
        valueMissing: true,
        rangeOverflow: true,
        customError: true
      };
      expect(errorMessageFor(validity, MESSAGES, 2)).toBe("Custom problem");
    });

    it("prefers valueMissing over rangeOverflow", () => {
      const validity = {
        valid: false,
        valueMissing: true,
        rangeOverflow: true,
        customError: false
      };
      expect(errorMessageFor(validity, MESSAGES, 2)).toBe("Required!");
    });

    it("formats the range overflow message with the limit", () => {
      const validity = {
        valid: false,
        valueMissing: false,
        rangeOverflow: true,
        customError: false
      };
      expect(errorMessageFor(validity, MESSAGES, 2)).toBe("At most 2");
    });
  });
});
