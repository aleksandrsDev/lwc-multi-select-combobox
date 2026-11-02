# Plan: LWC Multi-Select Combobox

Status: implemented (S0–S9) · Created 2026-11-02 · API 68.0

## 1. Brainstorm handoff (source of truth)

- **Goal:** A reusable multi-select dropdown for other LWCs that looks and behaves like a native `lightning-combobox`.
- **Approach:** Custom `multiSelectCombobox` on the SLDS multi-select combobox blueprint. Input and listbox share one
  shadow template (ARIA ID references). Logic lives in pure JS modules inside the bundle. One shadow child renders the
  selection (pills/text). A separate thin wrapper `picklistMultiSelect` wires picklist values.
- **Rejected:** `lightning-dual-listbox` (two lists, not a dropdown); `lightning-checkbox-group` (different kind of
  component); built-in field wiring in the base component (mixes UI and data loading); fine-grained shadow children for
  input/listbox/option (ARIA ID refs break across shadow roots,
  [docs](https://developer.salesforce.com/docs/platform/lwc/guide/create-mixed-shadow.html)); light-DOM children
  (event plumbing, lost encapsulation).
- **Verified by:** Jest scenario tests + `sf code-analyzer run` with no real violations remaining.

## 2. Decisions made while planning — please confirm

| #   | Decision                                                                                                                                                                                                                       | Why                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Search is the combobox input itself** (SLDS "autocomplete" pattern): when the dropdown is open the input is editable and filters; when closed it shows the selection summary. Not a separate search box inside the dropdown. | `aria-activedescendant` must sit on the focused element and point to options in the same shadow root. A `lightning-input` search box keeps its real `<input>` in its own shadow root, so it can't reference our options. One focusable element is also what screen readers expect from a combobox. |
| P2  | The combobox `<input>` is a native element with SLDS classes, not `lightning-input`. Base components are used everywhere else: `lightning-icon`, `lightning-pill-container`, `lightning-helptext`, `lightning-button`.         | Same ARIA reason as P1.                                                                                                                                                                                                                                                                            |
| P3  | **Values not present in `options` are kept** in `value` but not displayed and not included in `selectedOptions`.                                                                                                               | The wrapper loads options asynchronously, so `value` often arrives first. Dropping unknown values would silently lose data.                                                                                                                                                                        |
| P4  | **`max-selections` blocks further selection**: once the limit is reached, unselected options become `aria-disabled`. `checkValidity()` still reports `rangeOverflow` if `value` was set programmatically over the limit.       | Preventing a mistake is friendlier than reporting it afterwards.                                                                                                                                                                                                                                   |
| P5  | Text display shows labels joined by `, ` for up to **3** selected, then "**N options selected**" (internal constant, not `@api`).                                                                                              | Resolves the open threshold question.                                                                                                                                                                                                                                                              |
| P6  | ~~All user-facing strings are Custom Labels.~~ **Reversed 2026-11-02:** English only; strings live in `uiText.js` (combobox) and a constant in `picklistMultiSelect.js`.                                                       | User decision: simpler code, no translation needed. `uiText.js` is the single place to switch back to labels later.                                                                                                                                                                                |

## 3. Public API

### `c-multi-select-combobox`

| Kind   | Name                                                              | Type / default                                                            | Notes                                                                                                                      |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| prop   | `label`                                                           | string                                                                    | Required for accessibility, even with `label-hidden`.                                                                      |
| prop   | `options`                                                         | `{label, value}[]`, `[]`                                                  | Defensive copy; `value` is the key.                                                                                        |
| prop   | `value`                                                           | `string[]`, `[]`                                                          | Getter returns a copy. Setter accepts an array; non-arrays are treated as `[]`.                                            |
| prop   | `placeholder`                                                     | string, no default                                                        |                                                                                                                            |
| prop   | `selectionDisplay`                                                | `'pills'` \| `'text'`, `'pills'`                                          | Invalid values fall back to `'pills'`.                                                                                     |
| prop   | `variant`                                                         | `'standard'` \| `'label-hidden'` \| `'label-inline'` \| `'label-stacked'` | Same values as `lightning-combobox`.                                                                                       |
| prop   | `fieldLevelHelp`                                                  | string                                                                    | Renders `lightning-helptext`.                                                                                              |
| prop   | `disabled`                                                        | boolean                                                                   |                                                                                                                            |
| prop   | `required`                                                        | boolean                                                                   |                                                                                                                            |
| prop   | `maxSelections`                                                   | number                                                                    | Unset means unlimited.                                                                                                     |
| prop   | `messageWhenValueMissing`, `messageWhenRangeOverflow`             | string                                                                    | Override default messages.                                                                                                 |
| prop   | `showSelectAll`                                                   | boolean, false                                                            | Adds "Select all / Clear all" row at the top of the dropdown.                                                              |
| prop   | `validity` (read-only)                                            | `{valid, valueMissing, rangeOverflow, customError}`                       |                                                                                                                            |
| method | `clearSelection()`                                                |                                                                           | Fires one `change`.                                                                                                        |
| method | `checkValidity()` / `reportValidity()` / `setCustomValidity(msg)` |                                                                           | Same semantics as base components.                                                                                         |
| method | `focus()` / `blur()`                                              |                                                                           |                                                                                                                            |
| event  | `change`                                                          | `detail: { value: string[], selectedOptions: {label, value}[] }`          | Fires on every toggle; bulk actions fire once. Not fired for programmatic `value` sets. `bubbles: false, composed: false`. |

### `c-picklist-multi-select`

`object-api-name`, `field-api-name`, `record-type-id` (optional; defaults to the object's default record type via
`getObjectInfo`), `value` as `'a;b'` string, plus pass-through of `label`, `placeholder`, `selection-display`,
`variant`, `field-level-help`, `disabled`, `required`, `max-selections`, `show-select-all`. Re-fires `change` with
`detail: { value: 'a;b', values: string[], selectedOptions }`. Proxies `clearSelection` and the validity methods.
Shows a `lightning-spinner` while loading and an inline error message if the wire fails.

## 4. File layout

```
force-app/main/default/
  lwc/
    multiSelectCombobox/
      multiSelectCombobox.html / .js / .js-meta.xml    # orchestrator: state, @api surface, event wiring
      selectionModel.js        # toggle, selectAll, clear, isSelected, resolveSelectedOptions, isAtLimit
      optionFilter.js          # filterOptions(options, term): case-insensitive label match
      keyboardNavigator.js     # nextIndex/prevIndex/first/last, skipping disabled; key → intent mapping
      validation.js            # computeValidity(state), messageFor(validity, overrides)
      displayText.js           # summaryText(selectedOptions, placeholder)
      optionViewModel.js       # builds the render model: ids, aria-selected, aria-disabled, css classes
      uiText.js                # all user-facing strings (English only)
      __tests__/
        selectionModel.test.js, optionFilter.test.js, keyboardNavigator.test.js,
        validation.test.js, displayText.test.js, optionViewModel.test.js,
        multiSelectCombobox.test.js            # DOM/behavior scenarios
    multiSelectComboboxSelection/              # shadow child: pills (lightning-pill-container) only
      ... + __tests__/multiSelectComboboxSelection.test.js
    picklistMultiSelect/
      ... + __tests__/picklistMultiSelect.test.js (+ data/ JSON fixtures for wire adapters)
```

All `js-meta.xml` have `isExposed=false`, no targets. No `.css` files. Each helper module exports small
single-purpose pure functions; the orchestrator only translates DOM events into calls and assigns state.

Text mode needs no child: the summary is the input's own value when the dropdown is closed.

## 5. Implementation slices

Each slice ends green on: `npm run lint`, `npm test`, `npm run prettier:verify`.

**S0 — Baseline.** `npm install`; create folders; run lint/test/analyzer once to confirm the toolchain on an empty
project.

**S1 — Pure modules: selection + display text.** `selectionModel.js`, `displayText.js`, `uiText.js`.
Unit tests only.

**S2 — Combobox shell (pointer only).** Label/variant, input with summary text, dropdown open/close (input click,
chevron, outside focusout using `relatedTarget`, Esc), option list with check icons, click to toggle (mousedown
`preventDefault` keeps focus on the input), `change` event, `value` get/set, `clearSelection()`, text display mode,
`disabled`, `placeholder`, `fieldLevelHelp`. `optionViewModel.js`.

**S3 — Pills display.** `multiSelectComboboxSelection` child with `lightning-pill-container`; pill remove → `change`.
Hidden when `disabled` removes interactivity (pills remain, remove disabled).

**S4 — Keyboard + ARIA.** `keyboardNavigator.js`. ArrowDown/Up (opens when closed), Home/End, Enter/Space toggle
active option, Esc closes, Tab closes and leaves. `role=combobox`, `aria-expanded`, `aria-controls`,
`aria-activedescendant`, `role=listbox` with `aria-multiselectable=true`, `role=option` with `aria-selected`.
Active option scrolls into view.

**S5 — Search.** `optionFilter.js`; the input becomes editable while open (P1); filtering resets on close; "No matches"
empty state; active index resets to first match.

**S6 — Validation.** `validation.js`; `required`, `maxSelections` (P4), message overrides,
`checkValidity/reportValidity/setCustomValidity`, `validity` getter, `slds-has-error` + help text with
`aria-describedby`. Errors appear on `reportValidity()` or after the first blur (like base components).

**S7 — Select all / Clear all.** `showSelectAll` row; respects the filter (acts on visible options only) and
`maxSelections`; one `change` per action.

**S8 — `picklistMultiSelect` wrapper.** `getObjectInfo` → default record type when none is given;
`getPicklistValues` → options; `'a;b'` ⇄ array conversion; loading and error states; proxied methods.

**S9 — Hardening.** `sf code-analyzer run`, fix real violations, document false positives (rule + reason) in §7;
coverage review for gaps; README usage section.

## 6. Test scenarios (behavior, not coverage)

Pure modules: every function is tested with normal input, empty input, duplicates, unknown values, and
limit boundaries (limit-1, limit, limit+1).

`multiSelectCombobox` DOM tests:

- **Rendering:** label in each variant; placeholder when empty; summary for 1, 3, and 4+ selections; the
  `selectionDisplay` switch; an invalid `selectionDisplay` falls back to pills; help text rendered only when set.
- **Value contract:** setting `value` renders the selection without firing `change`; the getter returns a copy
  (mutating it doesn't affect the component); unknown values are kept (P3); options arriving after the value
  render the selection; options that change drop the matching entries from `selectedOptions`, but the values stay.
- **Interaction:** open/close via click, chevron, Esc, and focus leaving; toggling on and off fires `change` with the
  full selection and the labels in option order; clicking an option keeps the dropdown open; `clearSelection()`
  fires once; pill remove deselects.
- **Keyboard:** each key above, including wrap or no-wrap at the ends (decide in S4: no wrap, matching SLDS);
  disabled options are skipped; `aria-activedescendant` matches the highlighted option.
- **Search:** case-insensitive filter, empty state, reset on close, Enter toggles the highlighted filtered option,
  selected options that are filtered out stay selected.
- **Validation:** required with no value is invalid; `reportValidity` shows the message; a custom message wins;
  `setCustomValidity('')` clears it; at the max limit, the remaining options are disabled and can't be toggled;
  a programmatic value over the max gives `rangeOverflow`.
- **Disabled:** no open, no toggle, no pill remove, and the input is not focusable.
- **Select all:** selects only the visible options, respects the max, fires one `change`.
- **Accessibility:** `await expect(element).toBeAccessible()` (sfdx-lwc-jest's axe matcher) in the closed, open,
  and error states.

`picklistMultiSelect`: the wire emits object info and then picklist values, which produces the options; an
explicit record type skips the default; `'a;b'` input selects two; `change` re-emits as a string; the wire error
shows the message; the loading spinner appears until data arrives; proxied methods delegate.

A regression guard: each bug fixed later gets a test named after the scenario before the fix.

## 7. Code Analyzer

Command (v5 plugin is installed, 5.16.0):

```
sf code-analyzer run --workspace . --target force-app --view table
```

Default selector (`Recommended`) first; then one pass with `--rule-selector all` to review the extras. Record
each ignored finding here as "rule — file — why it's a false positive".

**Result (S9):** the Recommended selector reports **0 violations**. The only Recommended finding was 16×
`@lwc/lwc/no-unexpected-wire-adapter-usages` in `picklistMultiSelect.test.js`. The project ESLint config already
disables that rule for `*.test.js`, so `code-analyzer.yml` now points the analyzer at `eslint.config.js` (which got
an explicit `settings.jest.version` so the analyzer's Jest rules load). A planted `eval` probe confirmed the
analyzer's ESLint engine still runs with this config.

The `all` pass: two real findings fixed in `formatLabel.js` (named capture group, `u` flag). Everything else
(source files only; test files get the same style rules and the same reasons apply) is ignored:

| Rule                                                                                                                            | File                          | Reason ignored                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@lwc/lwc/no-unexpected-wire-adapter-usages` (Recommended)                                                                      | `picklistMultiSelect.test.js` | `adapter.emit()` / `.error()` / `.getLastConfig()` is the documented sfdx-lwc-jest pattern for testing wire adapters.                                |
| `pmd:GlobalVariable`                                                                                                            | all JS                        | PMD's JavaScript parser doesn't understand class fields and block-scoped `const` in ES modules; nothing is global.                                   |
| `eslint:no-underscore-dangle`                                                                                                   | components                    | `_field` backing fields for `@api` getter/setter pairs are the pattern the LWC docs recommend.                                                       |
| `eslint:class-methods-use-this`                                                                                                 | `multiSelectCombobox.js`      | `handleDropdownMouseDown` is a template event handler; it has to be an instance method.                                                              |
| `eslint:max-lines` (417 > 300)                                                                                                  | `multiSelectCombobox.js`      | Every method is short and single-purpose; the length is JSDoc on the public API plus Prettier wrapping. All logic already lives in the pure modules. |
| `eslint:func-style`, `sort-keys`, `sort-imports`, `one-var`, `no-ternary`, `no-undefined`, `no-magic-numbers` (0/1/-1, indexes) | all JS                        | Stylistic rules from the `all` set that conflict with each other and with the project's Prettier/ESLint conventions. Not in Recommended.             |

## 8. Where the build differs from this plan

- **Space while open** is typed into the search field instead of toggling (it toggles nowhere else either). Enter
  toggles. Space still opens the closed combobox.
- **Tab while open** moves into the Select all / Clear all buttons when they're shown (the dropdown stays open),
  otherwise it leaves and closes. That keeps the bulk actions reachable from the keyboard.
- **Pills mode** keeps the closed input value empty; while something is selected, its placeholder shows
  "N option(s) selected" (singular label for 1). The summary as input _value_ is used only in text mode.
- **`value` order** is selection order; `selectedOptions` and the pills follow option order.
- **Disabled pills** render as read-only SLDS pills (no remove button) instead of `lightning-pill-container`,
  which has no read-only mode.
- **Test tooling:** added `@sa11y/jest` (dev dependency) plus `jest-sa11y-setup.js` for `toBeAccessible()`,
  because sfdx-lwc-jest doesn't bundle it. Tests import `createElement` from `@lwc/engine-dom` (LWC1702).

## 9. Still open

- How it works in a real org: a manual check in a scratch org (`config/project-scratch-def.json` exists)
  with a demo parent component. A demo component isn't in scope unless requested.
- Dropdown overflow inside containers with `overflow: hidden` (e.g. a datatable cell or a modal body) can clip
  the dropdown. SLDS-only styling can't fix this without a portal; document it as a known limitation unless it
  becomes a requirement.
