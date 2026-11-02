import { formatLabel } from "./formatLabel";

export const SELECTION_DISPLAY = Object.freeze({
  PILLS: "pills",
  TEXT: "text"
});

/** Above this many selected options, the text summary switches from labels to a count. */
export const MAX_LABELS_IN_SUMMARY = 3;

const LABEL_SEPARATOR = ", ";

/**
 * @param {*} display requested selection display
 * @returns {string} a SELECTION_DISPLAY value; unknown values fall back to pills
 */
export function normalizeSelectionDisplay(display) {
  return display === SELECTION_DISPLAY.TEXT
    ? SELECTION_DISPLAY.TEXT
    : SELECTION_DISPLAY.PILLS;
}

/**
 * Builds "N options selected", using the singular template for exactly one.
 * @param {number} count
 * @param {{singular: string, plural: string}} countTemplates label templates with `{0}` for the count
 * @returns {string} empty when the count is 0
 */
export function selectionCountText(count, countTemplates) {
  if (count === 0) {
    return "";
  }
  const template =
    count === 1 ? countTemplates.singular : countTemplates.plural;
  return formatLabel(template, count);
}

/**
 * Builds the text shown in the closed input for the text display mode:
 * the labels up to the threshold, the count above it.
 * @param {{label: string}[]} selectedOptions
 * @param {{singular: string, plural: string}} countTemplates
 * @returns {string} empty when nothing is selected
 */
export function summaryText(selectedOptions, countTemplates) {
  if (selectedOptions.length <= MAX_LABELS_IN_SUMMARY) {
    return selectedOptions.map((option) => option.label).join(LABEL_SEPARATOR);
  }
  return selectionCountText(selectedOptions.length, countTemplates);
}
