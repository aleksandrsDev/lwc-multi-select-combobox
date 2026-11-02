import {
  firstEnabledIndex,
  intentForKey,
  INTENT,
  isNavigationIntent,
  moveActiveIndex
} from "../keyboardNavigator";

const item = (disabled = false) => ({ disabled });

describe("keyboardNavigator", () => {
  describe("intentForKey", () => {
    it.each([
      ["ArrowDown", INTENT.OPEN],
      ["ArrowUp", INTENT.OPEN],
      ["Enter", INTENT.OPEN],
      [" ", INTENT.OPEN],
      ["Escape", INTENT.NONE],
      ["Home", INTENT.NONE],
      ["a", INTENT.NONE],
      ["Tab", INTENT.NONE]
    ])("closed: %p -> %p", (key, intent) => {
      expect(intentForKey(key, false)).toBe(intent);
    });

    it.each([
      ["ArrowDown", INTENT.NEXT],
      ["ArrowUp", INTENT.PREVIOUS],
      ["Home", INTENT.FIRST],
      ["End", INTENT.LAST],
      ["Enter", INTENT.TOGGLE],
      ["Escape", INTENT.CLOSE],
      [" ", INTENT.NONE],
      ["a", INTENT.NONE],
      ["Tab", INTENT.NONE]
    ])("open: %p -> %p", (key, intent) => {
      expect(intentForKey(key, true)).toBe(intent);
    });
  });

  describe("isNavigationIntent", () => {
    it.each([
      [INTENT.NEXT, true],
      [INTENT.PREVIOUS, true],
      [INTENT.FIRST, true],
      [INTENT.LAST, true],
      [INTENT.OPEN, false],
      [INTENT.CLOSE, false],
      [INTENT.TOGGLE, false],
      [INTENT.NONE, false]
    ])("%p -> %p", (intent, expected) => {
      expect(isNavigationIntent(intent)).toBe(expected);
    });
  });

  describe("firstEnabledIndex", () => {
    it("skips leading disabled items", () => {
      expect(firstEnabledIndex([item(true), item(true), item()])).toBe(2);
    });

    it("returns -1 for an empty or fully disabled list", () => {
      expect(firstEnabledIndex([])).toBe(-1);
      expect(firstEnabledIndex([item(true)])).toBe(-1);
    });
  });

  describe("moveActiveIndex", () => {
    const items = [item(), item(true), item(), item()];

    it("NEXT skips disabled items", () => {
      expect(moveActiveIndex(items, 0, INTENT.NEXT)).toBe(2);
    });

    it("NEXT stays on the last item instead of wrapping", () => {
      expect(moveActiveIndex(items, 3, INTENT.NEXT)).toBe(3);
    });

    it("NEXT from nothing active goes to the first enabled item", () => {
      expect(moveActiveIndex([item(true), item()], -1, INTENT.NEXT)).toBe(1);
    });

    it("PREVIOUS skips disabled items", () => {
      expect(moveActiveIndex(items, 2, INTENT.PREVIOUS)).toBe(0);
    });

    it("PREVIOUS stays on the first item instead of wrapping", () => {
      expect(moveActiveIndex(items, 0, INTENT.PREVIOUS)).toBe(0);
    });

    it("PREVIOUS from nothing active goes to the last enabled item", () => {
      expect(
        moveActiveIndex([item(), item(), item(true)], -1, INTENT.PREVIOUS)
      ).toBe(1);
    });

    it("FIRST and LAST jump to the enabled ends", () => {
      const list = [item(true), item(), item(), item(true)];
      expect(moveActiveIndex(list, 2, INTENT.FIRST)).toBe(1);
      expect(moveActiveIndex(list, 1, INTENT.LAST)).toBe(2);
    });

    it("stays put when every item is disabled", () => {
      expect(moveActiveIndex([item(true), item(true)], -1, INTENT.NEXT)).toBe(
        -1
      );
    });

    it("stays put on an empty list", () => {
      expect(moveActiveIndex([], -1, INTENT.LAST)).toBe(-1);
    });

    it("ignores non-navigation intents", () => {
      expect(moveActiveIndex(items, 2, INTENT.TOGGLE)).toBe(2);
    });
  });
});
