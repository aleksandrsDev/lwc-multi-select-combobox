import { createElement } from "@lwc/engine-dom";
import MultiSelectCombobox from "c/multiSelectCombobox";

const OPTIONS = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
  { label: "Gamma", value: "c" },
  { label: "Delta", value: "d" },
  { label: "Epsilon", value: "e" }
];

// ----- Helpers -----

function createCombobox(props = {}) {
  const element = createElement("c-multi-select-combobox", {
    is: MultiSelectCombobox
  });
  Object.assign(element, { label: "Industries", options: OPTIONS, ...props });
  document.body.appendChild(element);
  return element;
}

const flush = () => Promise.resolve();
const query = (element, selector) => element.shadowRoot.querySelector(selector);
const queryAll = (element, selector) => [
  ...element.shadowRoot.querySelectorAll(selector)
];
const getInput = (element) => query(element, "input");
const getOptions = (element) =>
  queryAll(element, '[role="option"][data-value]');
const getOption = (element, value) =>
  query(element, `[role="option"][data-value="${value}"]`);
const getSelection = (element) =>
  query(element, "c-multi-select-combobox-selection");
const getErrorMessage = (element) => query(element, ".slds-form-element__help");
const isOpen = (element) =>
  getInput(element).getAttribute("aria-expanded") === "true";
const activeOption = (element) =>
  query(element, '[role="option"].slds-has-focus');

async function openDropdown(element) {
  getInput(element).click();
  await flush();
}

// ArrowDown opens a closed combobox and highlights the first option.
const openWithKeyboard = (element) => pressKey(element, "ArrowDown");

async function pressKey(element, key) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true
  });
  getInput(element).dispatchEvent(event);
  await flush();
  return event;
}

async function typeSearch(element, text) {
  const input = getInput(element);
  input.value = text;
  input.dispatchEvent(new CustomEvent("input", { bubbles: true }));
  await flush();
}

async function focusOut(element, relatedTarget = null) {
  getInput(element).dispatchEvent(
    new FocusEvent("focusout", { bubbles: true, composed: true, relatedTarget })
  );
  await flush();
}

async function clickOption(element, value) {
  getOption(element, value).click();
  await flush();
}

function listenForChange(element) {
  const handler = jest.fn();
  element.addEventListener("change", handler);
  return handler;
}

const lastChangeDetail = (handler) => handler.mock.calls.at(-1)[0].detail;

