import { LightningElement } from "lwc";

const INDUSTRY_OPTIONS = Object.freeze([
  { label: "Agriculture", value: "Agriculture" },
  { label: "Banking", value: "Banking" },
  { label: "Consulting", value: "Consulting" },
  { label: "Education", value: "Education" },
  { label: "Energy", value: "Energy" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Media", value: "Media" },
  { label: "Retail", value: "Retail" },
  { label: "Technology", value: "Technology" },
  { label: "Transportation", value: "Transportation" }
]);

/**
 * Showcase of c-multi-select-combobox: one tile per feature, each with its own value.
 * Used for the README screenshot. Open the "Limit" tile (last, so its dropdown covers nothing) before capturing it.
 */
export default class MultiSelectComboboxDemo extends LightningElement {
  options = INDUSTRY_OPTIONS;
  values = {
    pills: ["Banking", "Energy", "Healthcare", "Retail"],
    textFew: ["Banking", "Energy"],
    textMany: ["Agriculture", "Banking", "Consulting", "Education", "Energy"],
    limit: ["Agriculture", "Consulting"],
    required: [],
    disabled: ["Media", "Retail"]
  };

  _hasShownRequiredError = false;

  // Shows the required-field error up front, without the user touching the field.
  renderedCallback() {
    if (this._hasShownRequiredError) {
      return;
    }
    this._hasShownRequiredError = true;
    this.refs.requiredCombobox.reportValidity();
  }

  handleChange(event) {
    const tileName = event.target.dataset.name;
    this.values = { ...this.values, [tileName]: event.detail.value };
  }
}
