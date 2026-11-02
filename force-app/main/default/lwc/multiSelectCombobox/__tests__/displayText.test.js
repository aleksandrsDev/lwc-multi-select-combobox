import {
  MAX_LABELS_IN_SUMMARY,
  normalizeSelectionDisplay,
  SELECTION_DISPLAY,
  selectionCountText,
  summaryText
} from "../displayText";

const options = (count) =>
  Array.from({ length: count }, (_, index) => ({
    label: `L${index + 1}`,
    value: `v${index}`
  }));

const TEMPLATES = {
  singular: "{0} option selected",
  plural: "{0} options selected"
};

describe("displayText", () => {
  describe("normalizeSelectionDisplay", () => {
    it.each([
      ["text", SELECTION_DISPLAY.TEXT],
      ["pills", SELECTION_DISPLAY.PILLS],
      ["TEXT", SELECTION_DISPLAY.PILLS],
      ["unknown", SELECTION_DISPLAY.PILLS],
      [undefined, SELECTION_DISPLAY.PILLS]
    ])("%p -> %p", (input, expected) => {
      expect(normalizeSelectionDisplay(input)).toBe(expected);
    });
  });

  describe("selectionCountText", () => {
    it("is empty for zero", () => {
      expect(selectionCountText(0, TEMPLATES)).toBe("");
    });

    it("uses the singular template for one", () => {
      expect(selectionCountText(1, TEMPLATES)).toBe("1 option selected");
    });

    it.each([2, 5, 100])("uses the plural template for %p", (count) => {
      expect(selectionCountText(count, TEMPLATES)).toBe(
        `${count} options selected`
      );
    });
  });

  describe("summaryText", () => {
    it("is empty when nothing is selected", () => {
      expect(summaryText([], TEMPLATES)).toBe("");
    });

    it("shows a single label as is", () => {
      expect(summaryText(options(1), TEMPLATES)).toBe("L1");
    });

    it("joins labels with a comma up to the threshold", () => {
      expect(summaryText(options(MAX_LABELS_IN_SUMMARY), TEMPLATES)).toBe(
        "L1, L2, L3"
      );
    });

    it("switches to the count above the threshold", () => {
      expect(summaryText(options(MAX_LABELS_IN_SUMMARY + 1), TEMPLATES)).toBe(
        "4 options selected"
      );
    });
  });
});
