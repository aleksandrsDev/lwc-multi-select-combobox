import { createElement } from "@lwc/engine-dom";
import MultiSelectComboboxDemo from "c/multiSelectComboboxDemo";

function createDemo() {
  const element = createElement("c-multi-select-combobox-demo", {
    is: MultiSelectComboboxDemo
  });
  document.body.appendChild(element);
  return element;
}

const flush = () => Promise.resolve();
const getTile = (element, name) =>
  element.shadowRoot.querySelector(
    `c-multi-select-combobox[data-name="${name}"]`
  );

describe("c-multi-select-combobox-demo", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders one combobox per feature", () => {
    const element = createDemo();
    const names = [
      ...element.shadowRoot.querySelectorAll("c-multi-select-combobox")
    ].map((combobox) => combobox.dataset.name);

    expect(names).toEqual([
      "pills",
      "textFew",
      "textMany",
      "required",
      "disabled",
      "limit"
    ]);
  });

  it("configures each tile for the feature it shows", () => {
    const element = createDemo();

    expect(getTile(element, "textFew").selectionDisplay).toBe("text");
    expect(getTile(element, "limit").maxSelections).toBe(2);
    expect(getTile(element, "limit").value).toHaveLength(2);
    expect(getTile(element, "disabled").disabled).toBe(true);
  });

  it("shows the required error without user interaction", async () => {
    const element = createDemo();
    await flush();

    const required = getTile(element, "required");
    expect(required.validity.valueMissing).toBe(true);
    expect(
      required.shadowRoot.querySelector(".slds-form-element__help").textContent
    ).toContain("Complete this field.");
  });

  it("updates only the tile that changed", async () => {
    const element = createDemo();
    const pillsBefore = getTile(element, "pills").value;

    getTile(element, "required").dispatchEvent(
      new CustomEvent("change", {
        detail: { value: ["Banking"], selectedOptions: [] }
      })
    );
    await flush();

    expect(getTile(element, "required").value).toEqual(["Banking"]);
    expect(getTile(element, "pills").value).toEqual(pillsBefore);
  });
});
