import { createElement } from "@lwc/engine-dom";
import MultiSelectComboboxSelection from "c/multiSelectComboboxSelection";

const SELECTED = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" }
];

function createSelection(props = {}) {
  const element = createElement("c-multi-select-combobox-selection", {
    is: MultiSelectComboboxSelection
  });
  Object.assign(element, {
    label: "Selected options",
    selectedOptions: SELECTED,
    ...props
  });
  document.body.appendChild(element);
  return element;
}

const getPillContainer = (element) =>
  element.shadowRoot.querySelector("lightning-pill-container");
const getReadOnlyPills = (element) =>
  element.shadowRoot.querySelector('[data-id="read-only-pills"]');

function removePill(element, index) {
  getPillContainer(element).dispatchEvent(
    new CustomEvent("itemremove", {
      detail: { item: getPillContainer(element).items[index], index }
    })
  );
}

describe("c-multi-select-combobox-selection", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("maps selected options to pill items", () => {
    const element = createSelection();
    const container = getPillContainer(element);

    expect(container.items).toEqual([
      { label: "Alpha", name: "a" },
      { label: "Beta", name: "b" }
    ]);
    expect(container.label).toBe("Selected options");
  });

  it("reports the removed option by value", () => {
    const element = createSelection();
    const handler = jest.fn();
    element.addEventListener("remove", handler);

    removePill(element, 1);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ value: "b" });
  });

  it("ignores a remove event for an index that no longer exists", () => {
    const element = createSelection();
    const handler = jest.fn();
    element.addEventListener("remove", handler);

    getPillContainer(element).dispatchEvent(
      new CustomEvent("itemremove", { detail: { index: 5 } })
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not remove anything itself", () => {
    const element = createSelection();
    removePill(element, 0);

    expect(element.selectedOptions).toEqual(SELECTED);
  });

  it("renders read-only pills without a remove action when disabled", () => {
    const element = createSelection({ disabled: true });

    expect(getPillContainer(element)).toBeNull();
    const labels = [
      ...getReadOnlyPills(element).querySelectorAll(".slds-pill__label")
    ].map((label) => label.textContent);
    expect(labels).toEqual(["Alpha", "Beta"]);
    // Read-only pills have no remove button, so the label needs its own right-hand spacing.
    getReadOnlyPills(element)
      .querySelectorAll(".slds-pill__label")
      .forEach((label) =>
        expect(label.classList).toContain("slds-p-right_x-small")
      );
    expect(getReadOnlyPills(element).getAttribute("aria-label")).toBe(
      "Selected options"
    );
  });

  it("treats a non-array selection as empty", () => {
    const element = createSelection({ selectedOptions: undefined });
    expect(getPillContainer(element).items).toEqual([]);
  });

  it("is accessible in both modes", async () => {
    await expect(createSelection()).toBeAccessible();
    await expect(createSelection({ disabled: true })).toBeAccessible();
  });
});
