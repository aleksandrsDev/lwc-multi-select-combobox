/**
 * Pure conversions between multi-select picklist data and the combobox contract.
 */

const PICKLIST_DELIMITER = ";";
const FIELD_PATH_SEPARATOR = ".";

/**
 * Splits a multi-select picklist string (`'a;b'`) into values. Blank entries and surrounding spaces are dropped.
 * @param {*} value
 * @returns {string[]}
 */
export function parsePicklistValue(value) {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split(PICKLIST_DELIMITER)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Joins values into a multi-select picklist string.
 * @param {string[]} values
 * @returns {string}
 */
export function formatPicklistValue(values) {
  return values.join(PICKLIST_DELIMITER);
}

/**
 * Resolves the object and the qualified field name from the wrapper inputs.
 * The field may be given as `Industry` (needs the object) or as `Account.Industry`.
 * @param {string} objectApiName
 * @param {string} fieldApiName
 * @returns {{objectApiName: string|undefined, qualifiedFieldApiName: string|undefined}}
 */
export function resolveFieldReference(objectApiName, fieldApiName) {
  if (!fieldApiName) {
    return { objectApiName, qualifiedFieldApiName: undefined };
  }
  if (fieldApiName.includes(FIELD_PATH_SEPARATOR)) {
    const [fieldObjectApiName] = fieldApiName.split(FIELD_PATH_SEPARATOR);
    return {
      objectApiName: objectApiName || fieldObjectApiName,
      qualifiedFieldApiName: fieldApiName
    };
  }
  const qualifiedFieldApiName = objectApiName
    ? `${objectApiName}${FIELD_PATH_SEPARATOR}${fieldApiName}`
    : undefined;
  return { objectApiName, qualifiedFieldApiName };
}

/**
 * Maps getPicklistValues data to combobox options.
 * @param {{values?: {label: string, value: string}[]}} picklistData
 * @returns {{label: string, value: string}[]}
 */
export function toComboboxOptions(picklistData) {
  return (picklistData?.values ?? []).map(({ label, value }) => ({
    label,
    value
  }));
}