describe("c-multi-select-combobox", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the label linked to the input and a closed combobox", () => {
      const element = createCombobox();
      const label = query(element, "label");

      expect(label.textContent).toContain("Industries");
      expect(label.getAttribute("for")).toBe(getInput(element).id);
      expect(getInput(element).getAttribute("role")).toBe("combobox");
      expect(isOpen(element)).toBe(false);
    });

    it("has no placeholder unless the parent sets one", async () => {
      const element = createCombobox();
      expect(getInput(element).placeholder).toBe("");

      element.placeholder = "Pick industries";
      await flush();
      expect(getInput(element).placeholder).toBe("Pick industries");
    });

    it("restores the parent placeholder after the search placeholder", async () => {
      const element = createCombobox({ placeholder: "Pick industries" });
      await openDropdown(element);
      expect(getInput(element).placeholder).toBe("Search...");

      await pressKey(element, "Escape");
      expect(getInput(element).placeholder).toBe("Pick industries");
    });

    it("hides the label visually but keeps it for assistive technology with label-hidden", () => {
      const element = createCombobox({ variant: "label-hidden" });
      expect(query(element, "label").classList).toContain(
        "slds-assistive-text"
      );
    });

    it.each([
      ["label-inline", "slds-form-element_horizontal"],
      ["label-stacked", "slds-form-element_stacked"]
    ])("applies the %p layout", (variant, expectedClass) => {
      const element = createCombobox({ variant });
      expect(query(element, ".slds-form-element").classList).toContain(
        expectedClass
      );
    });

    it("falls back to the standard variant for an unknown value", () => {
      const element = createCombobox({ variant: "fancy" });
      expect(element.variant).toBe("standard");
    });

    it("shows the required marker only when required", async () => {
      const element = createCombobox();
      expect(query(element, "abbr.slds-required")).toBeNull();

      element.required = true;
      await flush();
      expect(query(element, "abbr.slds-required")).not.toBeNull();
      expect(getInput(element).getAttribute("aria-required")).toBe("true");
    });

    it("renders field-level help only when provided", async () => {
      const element = createCombobox();
      expect(query(element, "lightning-helptext")).toBeNull();

      element.fieldLevelHelp = "Pick all that apply";
      await flush();
      expect(query(element, "lightning-helptext").content).toBe(
        "Pick all that apply"
      );
    });

    it("renders a check icon only on selected options", async () => {
      const element = createCombobox({ value: ["b"] });
      await openDropdown(element);

      expect(
        getOption(element, "b").querySelector("lightning-icon")
      ).not.toBeNull();
      expect(
        getOption(element, "a").querySelector("lightning-icon")
      ).toBeNull();
    });

    it("shows an empty-list message when there are no options", async () => {
      const element = createCombobox({ options: [] });
      await openDropdown(element);

      expect(query(element, '[data-id="empty-list"]').textContent).toContain(
        "No options available"
      );
    });
  });

  describe("value contract", () => {
    it("renders a programmatic value without firing change", async () => {
      const element = createCombobox();
      const changeHandler = listenForChange(element);

      element.value = ["a", "c"];
      await flush();

      expect(
        getSelection(element).selectedOptions.map((option) => option.value)
      ).toEqual(["a", "c"]);
      expect(changeHandler).not.toHaveBeenCalled();
    });

    it("returns a copy from the value getter", () => {
      const element = createCombobox({ value: ["a"] });
      element.value.push("b");
      expect(element.value).toEqual(["a"]);
    });

    it("treats a non-array value as empty", () => {
      const element = createCombobox({ value: "a;b" });
      expect(element.value).toEqual([]);
    });

    it("keeps values that match no option (value may arrive before options)", async () => {
      const element = createCombobox({ options: [], value: ["b", "unknown"] });
      expect(element.value).toEqual(["b", "unknown"]);

      element.options = OPTIONS;
      await flush();

      expect(element.value).toEqual(["b", "unknown"]);
      expect(getSelection(element).selectedOptions).toEqual([
        { label: "Beta", value: "b" }
      ]);
    });

    it("lists options that arrive while the dropdown is open, without a stale highlight", async () => {
      const element = createCombobox({ options: [] });
      await openWithKeyboard(element);

      element.options = OPTIONS;
      await flush();

      expect(getOptions(element)).toHaveLength(OPTIONS.length);
      expect(activeOption(element)).toBeNull();

      await pressKey(element, "ArrowDown");
      expect(activeOption(element).dataset.value).toBe("a");
    });

    it("keeps the value but drops it from the display when its option disappears", async () => {
      const element = createCombobox({ value: ["a", "b"] });
      const changeHandler = listenForChange(element);

      element.options = OPTIONS.filter((option) => option.value !== "a");
      await flush();

      expect(element.value).toEqual(["a", "b"]);
      expect(
        getSelection(element).selectedOptions.map((option) => option.value)
      ).toEqual(["b"]);
      expect(changeHandler).not.toHaveBeenCalled();
    });
  });

  describe("opening and closing", () => {
    it("opens on input click and exposes the expanded state", async () => {
      const element = createCombobox();
      await openDropdown(element);

      expect(isOpen(element)).toBe(true);
      expect(query(element, ".slds-combobox").classList).toContain(
        "slds-is-open"
      );
      expect(getInput(element).placeholder).toBe("Search...");
    });

    it("stays open when the input is clicked again", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await openDropdown(element);

      expect(isOpen(element)).toBe(true);
    });

    it.each(["ArrowDown", "ArrowUp", "Enter", " "])(
      "opens with %p",
      async (key) => {
        const element = createCombobox();
        await pressKey(element, key);

        expect(isOpen(element)).toBe(true);
      }
    );

    it("closes with Escape and stops the event so a surrounding modal stays open", async () => {
      const element = createCombobox();
      await openDropdown(element);
      const event = await pressKey(element, "Escape");

      expect(isOpen(element)).toBe(false);
      expect(event.defaultPrevented).toBe(true);
    });

    it("leaves Escape alone while closed", async () => {
      const element = createCombobox();
      const event = await pressKey(element, "Escape");

      expect(event.defaultPrevented).toBe(false);
    });

    it("closes when focus leaves the component", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await focusOut(element, document.body);

      expect(isOpen(element)).toBe(false);
    });

    it("stays open when focus moves to an element inside the dropdown", async () => {
      const element = createCombobox({ showSelectAll: true });
      await openDropdown(element);
      await focusOut(element, query(element, '[data-id="select-all"]'));

      expect(isOpen(element)).toBe(true);
    });

    it("prevents mousedown inside the dropdown from stealing focus", async () => {
      const element = createCombobox();
      await openDropdown(element);
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true
      });
      getOption(element, "a").dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it("is read-only while closed and editable while open", async () => {
      const element = createCombobox();
      expect(getInput(element).readOnly).toBe(true);

      await openDropdown(element);
      expect(getInput(element).readOnly).toBe(false);
    });
  });

  describe("selecting with the pointer", () => {
    it("toggles an option on and off, firing change each time", async () => {
      const element = createCombobox();
      const changeHandler = listenForChange(element);
      await openDropdown(element);

      await clickOption(element, "b");
      expect(lastChangeDetail(changeHandler).value).toEqual(["b"]);
      expect(getOption(element, "b").getAttribute("aria-selected")).toBe(
        "true"
      );

      await clickOption(element, "b");
      expect(lastChangeDetail(changeHandler).value).toEqual([]);
      expect(changeHandler).toHaveBeenCalledTimes(2);
    });

    it("keeps the dropdown open after a selection", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await clickOption(element, "a");

      expect(isOpen(element)).toBe(true);
    });

    it("reports the full selection: values in selection order, options in option order", async () => {
      const element = createCombobox();
      const changeHandler = listenForChange(element);
      await openDropdown(element);

      await clickOption(element, "c");
      await clickOption(element, "a");

      expect(lastChangeDetail(changeHandler)).toEqual({
        value: ["c", "a"],
        selectedOptions: [
          { label: "Alpha", value: "a" },
          { label: "Gamma", value: "c" }
        ]
      });
    });

    it("fires a change event that does not bubble or cross the shadow boundary", async () => {
      const element = createCombobox();
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      await clickOption(element, "a");

      const event = changeHandler.mock.calls[0][0];
      expect(event.bubbles).toBe(false);
      expect(event.composed).toBe(false);
    });
  });

  describe("selection display", () => {
    it("shows pills by default and an empty input", async () => {
      const element = createCombobox({ value: ["a", "b"] });
      await flush();

      expect(getSelection(element)).not.toBeNull();
      expect(getInput(element).value).toBe("");
    });

    it.each([
      [["a"], "1 option selected"],
      [["a", "b", "c", "d", "e"], "5 options selected"]
    ])(
      "pills mode shows the count of %p as the input placeholder",
      (value, expectedPlaceholder) => {
        const element = createCombobox({
          value,
          placeholder: "Pick industries"
        });

        expect(getInput(element).value).toBe("");
        expect(getInput(element).placeholder).toBe(expectedPlaceholder);
      }
    );

    it("pills mode counts only values that match an option", () => {
      const element = createCombobox({ value: ["a", "unknown"] });
      expect(getInput(element).placeholder).toBe("1 option selected");
    });

    it("pills mode returns to the parent placeholder once everything is deselected", async () => {
      const element = createCombobox({
        value: ["a"],
        placeholder: "Pick industries"
      });

      element.clearSelection();
      await flush();

      expect(getInput(element).placeholder).toBe("Pick industries");
    });

    it("pills mode shows the search placeholder while open", async () => {
      const element = createCombobox({ value: ["a"] });
      await openDropdown(element);

      expect(getInput(element).placeholder).toBe("Search...");
    });

    it("text mode keeps the parent placeholder while the labels are the value", () => {
      const element = createCombobox({
        selectionDisplay: "text",
        value: ["a"],
        placeholder: "Pick industries"
      });

      expect(getInput(element).value).toBe("Alpha");
      expect(getInput(element).placeholder).toBe("Pick industries");
    });

    it("renders no pill list when nothing is selected", () => {
      const element = createCombobox();
      expect(getSelection(element)).toBeNull();
    });

    it("passes the accessible label and the selected options to the pills", () => {
      const element = createCombobox({ value: ["a"] });
      const selection = getSelection(element);

      expect(selection.label).toBe("Selected options");
      expect(selection.selectedOptions).toEqual([
        { label: "Alpha", value: "a" }
      ]);
    });

    it("deselects an option when its pill is removed", async () => {
      const element = createCombobox({ value: ["a", "b"] });
      const changeHandler = listenForChange(element);

      getSelection(element).dispatchEvent(
        new CustomEvent("remove", { detail: { value: "a" } })
      );
      await flush();

      expect(lastChangeDetail(changeHandler).value).toEqual(["b"]);
      expect(element.value).toEqual(["b"]);
    });

    it.each([
      [["a"], "Alpha"],
      [["a", "b", "c"], "Alpha, Beta, Gamma"],
      [["a", "b", "c", "d"], "4 options selected"]
    ])("text display summarises %p as %p", (value, expectedText) => {
      const element = createCombobox({ selectionDisplay: "text", value });

      expect(getInput(element).value).toBe(expectedText);
      expect(getSelection(element)).toBeNull();
    });

    it("text display shows the search term instead of the summary while open", async () => {
      const element = createCombobox({
        selectionDisplay: "text",
        value: ["a"]
      });
      await openDropdown(element);

      expect(getInput(element).value).toBe("");
    });

    it("falls back to pills for an unknown selection display", () => {
      const element = createCombobox({
        selectionDisplay: "chips",
        value: ["a"]
      });

      expect(element.selectionDisplay).toBe("pills");
      expect(getSelection(element)).not.toBeNull();
    });
  });

  describe("keyboard navigation and ARIA", () => {
    // Regression: a mouse open used to highlight the first option, and the highlight
    // stayed there while the user clicked other options.
    it("opening with the mouse highlights no option", async () => {
      const element = createCombobox();
      await openDropdown(element);

      expect(activeOption(element)).toBeNull();
      expect(
        getInput(element).getAttribute("aria-activedescendant")
      ).toBeNull();
    });

    it("clicking an option makes it the active option for the arrow keys", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await clickOption(element, "c");

      expect(activeOption(element).dataset.value).toBe("c");
      expect(getInput(element).getAttribute("aria-activedescendant")).toBe(
        getOption(element, "c").id
      );

      await pressKey(element, "ArrowDown");
      expect(activeOption(element).dataset.value).toBe("d");
    });

    it("ArrowDown after a mouse open starts at the first option", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await pressKey(element, "ArrowDown");

      expect(activeOption(element).dataset.value).toBe("a");
    });

    it("highlights the first option on open and points aria-activedescendant at it", async () => {
      const element = createCombobox();
      await pressKey(element, "ArrowDown");

      expect(activeOption(element).dataset.value).toBe("a");
      expect(getInput(element).getAttribute("aria-activedescendant")).toBe(
        activeOption(element).id
      );
    });

    it("moves with ArrowDown/ArrowUp without wrapping at the ends", async () => {
      const element = createCombobox();
      await openWithKeyboard(element);

      await pressKey(element, "ArrowUp");
      expect(activeOption(element).dataset.value).toBe("a");

      await pressKey(element, "ArrowDown");
      await pressKey(element, "ArrowDown");
      expect(activeOption(element).dataset.value).toBe("c");

      await pressKey(element, "End");
      await pressKey(element, "ArrowDown");
      expect(activeOption(element).dataset.value).toBe("e");
    });

    it("jumps with Home and End", async () => {
      const element = createCombobox();
      await openDropdown(element);

      await pressKey(element, "End");
      expect(activeOption(element).dataset.value).toBe("e");

      await pressKey(element, "Home");
      expect(activeOption(element).dataset.value).toBe("a");
    });

    it("toggles the highlighted option with Enter", async () => {
      const element = createCombobox();
      const changeHandler = listenForChange(element);
      await openWithKeyboard(element);
      await pressKey(element, "ArrowDown");
      await pressKey(element, "Enter");

      expect(lastChangeDetail(changeHandler).value).toEqual(["b"]);
      expect(isOpen(element)).toBe(true);
    });

    it("lets Space reach the search field while open", async () => {
      const element = createCombobox();
      await openDropdown(element);
      const event = await pressKey(element, " ");

      expect(event.defaultPrevented).toBe(false);
    });

    it("skips options disabled by the selection limit", async () => {
      const element = createCombobox({ value: ["a", "c"], maxSelections: 2 });
      await openWithKeyboard(element);

      expect(activeOption(element).dataset.value).toBe("a");
      await pressKey(element, "ArrowDown");
      expect(activeOption(element).dataset.value).toBe("c");
    });

    it("clears aria-activedescendant when closed", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await pressKey(element, "Escape");

      expect(
        getInput(element).getAttribute("aria-activedescendant")
      ).toBeNull();
    });

    it("links the input to the listbox and marks it multi-selectable", async () => {
      const element = createCombobox();
      await openDropdown(element);
      const listbox = query(element, '[role="listbox"]');

      expect(getInput(element).getAttribute("aria-controls")).toBe(listbox.id);
      expect(listbox.getAttribute("aria-multiselectable")).toBe("true");
    });

    it("scrolls the highlighted option into view", async () => {
      const scrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const element = createCombobox();
      await openDropdown(element);
      await pressKey(element, "End");
      await flush();

      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
      delete Element.prototype.scrollIntoView;
    });
  });

  describe("search", () => {
    it("filters options by label, ignoring case", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await typeSearch(element, "TA");

      expect(getOptions(element).map((option) => option.dataset.value)).toEqual(
        ["b", "d"]
      );
    });

    it("highlights the first match so Enter selects it", async () => {
      const element = createCombobox();
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      await typeSearch(element, "gam");
      await pressKey(element, "Enter");

      expect(lastChangeDetail(changeHandler).value).toEqual(["c"]);
    });

    it("shows a no-matches message", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await typeSearch(element, "zzz");

      expect(getOptions(element)).toHaveLength(0);
      expect(query(element, '[data-id="empty-list"]').textContent).toContain(
        "No matches found"
      );
    });

    it("keeps filtered-out selections selected", async () => {
      const element = createCombobox({ value: ["a"] });
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      await typeSearch(element, "beta");
      await pressKey(element, "Enter");

      expect(lastChangeDetail(changeHandler).value).toEqual(["a", "b"]);
    });

    it("resets the search when the dropdown closes", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await typeSearch(element, "beta");
      await pressKey(element, "Escape");
      await openDropdown(element);

      expect(getInput(element).value).toBe("");
      expect(getOptions(element)).toHaveLength(OPTIONS.length);
    });
  });

  describe("selection limit", () => {
    it("disables the remaining options once the limit is reached", async () => {
      const element = createCombobox({ maxSelections: 2 });
      await openDropdown(element);
      await clickOption(element, "a");
      await clickOption(element, "b");

      expect(getOption(element, "c").getAttribute("aria-disabled")).toBe(
        "true"
      );
      expect(getOption(element, "a").getAttribute("aria-disabled")).toBe(
        "false"
      );
    });

    it("ignores clicks on disabled options", async () => {
      const element = createCombobox({ maxSelections: 1, value: ["a"] });
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      await clickOption(element, "b");

      expect(changeHandler).not.toHaveBeenCalled();
      expect(element.value).toEqual(["a"]);
    });

    it("re-enables options after a deselection", async () => {
      const element = createCombobox({ maxSelections: 1, value: ["a"] });
      await openDropdown(element);
      await clickOption(element, "a");

      expect(getOption(element, "b").getAttribute("aria-disabled")).toBe(
        "false"
      );
    });

    it("accepts the limit as a numeric string", () => {
      const element = createCombobox({ maxSelections: "2" });
      expect(element.maxSelections).toBe(2);
    });
  });

  describe("validation", () => {
    it("is valid without constraints", () => {
      const element = createCombobox();
      expect(element.checkValidity()).toBe(true);
      expect(element.validity.valid).toBe(true);
    });

    it("checkValidity reports a missing value without showing the error", async () => {
      const element = createCombobox({ required: true });
      expect(element.checkValidity()).toBe(false);
      await flush();

      expect(getErrorMessage(element)).toBeNull();
    });

    it("reportValidity shows the error and links it to the input", async () => {
      const element = createCombobox({ required: true });
      expect(element.reportValidity()).toBe(false);
      await flush();

      const message = getErrorMessage(element);
      expect(message.textContent).toContain("Complete this field.");
      expect(getInput(element).getAttribute("aria-describedby")).toBe(
        message.id
      );
      expect(query(element, ".slds-form-element").classList).toContain(
        "slds-has-error"
      );
    });

    it("shows the error after the user leaves the field", async () => {
      const element = createCombobox({ required: true });
      await openDropdown(element);
      await focusOut(element);

      expect(getErrorMessage(element).textContent).toContain(
        "Complete this field."
      );
    });

    it("removes the error once a value is selected", async () => {
      const element = createCombobox({ required: true });
      element.reportValidity();
      await openDropdown(element);
      await clickOption(element, "a");

      expect(getErrorMessage(element)).toBeNull();
      expect(getInput(element).getAttribute("aria-describedby")).toBeNull();
    });

    it("uses a custom value-missing message", async () => {
      const element = createCombobox({
        required: true,
        messageWhenValueMissing: "Pick one"
      });
      element.reportValidity();
      await flush();

      expect(getErrorMessage(element).textContent).toContain("Pick one");
    });

    it("reports rangeOverflow when the value exceeds the limit", async () => {
      const element = createCombobox({
        maxSelections: 2,
        value: ["a", "b", "c"]
      });

      expect(element.validity.rangeOverflow).toBe(true);
      element.reportValidity();
      await flush();
      expect(getErrorMessage(element).textContent).toContain(
        "Select at most 2 options."
      );
    });

    it("uses a custom range-overflow message", async () => {
      const element = createCombobox({
        maxSelections: 1,
        value: ["a", "b"],
        messageWhenRangeOverflow: "Only {0}, please"
      });
      element.reportValidity();
      await flush();

      expect(getErrorMessage(element).textContent).toContain("Only 1, please");
    });

    it("shows a custom validity message and clears it with an empty string", async () => {
      const element = createCombobox();
      element.setCustomValidity("Server says no");
      expect(element.reportValidity()).toBe(false);
      await flush();
      expect(getErrorMessage(element).textContent).toContain("Server says no");

      element.setCustomValidity("");
      await flush();
      expect(element.checkValidity()).toBe(true);
      expect(getErrorMessage(element)).toBeNull();
    });

    it("is always valid when disabled", () => {
      const element = createCombobox({ required: true, disabled: true });
      expect(element.checkValidity()).toBe(true);
    });
  });

  describe("disabled", () => {
    it("disables the input and does not open", async () => {
      const element = createCombobox({ disabled: true });
      await openDropdown(element);
      await pressKey(element, "ArrowDown");

      expect(getInput(element).disabled).toBe(true);
      expect(isOpen(element)).toBe(false);
    });

    it("renders read-only pills", () => {
      const element = createCombobox({ disabled: true, value: ["a"] });
      expect(getSelection(element).disabled).toBe(true);
    });
  });

  describe("select all / clear all", () => {
    it("is hidden by default", async () => {
      const element = createCombobox();
      await openDropdown(element);

      expect(query(element, '[data-id="bulk-actions"]')).toBeNull();
    });

    it("selects every option with a single change event", async () => {
      const element = createCombobox({ showSelectAll: true });
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      query(element, '[data-id="select-all"]').click();
      await flush();

      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(lastChangeDetail(changeHandler).value).toEqual([
        "a",
        "b",
        "c",
        "d",
        "e"
      ]);
    });

    it("selects only the options matching the search", async () => {
      const element = createCombobox({ showSelectAll: true, value: ["a"] });
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      await typeSearch(element, "ta");
      query(element, '[data-id="select-all"]').click();
      await flush();

      expect(lastChangeDetail(changeHandler).value).toEqual(["a", "b", "d"]);
    });

    it("stops at the selection limit", async () => {
      const element = createCombobox({
        showSelectAll: true,
        maxSelections: 3,
        value: ["e"]
      });
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      query(element, '[data-id="select-all"]').click();
      await flush();

      expect(lastChangeDetail(changeHandler).value).toEqual(["e", "a", "b"]);
    });

    it("clears only the visible options", async () => {
      const element = createCombobox({
        showSelectAll: true,
        value: ["a", "b", "d"]
      });
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      await typeSearch(element, "ta");
      query(element, '[data-id="clear-all"]').click();
      await flush();

      expect(lastChangeDetail(changeHandler).value).toEqual(["a"]);
    });

    it("does not fire change when select all changes nothing", async () => {
      const element = createCombobox({
        showSelectAll: true,
        value: OPTIONS.map((option) => option.value)
      });
      const changeHandler = listenForChange(element);
      await openDropdown(element);
      query(element, '[data-id="select-all"]').click();
      await flush();

      expect(changeHandler).not.toHaveBeenCalled();
    });
  });

  describe("public methods", () => {
    it("clearSelection deselects everything with one change event", async () => {
      const element = createCombobox({ value: ["a", "b", "unknown"] });
      const changeHandler = listenForChange(element);

      element.clearSelection();
      await flush();

      expect(element.value).toEqual([]);
      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(lastChangeDetail(changeHandler)).toEqual({
        value: [],
        selectedOptions: []
      });
      expect(getSelection(element)).toBeNull();
    });

    it("clearSelection does nothing when nothing is selected", () => {
      const element = createCombobox();
      const changeHandler = listenForChange(element);

      element.clearSelection();

      expect(changeHandler).not.toHaveBeenCalled();
    });

    it("focus() and blur() move focus to and from the input", () => {
      const element = createCombobox();

      element.focus();
      expect(element.shadowRoot.activeElement).toBe(getInput(element));

      element.blur();
      expect(element.shadowRoot.activeElement).toBeNull();
    });
  });

  describe("accessibility", () => {
    it("is accessible when closed with a selection", async () => {
      const element = createCombobox({ value: ["a"] });
      await flush();
      await expect(element).toBeAccessible();
    });

    it("is accessible when open with a highlighted option", async () => {
      const element = createCombobox({ showSelectAll: true });
      await openDropdown(element);
      await pressKey(element, "ArrowDown");
      await expect(element).toBeAccessible();
    });

    it("is accessible in the error state", async () => {
      const element = createCombobox({ required: true });
      element.reportValidity();
      await flush();
      await expect(element).toBeAccessible();
    });

    it("is accessible with no matching options", async () => {
      const element = createCombobox();
      await openDropdown(element);
      await typeSearch(element, "zzz");
      await expect(element).toBeAccessible();
    });
  });
});
