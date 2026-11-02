/**
 * SLDS class names for each visual state. Keeping them here keeps the template free of
 * class-building logic and makes every state testable without the DOM.
 */

export const VARIANT = Object.freeze({
  STANDARD: "standard",
  LABEL_HIDDEN: "label-hidden",
  LABEL_INLINE: "label-inline",
  LABEL_STACKED: "label-stacked"
});

const VARIANT_FORM_ELEMENT_CLASS = Object.freeze({
  [VARIANT.LABEL_INLINE]: "slds-form-element_horizontal",
  [VARIANT.LABEL_STACKED]: "slds-form-element_stacked"
});

/**
 * @param {*} variant requested variant
 * @returns {string} a VARIANT value; unknown values fall back to standard
 */
export function normalizeVariant(variant) {
  return Object.values(VARIANT).includes(variant) ? variant : VARIANT.STANDARD;
}

/**
 * @returns {string} classes of the outer form element
 */
export function formElementClass(variant, hasError) {
  return joinClasses(
    "slds-form-element",
    VARIANT_FORM_ELEMENT_CLASS[variant],
    hasError && "slds-has-error"
  );
}

/**
 * @returns {string} classes of the label; hidden variant keeps it for assistive technology only
 */
export function labelClass(variant) {
  return joinClasses(
    "slds-form-element__label",
    variant === VARIANT.LABEL_HIDDEN && "slds-assistive-text"
  );
}

/**
 * @returns {string} classes of the combobox dropdown trigger
 */
export function comboboxClass(isOpen) {
  return joinClasses(
    "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click",
    isOpen && "slds-is-open"
  );
}

/**
 * @param {object} state
 * @param {boolean} state.selected
 * @param {boolean} state.active option highlighted by keyboard navigation
 * @param {boolean} state.disabled
 * @returns {string} classes of one listbox option
 */
export function optionClass({ selected, active, disabled }) {
  return joinClasses(
    "slds-media slds-listbox__option slds-listbox__option_plain slds-media_small",
    selected && "slds-is-selected",
    active && "slds-has-focus",
    disabled && "slds-text-color_weak"
  );
}

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}
