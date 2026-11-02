import {
  addValues,
  haveSameValues,
  isAtLimit,
  normalizeLimit,
  normalizeOptions,
  normalizeValues,
  removeValues,
  resolveSelectedOptions,
  toggleValue
} from "../selectionModel";

const OPTIONS = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
  { label: "Gamma", value: "c" }
];

describe("selectionModel", () => {
  describe("normalizeValues", () => {
    it.each([undefined, null, "a;b", 42, {}])(
      "returns [] for non-array input %p",
      (input) => {
        expect(normalizeValues(input)).toEqual([]);
      }
    );

    it("converts entries to strings and drops null/undefined", () => {
      expect(normalizeValues([1, null, "b", undefined])).toEqual(["1", "b"]);
    });

    it("removes duplicates and keeps the first occurrence order", () => {
      expect(normalizeValues(["b", "a", "b"])).toEqual(["b", "a"]);
    });

    it("returns a new array", () => {
      const input = ["a"];
      expect(normalizeValues(input)).not.toBe(input);
    });
  });

  describe("normalizeOptions", () => {
    it("returns [] for non-array input", () => {
      expect(normalizeOptions(undefined)).toEqual([]);
    });

    it("drops entries without a value", () => {
      expect(
        normalizeOptions([
          { label: "No value" },
          null,
          { label: "Ok", value: "ok" }
        ])
      ).toEqual([{ label: "Ok", value: "ok" }]);
    });

    it("falls back to the value when the label is missing and stringifies both", () => {
      expect(normalizeOptions([{ value: 1 }, { label: 2, value: 3 }])).toEqual([
        { label: "1", value: "1" },
        { label: "2", value: "3" }
      ]);
    });

    it("copies options so the caller can freeze or mutate its own objects", () => {
      const source = [{ label: "A", value: "a", extra: true }];
      const result = normalizeOptions(source);
      expect(result[0]).not.toBe(source[0]);
      expect(result[0]).toEqual({ label: "A", value: "a" });
    });
  });

  describe("normalizeLimit", () => {
    it.each([
      [3, 3],
      ["2", 2],
      [0, undefined],
      [-1, undefined],
      [1.5, undefined],
      ["abc", undefined],
      [undefined, undefined],
      [null, undefined]
    ])("normalizes %p to %p", (input, expected) => {
      expect(normalizeLimit(input)).toBe(expected);
    });
  });

  describe("isAtLimit", () => {
    it("is never at the limit without a limit", () => {
      expect(isAtLimit(["a", "b", "c"], undefined)).toBe(false);
    });

    it.each([
      [["a"], 2, false],
      [["a", "b"], 2, true],
      [["a", "b", "c"], 2, true]
    ])("selection %p with limit %p -> %p", (selected, limit, expected) => {
      expect(isAtLimit(selected, limit)).toBe(expected);
    });
  });

  describe("toggleValue", () => {
    it("adds an unselected value at the end", () => {
      expect(toggleValue(["b"], "a")).toEqual(["b", "a"]);
    });

    it("removes a selected value", () => {
      expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
    });

    it("does not add beyond the limit", () => {
      expect(toggleValue(["a", "b"], "c", 2)).toEqual(["a", "b"]);
    });

    it("still removes a value at the limit", () => {
      expect(toggleValue(["a", "b"], "b", 2)).toEqual(["a"]);
    });

    it("does not mutate the input", () => {
      const selected = ["a"];
      toggleValue(selected, "b");
      expect(selected).toEqual(["a"]);
    });
  });

  describe("addValues", () => {
    it("appends only values that are not selected yet", () => {
      expect(addValues(["a"], ["a", "b", "c"])).toEqual(["a", "b", "c"]);
    });

    it("stops at the limit, keeping the order of the input", () => {
      expect(addValues(["a"], ["b", "c", "d"], 3)).toEqual(["a", "b", "c"]);
    });

    it("adds nothing when already over the limit", () => {
      expect(addValues(["a", "b", "c"], ["d"], 2)).toEqual(["a", "b", "c"]);
    });
  });

  describe("removeValues", () => {
    it("removes the given values and ignores unknown ones", () => {
      expect(removeValues(["a", "b", "c"], ["b", "x"])).toEqual(["a", "c"]);
    });
  });

  describe("resolveSelectedOptions", () => {
    it("returns selected options in option order, not selection order", () => {
      expect(resolveSelectedOptions(OPTIONS, ["c", "a"])).toEqual([
        { label: "Alpha", value: "a" },
        { label: "Gamma", value: "c" }
      ]);
    });

    it("skips selected values that match no option", () => {
      expect(resolveSelectedOptions(OPTIONS, ["unknown", "b"])).toEqual([
        { label: "Beta", value: "b" }
      ]);
    });

    it("returns copies, not the option objects", () => {
      expect(resolveSelectedOptions(OPTIONS, ["a"])[0]).not.toBe(OPTIONS[0]);
    });
  });

  describe("haveSameValues", () => {
    it.each([
      [[], [], true],
      [["a", "b"], ["a", "b"], true],
      [["a", "b"], ["b", "a"], false],
      [["a"], ["a", "b"], false]
    ])("%p vs %p -> %p", (first, second, expected) => {
      expect(haveSameValues(first, second)).toBe(expected);
    });
  });
});
