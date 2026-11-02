import { formatLabel } from "../formatLabel";

describe("formatLabel", () => {
  it("replaces numbered placeholders with arguments", () => {
    expect(formatLabel("{0} of {1}", 2, 5)).toBe("2 of 5");
  });

  it("replaces repeated placeholders", () => {
    expect(formatLabel("{0}-{0}", "x")).toBe("x-x");
  });

  it("leaves placeholders without an argument untouched", () => {
    expect(formatLabel("{0} and {1}", "a")).toBe("a and {1}");
  });

  it("returns an empty string for a missing template", () => {
    expect(formatLabel(undefined, 1)).toBe("");
  });

  it("returns the template unchanged when it has no placeholders", () => {
    expect(formatLabel("plain text", 1)).toBe("plain text");
  });
});
