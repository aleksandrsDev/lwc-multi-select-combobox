import {
  comboboxClass,
  formElementClass,
  labelClass,
  normalizeVariant,
  optionClass,
  VARIANT
} from "../styleClasses";

const classList = (classes) => classes.split(" ");

describe("styleClasses", () => {
  describe("normalizeVariant", () => {
    it.each(Object.values(VARIANT))("keeps the valid variant %p", (variant) => {
      expect(normalizeVariant(variant)).toBe(variant);
    });

    it.each(["bogus", undefined, null])(
      "falls back to standard for %p",
      (variant) => {
        expect(normalizeVariant(variant)).toBe(VARIANT.STANDARD);
      }
    );
  });

  describe("formElementClass", () => {
    it("is a plain form element for the standard variant", () => {
      expect(formElementClass(VARIANT.STANDARD, false)).toBe(
        "slds-form-element"
      );
    });

    it.each([
      [VARIANT.LABEL_INLINE, "slds-form-element_horizontal"],
      [VARIANT.LABEL_STACKED, "slds-form-element_stacked"]
    ])("adds the layout class for %p", (variant, expected) => {
      expect(classList(formElementClass(variant, false))).toContain(expected);
    });

    it("adds the error class when there is an error", () => {
      expect(classList(formElementClass(VARIANT.STANDARD, true))).toContain(
        "slds-has-error"
      );
    });
  });

  describe("labelClass", () => {
    it("hides the label visually for label-hidden", () => {
      expect(classList(labelClass(VARIANT.LABEL_HIDDEN))).toContain(
        "slds-assistive-text"
      );
    });

    it("keeps the label visible otherwise", () => {
      expect(classList(labelClass(VARIANT.STANDARD))).not.toContain(
        "slds-assistive-text"
      );
    });
  });

  describe("comboboxClass", () => {
    it("marks the combobox open only when open", () => {
      expect(classList(comboboxClass(true))).toContain("slds-is-open");
      expect(classList(comboboxClass(false))).not.toContain("slds-is-open");
    });
  });

  describe("optionClass", () => {
    it("reflects each state with its SLDS class", () => {
      const classes = classList(
        optionClass({ selected: true, active: true, disabled: true })
      );
      expect(classes).toEqual(
        expect.arrayContaining([
          "slds-listbox__option",
          "slds-is-selected",
          "slds-has-focus",
          "slds-text-color_weak"
        ])
      );
    });

    it("has no state classes for a plain option", () => {
      const classes = classList(
        optionClass({ selected: false, active: false, disabled: false })
      );
      expect(classes).not.toEqual(expect.arrayContaining(["slds-is-selected"]));
      expect(classes).not.toContain("slds-has-focus");
      expect(classes).not.toContain("slds-text-color_weak");
    });
  });
});
