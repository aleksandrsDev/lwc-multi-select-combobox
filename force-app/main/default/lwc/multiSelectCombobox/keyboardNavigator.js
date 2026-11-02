/**
 * Maps keys to user intents and moves the active option index. Navigation skips disabled
 * items and doesn't wrap around at the ends of the list.
 */

export const INTENT = Object.freeze({
  OPEN: "open",
  CLOSE: "close",
  TOGGLE: "toggle",
  NEXT: "next",
  PREVIOUS: "previous",
  FIRST: "first",
  LAST: "last",
  NONE: "none"
});

const NOT_FOUND = -1;

// Space is absent from the open map: while open, the input is a search field and Space types a space.
const OPEN_STATE_KEYS = Object.freeze({
  ArrowDown: INTENT.NEXT,
  ArrowUp: INTENT.PREVIOUS,
  Home: INTENT.FIRST,
  End: INTENT.LAST,
  Enter: INTENT.TOGGLE,
  Escape: INTENT.CLOSE
});

const CLOSED_STATE_KEYS = Object.freeze({
  ArrowDown: INTENT.OPEN,
  ArrowUp: INTENT.OPEN,
  Enter: INTENT.OPEN,
  " ": INTENT.OPEN
});

const MOVES = Object.freeze({
  [INTENT.NEXT]: (items, current) => findEnabledIndex(items, current + 1, 1),
  [INTENT.PREVIOUS]: (items, current) => previousEnabledIndex(items, current),
  [INTENT.FIRST]: (items) => firstEnabledIndex(items),
  [INTENT.LAST]: (items) => lastEnabledIndex(items)
});

/**
 * @param {string} key KeyboardEvent.key
 * @param {boolean} isOpen whether the dropdown is open
 * @returns {string} one of INTENT
 */
export function intentForKey(key, isOpen) {
  const keyMap = isOpen ? OPEN_STATE_KEYS : CLOSED_STATE_KEYS;
  return keyMap[key] ?? INTENT.NONE;
}

/**
 * @returns {boolean} true for intents that only move the active option
 */
export function isNavigationIntent(intent) {
  return Object.hasOwn(MOVES, intent);
}

/**
 * Returns the new active index for a navigation intent. Stays on the current index when there's
 * nowhere to move (end of list, only disabled items, or a non-navigation intent).
 * @param {{disabled: boolean}[]} items
 * @param {number} currentIndex -1 when nothing is active
 * @param {string} intent
 * @returns {number}
 */
export function moveActiveIndex(items, currentIndex, intent) {
  const move = MOVES[intent];
  if (!move) {
    return currentIndex;
  }
  const nextIndex = move(items, currentIndex);
  return nextIndex === NOT_FOUND ? currentIndex : nextIndex;
}

/**
 * @returns {number} index of the first enabled item, or -1
 */
export function firstEnabledIndex(items) {
  return findEnabledIndex(items, 0, 1);
}

// With nothing active, "previous" starts from the end of the list.
function previousEnabledIndex(items, currentIndex) {
  if (currentIndex < 0) {
    return lastEnabledIndex(items);
  }
  return findEnabledIndex(items, currentIndex - 1, -1);
}

function lastEnabledIndex(items) {
  return findEnabledIndex(items, items.length - 1, -1);
}

function findEnabledIndex(items, startIndex, step) {
  for (
    let index = startIndex;
    index >= 0 && index < items.length;
    index += step
  ) {
    if (!items[index].disabled) {
      return index;
    }
  }
  return NOT_FOUND;
}
