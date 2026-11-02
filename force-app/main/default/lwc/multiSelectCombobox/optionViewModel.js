import { isAtLimit } from "./selectionModel";
import { optionClass } from "./styleClasses";

/**
 * Builds the render model of the listbox options. When the selection limit is reached,
 * every unselected option is disabled.
 * @param {object} params
 * @param {{label: string, value: string}[]} params.options options to render (already filtered)
 * @param {string[]} params.selectedValues
 * @param {number} params.activeIndex index of the keyboard-highlighted option, -1 for none
 * @param {number|undefined} params.maxSelections normalized limit
 * @returns {object[]} one view per option
 */
export function buildOptionViews({
  options,
  selectedValues,
  activeIndex,
  maxSelections
}) {
  const atLimit = isAtLimit(selectedValues, maxSelections);
  return options.map((option, index) =>
    buildOptionView(option, {
      index,
      selected: selectedValues.includes(option.value),
      active: index === activeIndex,
      atLimit
    })
  );
}

/**
 * @param {number} index
 * @returns {string} element id of the option at this index (unique within the template)
 */
export function optionId(index) {
  return `option-${index}`;
}

function buildOptionView(option, { index, selected, active, atLimit }) {
  const disabled = atLimit && !selected;
  return {
    key: option.value,
    id: optionId(index),
    label: option.label,
    value: option.value,
    selected,
    active,
    disabled,
    ariaSelected: String(selected),
    ariaDisabled: String(disabled),
    className: optionClass({ selected, active, disabled })
  };
}
