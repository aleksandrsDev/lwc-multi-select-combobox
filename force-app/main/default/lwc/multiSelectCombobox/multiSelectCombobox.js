import { LightningElement, api } from "lwc";
import UI_TEXT from "./uiText";
import {
  addValues,
  haveSameValues,
  normalizeLimit,
  normalizeOptions,
  normalizeValues,
  removeValues,
  resolveSelectedOptions,
  toggleValue
} from "./selectionModel";
import { filterOptions } from "./optionFilter";
import {
  firstEnabledIndex,
  intentForKey,
  INTENT,
  isNavigationIntent,
  moveActiveIndex
} from "./keyboardNavigator";
import { computeValidity, errorMessageFor } from "./validation";
import {
  normalizeSelectionDisplay,
  SELECTION_DISPLAY,
  selectionCountText,
  summaryText
} from "./displayText";
import {
  comboboxClass,
  formElementClass,
  labelClass,
  normalizeVariant
} from "./styleClasses";
import { buildOptionViews } from "./optionViewModel";

const ERROR_MESSAGE_ID = "error-message";
const ACTIVE_OPTION_SELECTOR = ".slds-has-focus";

/**
 * Multi-select combobox built on the SLDS combobox blueprint.
 * Owns the UI state and the public API; all decisions are delegated to the pure modules of this bundle.
 *
 * @fires change detail: { value: string[], selectedOptions: {label: string, value: string}[] }
 */
export default class MultiSelectCombobox extends LightningElement {
  /** Text label of the field. Required for accessibility, even with the label-hidden variant. */
  @api label;
  /** Text shown in the empty input while nothing is selected. No placeholder when not set. */
  @api placeholder;
  /** Help text shown in a tooltip next to the label. */
  @api fieldLevelHelp;
  /** Prevents any interaction. A disabled field is always valid. */
  @api disabled = false;
  /** At least one option must be selected. */
  @api required = false;
  /** Shows "Select all" and "Clear all" buttons at the top of the dropdown. */
  @api showSelectAll = false;
  /** Overrides the default "Complete this field." message. */
  @api messageWhenValueMissing;
  /** Overrides the default "Select at most {0} options." message. */
  @api messageWhenRangeOverflow;

  text = UI_TEXT;
  isOpen = false;
  searchTerm = "";
  activeIndex = -1;
  customMessage = "";
  isErrorVisible = false;

  _options = [];
  _value = [];
  _selectionDisplay = SELECTION_DISPLAY.PILLS;
  _variant = normalizeVariant();
  _maxSelections;
  _shouldScrollToActiveOption = false;

  /** Options as `{ label, value }`. The value identifies the option. */
  @api
  get options() {
    return this._options;
  }
  set options(options) {
    this._options = normalizeOptions(options);
    this.activeIndex = -1;
  }

  /** Selected values. Values that match no option are kept, so the value may arrive before the options. */
  @api
  get value() {
    return [...this._value];
  }
  set value(value) {
    this._value = normalizeValues(value);
  }

  /** `pills` (default) shows removable pills under the input; `text` shows the labels in the input. */
  @api
  get selectionDisplay() {
    return this._selectionDisplay;
  }
  set selectionDisplay(display) {
    this._selectionDisplay = normalizeSelectionDisplay(display);
  }

  /** `standard` (default), `label-hidden`, `label-inline` or `label-stacked`. */
  @api
  get variant() {
    return this._variant;
  }
  set variant(variant) {
    this._variant = normalizeVariant(variant);
  }

  /** Maximum number of selected options. Once reached, unselected options are disabled. */
  @api
  get maxSelections() {
    return this._maxSelections;
  }
  set maxSelections(limit) {
    this._maxSelections = normalizeLimit(limit);
  }

  /** ValidityState-like object: `{ valid, valueMissing, rangeOverflow, customError }`. */
  @api
  get validity() {
    return computeValidity({
      disabled: this.disabled,
      required: this.required,
      selectedCount: this._value.length,
      maxSelections: this._maxSelections,
      customMessage: this.customMessage
    });
  }

  /** Deselects every option. Fires a single change event when something was selected. */
  @api
  clearSelection() {
    this.commitSelection([]);
  }

  /** @returns {boolean} whether the field is valid, without showing an error. */
  @api
  checkValidity() {
    return this.validity.valid;
  }

  /** Shows the error message when the field is invalid. @returns {boolean} whether the field is valid. */
  @api
  reportValidity() {
    this.isErrorVisible = true;
    return this.checkValidity();
  }

  /** Sets a custom error message; an empty string clears it. Call reportValidity() to show it. */
  @api
  setCustomValidity(message) {
    this.customMessage = message ?? "";
  }

  @api
  focus() {
    this.refs.input.focus();
  }

  @api
  blur() {
    this.refs.input.blur();
  }

  renderedCallback() {
    if (this._shouldScrollToActiveOption) {
      this._shouldScrollToActiveOption = false;
      this.scrollActiveOptionIntoView();
    }
  }

  // ----- Template getters -----

  get selectedOptions() {
    return resolveSelectedOptions(this._options, this._value);
  }

  get visibleOptions() {
    return filterOptions(this._options, this.searchTerm);
  }

  get optionViews() {
    return buildOptionViews({
      options: this.visibleOptions,
      selectedValues: this._value,
      activeIndex: this.activeIndex,
      maxSelections: this._maxSelections
    });
  }

  get isEmptyListVisible() {
    return this.visibleOptions.length === 0;
  }

  get emptyListText() {
    return this._options.length === 0 ? UI_TEXT.noOptions : UI_TEXT.noMatches;
  }

