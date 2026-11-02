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

  /** Selected values as a multi-select picklist string, e.g. `'Banking;Energy'`. */
  @api
  get value() {
    return formatPicklistValue(this.values);
  }
  set value(value) {
    this.values = parsePicklistValue(value);
  }

  @api
  get validity() {
    return this.refs.combobox.validity;
  }

  @api
  clearSelection() {
    this.refs.combobox.clearSelection();
  }

  @api
  checkValidity() {
    return this.refs.combobox.checkValidity();
  }

  @api
  reportValidity() {
    return this.refs.combobox.reportValidity();
  }

  @api
  setCustomValidity(message) {
    this.refs.combobox.setCustomValidity(message);
  }

  @api
  focus() {
    this.refs.combobox.focus();
  }

  @api
  blur() {
    this.refs.combobox.blur();
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
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          value: formatPicklistValue(this.values),
          values: [...this.values],
          selectedOptions: event.detail.selectedOptions
        }
      })
    );
  }
}
