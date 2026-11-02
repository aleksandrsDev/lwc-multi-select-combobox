import { formatLabel } from "./formatLabel";

const VALID_STATE = Object.freeze({
  valid: true,
  valueMissing: false,
  rangeOverflow: false,
  customError: false
});

/**
 * Computes a ValidityState-like object. A disabled field is always valid, like base components.
 * @param {object} state
 * @param {boolean} state.disabled
 * @param {boolean} state.required
 * @param {number} state.selectedCount
 * @param {number|undefined} state.maxSelections normalized limit
 * @param {string} state.customMessage message set through setCustomValidity()
 * @returns {{valid: boolean, valueMissing: boolean, rangeOverflow: boolean, customError: boolean}}
 */
export function computeValidity({
  disabled,
  required,
  selectedCount,
  maxSelections,
  customMessage
}) {
  if (disabled) {
    return { ...VALID_STATE };
  }
  const valueMissing = Boolean(required) && selectedCount === 0;
  const rangeOverflow =
    maxSelections !== undefined && selectedCount > maxSelections;
  const customError = Boolean(customMessage);
  return {
    valid: !(valueMissing || rangeOverflow || customError),
    valueMissing,
    rangeOverflow,
    customError
  };
}

/**
 * Picks the message for the first failing check: custom error, then missing value, then range overflow.
 * @param {object} validity result of computeValidity()
 * @param {object} messages
 * @param {string} messages.customMessage
 * @param {string} messages.valueMissing
 * @param {string} messages.rangeOverflow template with `{0}` for the limit
 * @param {number|undefined} maxSelections
 * @returns {string} empty when valid
 */
export function errorMessageFor(validity, messages, maxSelections) {
  if (validity.customError) {
    return messages.customMessage;
  }
  if (validity.valueMissing) {
    return messages.valueMissing;
  }
  if (validity.rangeOverflow) {
    return formatLabel(messages.rangeOverflow, maxSelections);
  }
  return "";
}
