import { LightningElement, api, wire } from "lwc";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import {
  formatPicklistValue,
  parsePicklistValue,
  resolveFieldReference,
  toComboboxOptions
} from "./picklistValueCodec";

const UI_TEXT = Object.freeze({
  loading: "Loading",
  loadError: "Unable to load picklist values."
});

/**
 * Multi-select combobox bound to a picklist field. Loads the field's values with the UI API and
 * exchanges the value as a `'a;b'` string. Everything else is delegated to c-multi-select-combobox.
 *
 * @fires change detail: { value: string, values: string[], selectedOptions: {label: string, value: string}[] }
 */
export default class PicklistMultiSelect extends LightningElement {
  /** Object API name, e.g. `Account`. Optional when field-api-name is qualified. */
  @api objectApiName;
  /** Field API name, `Industry` or `Account.Industry`. */
  @api fieldApiName;
  /** Record type for the picklist values. Defaults to the object's default record type. */
  @api recordTypeId;

  // Pass-through properties of c-multi-select-combobox.
  @api label;
  @api placeholder;
  @api selectionDisplay;
  @api variant;
  @api fieldLevelHelp;
  @api disabled = false;
  @api required = false;
  @api maxSelections;
  @api showSelectAll = false;
  @api messageWhenValueMissing;
  @api messageWhenRangeOverflow;

  text = UI_TEXT;
  values = [];
  options;
  defaultRecordTypeId;
  loadError;
  pendingCustomValidity;

  /** Selected values as a multi-select picklist string, e.g. `'Banking;Energy'`. */
  @api
  get value() {
    return formatPicklistValue(this.values);
  }
  set value(value) {
    this.values = parsePicklistValue(value);
  }

  // The methods below delegate to the combobox, which only exists once the wrapper has rendered.
  // Earlier calls are safe: there's no field to validate or focus yet, and state changes are kept.

  /** The combobox's validity; undefined before the first render. */
  @api
  get validity() {
    return this.combobox?.validity;
  }

  @api
  clearSelection() {
    if (this.combobox) {
      this.combobox.clearSelection();
    } else if (this.values.length > 0) {
      this.values = [];
      this.dispatchChange([]);
    }
  }

  /** @returns {boolean} the combobox's validity; true before the first render. */
  @api
  checkValidity() {
    return this.combobox?.checkValidity() ?? true;
  }

  /** @returns {boolean} the combobox's validity; true before the first render. */
  @api
  reportValidity() {
    return this.combobox?.reportValidity() ?? true;
  }

  /** Before the first render, the message is kept and applied once the combobox exists. */
  @api
  setCustomValidity(message) {
    if (this.combobox) {
      this.combobox.setCustomValidity(message);
    } else {
      this.pendingCustomValidity = message;
    }
  }

  @api
  focus() {
    this.combobox?.focus();
  }

  @api
  blur() {
    this.combobox?.blur();
  }

  renderedCallback() {
    if (this.pendingCustomValidity !== undefined) {
      this.combobox.setCustomValidity(this.pendingCustomValidity);
      this.pendingCustomValidity = undefined;
    }
  }

  // `refs` is undefined until the first render.
  get combobox() {
    return this.refs?.combobox;
  }

  // The object info is only needed when no record type is given.
  get objectApiNameForDefaultRecordType() {
    return this.recordTypeId ? undefined : this.fieldReference.objectApiName;
  }

  get effectiveRecordTypeId() {
    return this.recordTypeId || this.defaultRecordTypeId;
  }

  get qualifiedFieldApiName() {
    return this.fieldReference.qualifiedFieldApiName;
  }

  get fieldReference() {
    return resolveFieldReference(this.objectApiName, this.fieldApiName);
  }

  @wire(getObjectInfo, { objectApiName: "$objectApiNameForDefaultRecordType" })
  wiredObjectInfo({ data, error }) {
    if (data) {
      this.defaultRecordTypeId = data.defaultRecordTypeId;
    } else if (error) {
      this.loadError = error;
    }
  }

  @wire(getPicklistValues, {
    recordTypeId: "$effectiveRecordTypeId",
    fieldApiName: "$qualifiedFieldApiName"
  })
  wiredPicklistValues({ data, error }) {
    if (data) {
      this.options = toComboboxOptions(data);
      this.loadError = undefined;
    } else if (error) {
      this.loadError = error;
    }
  }

  get isLoading() {
    return this.options === undefined && !this.loadError;
  }

  get hasLoadError() {
    return Boolean(this.loadError);
  }

  get comboboxOptions() {
    return this.options ?? [];
  }

  handleChange(event) {
    this.values = event.detail.value;
    this.dispatchChange(event.detail.selectedOptions);
  }

  dispatchChange(selectedOptions) {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          value: formatPicklistValue(this.values),
          values: [...this.values],
          selectedOptions
        }
      })
    );
  }
}
