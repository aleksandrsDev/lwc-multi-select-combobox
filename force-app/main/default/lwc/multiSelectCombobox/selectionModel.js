/**
 * Pure functions for the selection state. Selected values are plain string arrays
 * that keep the order in which they were selected. No function mutates its input.
 */

/**
 * Converts any input into a de-duplicated array of strings. Non-arrays become [].
 * @param {*} value
 * @returns {string[]}
 */
export function normalizeValues(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const strings = value.filter(isPresent).map(String);
  return [...new Set(strings)];
}

/**
 * Converts any input into an array of `{ label, value }` copies. Entries without a value are dropped;
 * a missing label falls back to the value.
 * @param {*} options
 * @returns {{label: string, value: string}[]}
 */
export function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options.filter((option) => isPresent(option?.value)).map(toOption);
}

/**
 * Converts a max-selections input (number or numeric string) into a positive integer, or undefined for "no limit".
 * @param {*} limit
 * @returns {number|undefined}
 */
export function normalizeLimit(limit) {
  const parsed = Number(limit);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * @param {string[]} selectedValues
 * @param {number|undefined} maxSelections normalized limit
 * @returns {boolean} true when no further value may be added
 */
export function isAtLimit(selectedValues, maxSelections) {
  return maxSelections !== undefined && selectedValues.length >= maxSelections;
}

/**
 * Adds the value when it's not selected, removes it when it is. Adding is ignored at the limit.
 * @returns {string[]}
 */
export function toggleValue(selectedValues, value, maxSelections) {
  return selectedValues.includes(value)
    ? removeValues(selectedValues, [value])
    : addValues(selectedValues, [value], maxSelections);
}

/**
 * Appends the values that aren't selected yet, stopping at the limit.
 * @returns {string[]}
 */
export function addValues(selectedValues, values, maxSelections) {
  const result = [...selectedValues];
  for (const value of values) {
    if (isAtLimit(result, maxSelections)) {
      break;
    }
    if (!result.includes(value)) {
      result.push(value);
    }
  }
  return result;
}

/**
 * @returns {string[]} the selection without the given values
 */
export function removeValues(selectedValues, values) {
  return selectedValues.filter((value) => !values.includes(value));
}

/**
 * Returns copies of the options that are selected, in option order.
 * Selected values that match no option are skipped.
 * @returns {{label: string, value: string}[]}
 */
export function resolveSelectedOptions(options, selectedValues) {
  return options
    .filter((option) => selectedValues.includes(option.value))
    .map(toOption);
}

/**
 * @returns {boolean} true when both arrays hold the same values in the same order
 */
export function haveSameValues(first, second) {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function isPresent(value) {
  return value !== null && value !== undefined;
}

function toOption({ label, value }) {
  const stringValue = String(value);
  return {
    label: isPresent(label) ? String(label) : stringValue,
    value: stringValue
  };
}
