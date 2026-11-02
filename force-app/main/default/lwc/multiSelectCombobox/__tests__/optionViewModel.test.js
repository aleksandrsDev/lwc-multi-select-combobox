import { buildOptionViews, optionId } from "../optionViewModel";

const OPTIONS = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
  { label: "Gamma", value: "c" }
];

const build = (overrides) =>
  buildOptionViews({
    options: OPTIONS,
    selectedValues: [],
    activeIndex: -1,
    maxSelections: undefined,
    ...overrides
  });

describe("buildOptionViews", () => {
  it("builds one view per option with a stable key and an index-based id", () => {
    const views = build();
    expect(views.map((view) => view.key)).toEqual(["a", "b", "c"]);
    expect(views.map((view) => view.id)).toEqual([
      optionId(0),
      optionId(1),
      optionId(2)
    ]);
  });

  it("marks selected options with aria-selected as a string", () => {
    const views = build({ selectedValues: ["b"] });
    expect(views.map((view) => view.ariaSelected)).toEqual([
      "false",
      "true",
      "false"
    ]);
    expect(views[1].selected).toBe(true);
  });

  it("marks only the option at the active index as active", () => {
    const views = build({ activeIndex: 2 });
    expect(views.map((view) => view.active)).toEqual([false, false, true]);
    expect(views[2].className).toContain("slds-has-focus");
  });

  it("disables unselected options once the limit is reached", () => {
    const views = build({ selectedValues: ["a", "b"], maxSelections: 2 });
    expect(views.map((view) => view.disabled)).toEqual([false, false, true]);
    expect(views[2].ariaDisabled).toBe("true");
  });

  it("keeps every option enabled below the limit", () => {
    const views = build({ selectedValues: ["a"], maxSelections: 2 });
    expect(views.every((view) => !view.disabled)).toBe(true);
  });

  it("returns [] when there are no options", () => {
    expect(build({ options: [] })).toEqual([]);
  });
});
