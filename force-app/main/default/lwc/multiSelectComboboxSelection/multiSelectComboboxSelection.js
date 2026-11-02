import { LightningElement, api } from "lwc";

/**
 * Renders the selected options of c-multi-select-combobox as pills.
 * Pills are removable unless disabled; removal is reported, never applied here.
 *
 * @fires remove detail: { value: string } value of the removed option
 */
export default class MultiSelectComboboxSelection extends LightningElement {
  /** Accessible label of the pill list. */
  @api label;
  /** Renders read-only pills without a remove button. */
  @api disabled = false;

  _selectedOptions = [];

  /** Selected options as `{ label, value }`, in display order. */
  @api
  get selectedOptions() {
    return this._selectedOptions;
  }
  set selectedOptions(options) {
    this._selectedOptions = Array.isArray(options) ? options : [];
  }

  get isRemovable() {
    return !this.disabled;
  }

  get pillItems() {
    return this._selectedOptions.map((option) => ({
      label: option.label,
      name: option.value
    }));
  }

  handleItemRemove(event) {
    const removedOption = this._selectedOptions[event.detail.index];
    if (removedOption) {
      this.dispatchEvent(
        new CustomEvent("remove", { detail: { value: removedOption.value } })
      );
    }
  }
}
