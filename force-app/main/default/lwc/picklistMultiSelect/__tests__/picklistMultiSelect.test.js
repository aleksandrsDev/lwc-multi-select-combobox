import { createElement } from "@lwc/engine-dom";
import PicklistMultiSelect from "c/picklistMultiSelect";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";

const DEFAULT_RECORD_TYPE_ID = "012000000000000AAA";
const EXPLICIT_RECORD_TYPE_ID = "0125g000000ABCDAAA";

const OBJECT_INFO = {
  apiName: "Account",
  defaultRecordTypeId: DEFAULT_RECORD_TYPE_ID
};
const PICKLIST_VALUES = {
  defaultValue: null,
  values: [
    { label: "Banking", value: "Banking", attributes: null, validFor: [] },
    { label: "Energy", value: "Energy", attributes: null, validFor: [] },
    { label: "Retail", value: "Retail", attributes: null, validFor: [] }
  ]
};

function createPicklist(props = {}) {
  const element = createElement("c-picklist-multi-select", {
    is: PicklistMultiSelect
  });
  Object.assign(element, {
    label: "Industry",
    objectApiName: "Account",
    fieldApiName: "Industry",
    ...props
  });
  document.body.appendChild(element);
  return element;
}

const flush = () => Promise.resolve();
const getCombobox = (element) =>
  element.shadowRoot.querySelector("c-multi-select-combobox");
const getSpinner = (element) =>
  element.shadowRoot.querySelector("lightning-spinner");
const getLoadError = (element) =>
  element.shadowRoot.querySelector('[role="alert"]');

async function emitPicklist(element) {
  getObjectInfo.emit(OBJECT_INFO);
  await flush();
  getPicklistValues.emit(PICKLIST_VALUES);
  await flush();
  return element;
}

function listenForChange(element) {
  const handler = jest.fn();
  element.addEventListener("change", handler);
  return handler;
}