  get isTextDisplay() {
    return this._selectionDisplay === SELECTION_DISPLAY.TEXT;
  }

  get showPills() {
    return !this.isTextDisplay && this.selectedOptions.length > 0;
  }

  get inputValue() {
    if (this.isOpen) {
      return this.searchTerm;
    }
    return this.isTextDisplay
      ? summaryText(this.selectedOptions, this.countTemplates)
      : "";
  }

  // Pills mode keeps the input empty, so the selection count is shown as its placeholder.
  get inputPlaceholder() {
    if (this.isOpen) {
      return UI_TEXT.searchPlaceholder;
    }
    if (this.showPills) {
      return selectionCountText(
        this.selectedOptions.length,
        this.countTemplates
      );
    }
    return this.placeholder;
  }

  get countTemplates() {
    return {
      singular: UI_TEXT.selectedCountSingular,
      plural: UI_TEXT.selectedCount
    };
  }

  get isInputReadOnly() {
    return !this.isOpen;
  }

  get ariaExpanded() {
    return String(this.isOpen);
  }

  get ariaRequired() {
    return String(Boolean(this.required));
  }

  get activeDescendant() {
    const activeView = this.isOpen
      ? this.optionViews[this.activeIndex]
      : undefined;
    return activeView?.id;
  }

  get hasError() {
    return this.isErrorVisible && !this.validity.valid;
  }

  get errorMessage() {
    return errorMessageFor(
      this.validity,
      {
        customMessage: this.customMessage,
        valueMissing: this.messageWhenValueMissing || UI_TEXT.valueMissing,
        rangeOverflow: this.messageWhenRangeOverflow || UI_TEXT.rangeOverflow
      },
      this._maxSelections
    );
  }

  get describedBy() {
    return this.hasError ? ERROR_MESSAGE_ID : undefined;
  }

  get formElementClass() {
    return formElementClass(this._variant, this.hasError);
  }

  get labelClass() {
    return labelClass(this._variant);
  }

  get comboboxClass() {
    return comboboxClass(this.isOpen);
  }

  // ----- Event handlers -----

  handleInputClick() {
    this.openDropdown();
  }

  handleInputKeyDown(event) {
    const intent = intentForKey(event.key, this.isOpen);
    if (intent === INTENT.NONE) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.runIntent(intent);
  }

  handleSearchInput(event) {
    this.searchTerm = event.target.value;
    this.resetActiveOption();
  }

  handleFocusOut(event) {
    if (this.refs.container.contains(event.relatedTarget)) {
      return;
    }
    this.closeDropdown();
    this.isErrorVisible = true;
  }

  handleDropdownMouseDown(event) {
    // Keeps focus on the input so clicking inside the dropdown doesn't close it.
    event.preventDefault();
  }

  handleOptionClick(event) {
    const value = event.currentTarget.dataset.value;
    this.activateOption(value);
    this.commitSelection(toggleValue(this._value, value, this._maxSelections));
  }

  handleSelectAll() {
    this.commitSelection(
      addValues(this._value, this.visibleValues(), this._maxSelections)
    );
  }

  handleClearAll() {
    this.commitSelection(removeValues(this._value, this.visibleValues()));
  }

  handlePillRemove(event) {
    this.commitSelection(removeValues(this._value, [event.detail.value]));
  }

  // ----- Internal actions -----

  runIntent(intent) {
    if (isNavigationIntent(intent)) {
      this.moveActiveOption(intent);
      return;
    }
    const actions = {
      [INTENT.OPEN]: () => this.openDropdownWithFirstOptionActive(),
      [INTENT.CLOSE]: () => this.closeDropdown(),
      [INTENT.TOGGLE]: () => this.toggleActiveOption()
    };
    actions[intent]();
  }

  // Mouse open: nothing is highlighted until the user clicks or uses the arrow keys.
  openDropdown() {
    if (this.disabled || this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.searchTerm = "";
    this.activeIndex = -1;
  }

  // Keyboard open: the first option is highlighted, as in the ARIA combobox pattern.
  openDropdownWithFirstOptionActive() {
    this.openDropdown();
    if (this.isOpen) {
      this.resetActiveOption();
    }
  }

  closeDropdown() {
    this.isOpen = false;
    this.searchTerm = "";
    this.activeIndex = -1;
  }

  resetActiveOption() {
    this.activeIndex = firstEnabledIndex(this.optionViews);
    this._shouldScrollToActiveOption = true;
  }

  activateOption(value) {
    this.activeIndex = this.optionViews.findIndex(
      (view) => view.value === value
    );
  }

  moveActiveOption(intent) {
    this.activeIndex = moveActiveIndex(
      this.optionViews,
      this.activeIndex,
      intent
    );
    this._shouldScrollToActiveOption = true;
  }

  toggleActiveOption() {
    const activeView = this.optionViews[this.activeIndex];
    if (activeView) {
      this.commitSelection(
        toggleValue(this._value, activeView.value, this._maxSelections)
      );
    }
  }

  visibleValues() {
    return this.visibleOptions.map((option) => option.value);
  }

  commitSelection(newValues) {
    if (haveSameValues(this._value, newValues)) {
      return;
    }
    this._value = newValues;
    this.dispatchChange();
  }

  dispatchChange() {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          value: [...this._value],
          selectedOptions: this.selectedOptions
        }
      })
    );
  }

  scrollActiveOptionIntoView() {
    const activeOption = this.template.querySelector(ACTIVE_OPTION_SELECTOR);
    activeOption?.scrollIntoView?.({ block: "nearest" });
  }
}
