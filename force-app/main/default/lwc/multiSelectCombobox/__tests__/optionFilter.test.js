import { filterOptions } from "../optionFilter";

const OPTIONS = [
  { label: "Banking", value: "banking" },
  { label: "Energy", value: "energy" },
  { label: "Retail Banking", value: "retail" }
];

describe("filterOptions", () => {
  it.each(["", "   ", undefined, null])(
    "returns every option for a blank term %p",
    (term) => {
      expect(filterOptions(OPTIONS, term)).toBe(OPTIONS);
    }
  );

  it("matches anywhere in the label, ignoring case", () => {
    expect(
      filterOptions(OPTIONS, "BANK").map((option) => option.value)
    ).toEqual(["banking", "retail"]);
  });

  it("ignores surrounding spaces in the term", () => {
    expect(
      filterOptions(OPTIONS, "  energy ").map((option) => option.value)
    ).toEqual(["energy"]);
  });

  it("matches on the label, not the value", () => {
    expect(filterOptions(OPTIONS, "retail banking")).toHaveLength(1);
    expect(
      filterOptions([{ label: "Shown", value: "hidden" }], "hidden")
    ).toEqual([]);
  });

  it("returns [] when nothing matches", () => {
    expect(filterOptions(OPTIONS, "zzz")).toEqual([]);
  });
});
