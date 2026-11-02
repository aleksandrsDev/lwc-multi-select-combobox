/**
 * Returns the options whose label contains the search term, ignoring case and surrounding spaces.
 * A blank term returns every option.
 * @param {{label: string, value: string}[]} options
 * @param {string} searchTerm
 * @returns {{label: string, value: string}[]}
 */
export function filterOptions(options, searchTerm) {
  const term = normalizeTerm(searchTerm);
  if (!term) {
    return options;
  }
  return options.filter((option) =>
    option.label.toLocaleLowerCase().includes(term)
  );
}

function normalizeTerm(searchTerm) {
  return String(searchTerm ?? "")
    .trim()
    .toLocaleLowerCase();
}
