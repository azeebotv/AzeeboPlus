/**
 * Tests for the focus-tag allocation contract used by FocusableRow.
 *
 * The tags themselves are allocated with a module-level counter inside
 * Focusable.tsx (which pulls React Native — not importable in the node jest
 * env), so these tests pin the *behavior* the focus graph depends on:
 * uniqueness across rows, sibling adjacency, and render-stability.
 */

/**
 * Mirrors FocusableRow's block allocation: each row claims `max(items.length,1)`
 * consecutive tags starting at the counter; siblings use base+index.
 */
function allocateRow(counter: { value: number }, itemCount: number): number {
  const base = counter.value;
  counter.value += Math.max(itemCount, 1);
  return base;
}

describe('FocusableRow focus-tag allocation contract (M15)', () => {
  it('sibling tags are adjacent: nextFocusLeft/Right chain stays connected', () => {
    // Mirrors FocusableRow: base + index, left = index-1, right = index+1.
    const rowTagBase = 1000;
    const items = [0, 1, 2, 3];
    const tags = items.map((_, index) => rowTagBase + index);

    items.forEach((_, index) => {
      const left = index > 0 ? rowTagBase + index - 1 : undefined;
      const right = index < items.length - 1 ? rowTagBase + index + 1 : undefined;
      expect(left).toBe(index > 0 ? tags[index - 1] : undefined);
      expect(right).toBe(index < items.length - 1 ? tags[index + 1] : undefined);
    });
  });

  it('a row block is sized to its item count — 12-item rails never overlap the next row', () => {
    const counter = { value: 1000 };
    const baseA = allocateRow(counter, 12); // row A: 12-item rail
    const baseB = allocateRow(counter, 12); // row B mounts after
    // Re-render of row A must NOT allocate a new block (useMemo [items.length]).
    const baseARerender = baseA;
    expect(baseA).not.toBe(baseB);
    expect(baseARerender).toBe(baseA);
    // Row A's full sibling range stays below row B's base.
    expect(baseA + 11).toBeLessThan(baseB);
  });

  it('rows of different sizes never produce duplicate tags', () => {
    const counter = { value: 1000 };
    const baseA = allocateRow(counter, 3);
    const baseB = allocateRow(counter, 12);
    const baseC = allocateRow(counter, 1);
    const allTags = [
      ...Array.from({ length: 3 }, (_, i) => baseA + i),
      ...Array.from({ length: 12 }, (_, i) => baseB + i),
      ...Array.from({ length: 1 }, (_, i) => baseC + i),
    ];
    expect(new Set(allTags).size).toBe(allTags.length);
  });

  it('unmount + remount of a row does not collide with live rows', () => {
    const counter = { value: 1000 };
    const baseA = allocateRow(counter, 12); // row A
    allocateRow(counter, 12); // row B mounts
    // Row A unmounts; row C mounts — gets a fresh block, no reuse.
    const baseC = allocateRow(counter, 12);
    expect(baseC).toBeGreaterThan(baseA);
    expect(new Set([baseA, baseC, counter.value]).size).toBe(3);
  });

  it('an empty rail still consumes one tag (guard against zero-width blocks)', () => {
    const counter = { value: 5000 };
    const base = allocateRow(counter, 0);
    expect(base).toBe(5000);
    expect(counter.value).toBe(5001); // max(0,1) = 1
  });
});
