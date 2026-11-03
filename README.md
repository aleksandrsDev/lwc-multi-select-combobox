# LWC Multi-Select Combobox

A multi-select dropdown for Lightning Web Components that looks and behaves like `lightning-combobox`, which only allows one value. It adds search, removable pills or a text summary, a selection limit and "Select all", with the same validation API as the base components. It's built on the SLDS combobox blueprint with SLDS classes only (no custom CSS), and it's meant to be used inside other LWCs: it isn't exposed to App Builder or Flow.

| Component                           | Purpose                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `c-multi-select-combobox`           | The combobox. `options` is `{ label, value }[]` and `value` is `string[]`.                                         |
| `c-picklist-multi-select`           | Wrapper that loads a picklist field's values through the UI API and uses the multi-select picklist format `'a;b'`. |
| `c-multi-select-combobox-selection` | Internal child that renders the selected pills. Not meant to be used directly.                                     |
| `c-multi-select-combobox-demo`      | Optional demo, one tile per feature (see [Demo](#demo)).                                                           |

## Demo

![Multi-select combobox demo](docs/images/demo.png)

`c-multi-select-combobox-demo` shows each feature in its own tile:

- **Pills (default), with help text:** removable pills under the input, and the count ("4 options selected") in the input.
- **Text display** (two tiles): the selected labels in the input, or the count once more than three are selected.
- **Required:** the "Complete this field." error is shown straight away.
- **Disabled:** greyed-out input and read-only pills.
- **Limit of 2 reached, with select all:** open in the screenshot. The limit is reached, so the unselected options are disabled.

To try it, add **Multi-Select Combobox Demo** to an app page in Lightning App Builder, or create a Lightning Component tab for it.

## Installation

This repository contains only the source (`force-app`), not a full Salesforce DX project. To install it:

1. Copy `force-app` into a Salesforce DX project. To start a new one, run `sf project generate --name my-project`. Its default `.forceignore` already keeps the `__tests__` folders out of deploys.
2. Deploy:

   ```sh
   sf project deploy start --source-dir force-app -o <org>
   ```

There's no Apex, permission set or other metadata to set up. The picklist wrapper reads picklist values through the UI API, as the running user.

The demo component is optional. To leave it out, delete the `lwc/multiSelectComboboxDemo` folder before deploying.

## Usage

<!-- prettier-ignore -->
```html
<c-multi-select-combobox
  label="Industries"
  options={industryOptions}
  value={selectedIndustries}
  max-selections="3"
  required
  onchange={handleIndustriesChange}
></c-multi-select-combobox>
```

```js
industryOptions = [
    { label: 'Banking', value: 'Banking' },
    { label: 'Energy', value: 'Energy' }
];
selectedIndustries = [];

handleIndustriesChange(event) {
    this.selectedIndustries = event.detail.value; // ['Banking', ...]
    // event.detail.selectedOptions -> [{ label, value }, ...]
}
```

Bound to a picklist field:

<!-- prettier-ignore -->
```html
<c-picklist-multi-select
  label="Industry"
  object-api-name="Account"
  field-api-name="Industry"
  value={industryString}
  onchange={handleChange}
></c-picklist-multi-select>
```

## API: `c-multi-select-combobox`

| Property                      | Default    | Description                                                                                                                                                                            |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`                       |            | Field label. Required for accessibility, even with `label-hidden`.                                                                                                                     |
| `options`                     | `[]`       | `{ label, value }[]`. The `value` identifies the option. Values are converted to strings, a missing `label` falls back to the value, and entries without a `value` are dropped.        |
| `value`                       | `[]`       | `string[]` of selected values, in the order they were selected. Duplicates are removed. Values that match no option are kept, so the value can arrive before the options.              |
| `selection-display`           | `pills`    | `pills`: removable pills under the input, and the count ("N options selected") in the input. `text`: the selected labels in the input, or the count once more than three are selected. |
| `variant`                     | `standard` | `standard`, `label-hidden`, `label-inline`, `label-stacked`.                                                                                                                           |
| `placeholder`                 |            | Text shown in the input while nothing is selected.                                                                                                                                     |
| `field-level-help`            |            | Help text in a tooltip next to the label.                                                                                                                                              |
| `disabled`                    | `false`    | No interaction; pills become read-only. A disabled field is always valid.                                                                                                              |
| `required`                    | `false`    | At least one value must be selected.                                                                                                                                                   |
| `max-selections`              |            | Positive integer limit. Once it's reached, the unselected options are disabled. Any other value means no limit.                                                                        |
| `show-select-all`             | `false`    | Adds "Select all" / "Clear all" buttons at the top of the dropdown. They act on the options matching the current search, and "Select all" stops at the limit.                          |
| `message-when-value-missing`  |            | Overrides "Complete this field."                                                                                                                                                       |
| `message-when-range-overflow` |            | Overrides "Select at most {0} options." `{0}` is replaced by the limit.                                                                                                                |
| `validity` (read-only)        |            | `{ valid, valueMissing, rangeOverflow, customError }`.                                                                                                                                 |

| Method                                                                | Description                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `clearSelection()`                                                    | Deselects everything and fires one `change` event (if anything was selected).   |
| `checkValidity()` / `reportValidity()` / `setCustomValidity(message)` | Same behavior as the base components. An empty message clears the custom error. |
| `focus()` / `blur()`                                                  | Moves focus to or from the input.                                               |

### `change` event

Fires on every user change (one event per "Select all" / "Clear all"), with `detail: { value: string[], selectedOptions: { label, value }[] }`. `selectedOptions` is in option order and leaves out values that match no option. The event doesn't bubble and isn't composed, so put the handler on the component itself. Setting `value` programmatically doesn't fire it.

### Behavior notes

- **Search:** while open, the input becomes a search field. It filters by label, case-insensitively, anywhere in the text.
- **Errors** are shown once the field loses focus or after `reportValidity()`, like the base components. The UI can't go over the limit, so `rangeOverflow` only happens when `value` is set with more values than `max-selections`.
- **Mouse:** opening with the mouse highlights nothing. Clicking an enabled option makes it the highlighted one, so the arrow keys continue from there.

### Keyboard

| Key                   | Closed                                        | Open                                                                                                |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ↓ / ↑ / Enter / Space | Opens and highlights the first enabled option | ↓ / ↑ move the highlight (no wrap, disabled options skipped); Enter toggles it; Space types a space |
| Home / End            |                                               | First / last enabled option                                                                         |
| Escape                |                                               | Closes; the event doesn't reach a surrounding modal                                                 |
| Typing                |                                               | Filters the options and highlights the first enabled match                                          |
| Tab                   | Leaves                                        | Moves to "Select all" / "Clear all" if shown, otherwise leaves and closes                           |

### Accessibility

The component follows the ARIA combobox pattern: the input has `role="combobox"` and points at the highlighted option with `aria-activedescendant`, the listbox is `aria-multiselectable`, and each option has `aria-selected` and `aria-disabled`. `required` sets `aria-required`, and the error message is linked with `aria-describedby` and announced through `aria-live`. With `label-hidden`, the label stays available to screen readers. The Jest tests run sa11y accessibility checks on the combobox, the pill list and the picklist wrapper.

## API: `c-picklist-multi-select`

| Property          | Description                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `object-api-name` | Object API name, e.g. `Account`. Optional when `field-api-name` is qualified.                           |
| `field-api-name`  | `Industry`, or qualified: `Account.Industry`.                                                           |
| `record-type-id`  | Record type for the picklist values. Defaults to the object's default record type.                      |
| `value`           | Selected values as one string, `'Banking;Energy'`. Spaces around entries and blank entries are dropped. |

Every other property and method of `c-multi-select-combobox` is passed through, except `options`, which comes from the field. A spinner shows while the values load, and "Unable to load picklist values." if they can't be loaded. The `change` detail is `{ value: 'a;b', values: string[], selectedOptions }`.

The wrapper works with any picklist field. Only a multi-select picklist field can store the `'a;b'` value, though: `Industry` in the example is a single-select picklist, so use it there for filtering, not for saving to the record.

## Limitations

- **Clipping:** the dropdown can be clipped inside containers with `overflow: hidden` (e.g. some modals or datatable cells). SLDS-only styling can't fix this without moving the dropdown elsewhere in the DOM.
- **English only:** the built-in texts are in `uiText.js`, not Custom Labels, so they can't be translated in Setup. The error messages can be overridden per field.
- **Used from code only:** no App Builder or Flow targets.

## Code map

| Path                                             | Responsibility                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `lwc/multiSelectCombobox/multiSelectCombobox.js` | UI state and the public API. Every decision is made in one of the pure modules below.                           |
| `lwc/multiSelectCombobox/selectionModel.js`      | Normalizing input; toggle / add / remove values; the limit                                                      |
| `lwc/multiSelectCombobox/optionFilter.js`        | Search filtering                                                                                                |
| `lwc/multiSelectCombobox/keyboardNavigator.js`   | Key → intent mapping; moving the highlighted option                                                             |
| `lwc/multiSelectCombobox/validation.js`          | Validity state and error message                                                                                |
| `lwc/multiSelectCombobox/displayText.js`         | Count and text-mode summary                                                                                     |
| `lwc/multiSelectCombobox/optionViewModel.js`     | Render model of the options (ids, ARIA state, classes)                                                          |
| `lwc/multiSelectCombobox/styleClasses.js`        | SLDS classes per visual state                                                                                   |
| `lwc/multiSelectCombobox/formatLabel.js`         | `{0}` placeholders in the UI text                                                                               |
| `lwc/multiSelectCombobox/uiText.js`              | All built-in user-facing strings                                                                                |
| `lwc/multiSelectComboboxSelection`               | Selected pills; reports a removal to the parent                                                                 |
| `lwc/picklistMultiSelect`                        | Picklist wrapper: `@wire` of `getObjectInfo` / `getPicklistValues`, value conversion in `picklistValueCodec.js` |
| `lwc/multiSelectComboboxDemo`                    | Demo card                                                                                                       |
| `lwc/*/__tests__`                                | Jest tests; not deployed                                                                                        |

The input and the listbox share one template on purpose: `aria-activedescendant` and `aria-controls` can't reference IDs in another component's shadow root.

## Development

The tests run inside the Salesforce DX project from [Installation](#installation). There's no Apex, so there are only Jest tests.

1. Install the dependencies with `npm install`. Projects created by `sf project generate` already include `@salesforce/sfdx-lwc-jest`. In a project without it, run `sf force lightning lwc test setup` first.
2. The tests use the `toBeAccessible()` matcher from sa11y, which isn't installed by default. Add it:

   ```sh
   npm install --save-dev @sa11y/jest
   ```

   Create `jest-sa11y-setup.js` in the project root:

   ```js
   const { setup } = require("@sa11y/jest");

   setup();
   ```

   And register it in `jest.config.js`:

   ```js
   const { jestConfig } = require("@salesforce/sfdx-lwc-jest/config");

   module.exports = {
     ...jestConfig,
     modulePathIgnorePatterns: ["<rootDir>/.localdevserver"],
     setupFilesAfterEnv: [
       ...(jestConfig.setupFilesAfterEnv || []),
       "<rootDir>/jest-sa11y-setup.js"
     ]
   };
   ```

3. Run the tests with `npx sfdx-lwc-jest --coverage`.

What the tests cover: each pure module on its own; the combobox in the DOM (rendering, the value contract, opening and closing, mouse and keyboard selection, both display modes, search, the limit, validation, disabled, select all / clear all, public methods) with sa11y checks; the pill list; the picklist wrapper with mocked wire adapters (loading, errors, value conversion, pass-through); and the demo.

Code Analyzer:

```sh
sf code-analyzer run --rule-selector Recommended --target force-app
```

It reports no violations in the component code. The only findings are `no-unexpected-wire-adapter-usages` in `picklistMultiSelect.test.js`: the test sends data through the mocked wire adapters, which the rule doesn't expect outside `@wire`.
