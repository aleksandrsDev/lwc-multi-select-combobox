const PLACEHOLDER_PATTERN = /\{(?<index>\d+)\}/gu;

/**
 * Replaces `{0}`, `{1}`, ... in a label template with the given arguments.
 * Placeholders without a matching argument are left untouched.
 * @param {string} template
 * @param {...*} args
 * @returns {string}
 */
export function formatLabel(template, ...args) {
  return String(template ?? "").replace(PLACEHOLDER_PATTERN, (match, index) =>
    argumentOrPlaceholder(args, index, match)
  );
}

function argumentOrPlaceholder(args, index, placeholder) {
  return index < args.length ? String(args[index]) : placeholder;
}