describe("c-picklist-multi-select", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  describe("loading picklist values", () => {
    it("requests the object info for the default record type", async () => {
      createPicklist();
      await flush();
      expect(getObjectInfo.getLastConfig()).toEqual({
        objectApiName: "Account"
      });
    });

    it("requests the qualified field with the default record type", async () => {
      createPicklist();
      getObjectInfo.emit(OBJECT_INFO);
      await flush();

      expect(getPicklistValues.getLastConfig()).toEqual({
        recordTypeId: DEFAULT_RECORD_TYPE_ID,
        fieldApiName: "Account.Industry"
      });
    });

    it("uses an explicit record type and skips the object info lookup", async () => {
      createPicklist({ recordTypeId: EXPLICIT_RECORD_TYPE_ID });
      await flush();

      expect(getObjectInfo.getLastConfig()).toEqual({
        objectApiName: undefined
      });
      expect(getPicklistValues.getLastConfig()).toEqual({
        recordTypeId: EXPLICIT_RECORD_TYPE_ID,
        fieldApiName: "Account.Industry"
      });
    });

    it("accepts a qualified field name without an object name", async () => {
      createPicklist({
        objectApiName: undefined,
        fieldApiName: "Account.Industry"
      });
      getObjectInfo.emit(OBJECT_INFO);
      await flush();

      expect(getObjectInfo.getLastConfig()).toEqual({
        objectApiName: "Account"
      });
      expect(getPicklistValues.getLastConfig().fieldApiName).toBe(
        "Account.Industry"
      );
    });

    it("shows a spinner until the values arrive, then passes them as options", async () => {
      const element = createPicklist();
      expect(getSpinner(element)).not.toBeNull();

      await emitPicklist(element);

      expect(getSpinner(element)).toBeNull();
      expect(getCombobox(element).options).toEqual([
        { label: "Banking", value: "Banking" },
        { label: "Energy", value: "Energy" },
        { label: "Retail", value: "Retail" }
      ]);
    });

    it("shows an error and hides the spinner when the picklist values fail to load", async () => {
      const element = createPicklist();
      getObjectInfo.emit(OBJECT_INFO);
      await flush();
      getPicklistValues.error();
      await flush();

      expect(getSpinner(element)).toBeNull();
      expect(getLoadError(element).textContent).toContain(
        "Unable to load picklist values."
      );
    });

    it("shows an error when the object info fails to load", async () => {
      const element = createPicklist();
      getObjectInfo.error();
      await flush();

      expect(getLoadError(element)).not.toBeNull();
    });

    it("clears the error once values load after a failure", async () => {
      const element = createPicklist();
      getObjectInfo.emit(OBJECT_INFO);
      await flush();
      getPicklistValues.error();
      await flush();
      getPicklistValues.emit(PICKLIST_VALUES);
      await flush();

      expect(getLoadError(element)).toBeNull();
    });
  });

  describe("value conversion", () => {
    it("passes a semicolon string to the combobox as an array", async () => {
      const element = createPicklist({ value: "Banking;Retail" });
      await emitPicklist(element);

      expect(getCombobox(element).value).toEqual(["Banking", "Retail"]);
      expect(element.value).toBe("Banking;Retail");
    });

    it("keeps the value set before the options load", async () => {
      const element = createPicklist({ value: "Energy" });
      expect(getCombobox(element).value).toEqual(["Energy"]);

      await emitPicklist(element);
      expect(getCombobox(element).value).toEqual(["Energy"]);
    });

    it("re-fires change with the semicolon string, the array and the options", async () => {
      const element = createPicklist();
      await emitPicklist(element);
      const changeHandler = listenForChange(element);
      const selectedOptions = [
        { label: "Banking", value: "Banking" },
        { label: "Energy", value: "Energy" }
      ];

      getCombobox(element).dispatchEvent(
        new CustomEvent("change", {
          detail: { value: ["Energy", "Banking"], selectedOptions }
        })
      );
      await flush();

      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler.mock.calls[0][0].detail).toEqual({
        value: "Energy;Banking",
        values: ["Energy", "Banking"],
        selectedOptions
      });
      expect(element.value).toBe("Energy;Banking");
    });
  });

  describe("pass-through and proxied API", () => {
    it("passes display and validation properties to the combobox", async () => {
      const element = createPicklist({
        placeholder: "Pick",
        selectionDisplay: "text",
        variant: "label-inline",
        fieldLevelHelp: "Help",
        disabled: true,
        required: true,
        maxSelections: 2,
        showSelectAll: true,
        messageWhenValueMissing: "Missing",
        messageWhenRangeOverflow: "Too many"
      });
      await flush();
      const combobox = getCombobox(element);

      expect(combobox).toMatchObject({
        label: "Industry",
        placeholder: "Pick",
        selectionDisplay: "text",
        variant: "label-inline",
        fieldLevelHelp: "Help",
        disabled: true,
        required: true,
        maxSelections: 2,
        showSelectAll: true,
        messageWhenValueMissing: "Missing",
        messageWhenRangeOverflow: "Too many"
      });
    });

    it("clearSelection clears through the combobox and fires change with an empty string", async () => {
      const element = createPicklist({ value: "Banking" });
      await emitPicklist(element);
      const changeHandler = listenForChange(element);

      element.clearSelection();
      await flush();

      expect(changeHandler.mock.calls[0][0].detail.value).toBe("");
      expect(element.value).toBe("");
    });

    it("delegates the validity API", async () => {
      const element = createPicklist({ required: true });
      await emitPicklist(element);

      expect(element.checkValidity()).toBe(false);
      expect(element.validity.valueMissing).toBe(true);
      expect(element.reportValidity()).toBe(false);

      element.setCustomValidity("Nope");
      expect(element.validity.customError).toBe(true);
    });

    it("delegates focus to the combobox input", async () => {
      const element = createPicklist();
      await emitPicklist(element);

      element.focus();
      const input = getCombobox(element).shadowRoot.querySelector("input");
      expect(getCombobox(element).shadowRoot.activeElement).toBe(input);

      element.blur();
      expect(getCombobox(element).shadowRoot.activeElement).toBeNull();
    });

    describe("before the first render", () => {
      const createUnrendered = (props = {}) => {
        const element = createElement("c-picklist-multi-select", {
          is: PicklistMultiSelect
        });
        Object.assign(element, props);
        return element;
      };

      it("treats the field as valid and ignores focus and blur", () => {
        const element = createUnrendered({ required: true });

        expect(element.validity).toBeUndefined();
        expect(element.checkValidity()).toBe(true);
        expect(element.reportValidity()).toBe(true);
        expect(() => {
          element.focus();
          element.blur();
        }).not.toThrow();
      });

      it("clearSelection clears the value and fires change", () => {
        const element = createUnrendered({ value: "Banking;Energy" });
        const changeHandler = listenForChange(element);

        element.clearSelection();

        expect(element.value).toBe("");
        expect(changeHandler).toHaveBeenCalledTimes(1);
        expect(changeHandler.mock.calls[0][0].detail).toEqual({
          value: "",
          values: [],
          selectedOptions: []
        });
      });

      it("clearSelection does nothing when nothing is selected", () => {
        const element = createUnrendered();
        const changeHandler = listenForChange(element);

        element.clearSelection();

        expect(changeHandler).not.toHaveBeenCalled();
      });

      it("applies a custom validity message once rendered", async () => {
        const element = createUnrendered({
          label: "Industry",
          objectApiName: "Account",
          fieldApiName: "Industry"
        });
        element.setCustomValidity("Nope");

        document.body.appendChild(element);
        await flush();

        expect(element.validity.customError).toBe(true);
        expect(getCombobox(element).validity.customError).toBe(true);
      });
    });
  });

  it("is accessible once loaded", async () => {
    const element = createPicklist({ value: "Banking" });
    await emitPicklist(element);
    await expect(element).toBeAccessible();
  });
});
