import { describe, it, expect } from 'vitest';
import { isExportable, unionBounds } from './graphExport';

describe('unionBounds', () => {
  const nodes = { x: 0, y: 0, width: 100, height: 100 };

  it('returns the base when there is nothing else', () => {
    expect(unionBounds(nodes, [])).toEqual(nodes);
  });

  it('grows to include a box hanging below the nodes', () => {
    expect(unionBounds(nodes, [{ x: 20, y: 90, width: 50, height: 60 }])).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 150,
    });
  });

  it('grows in every direction', () => {
    expect(
      unionBounds(nodes, [
        { x: -10, y: -20, width: 5, height: 5 },
        { x: 90, y: 90, width: 50, height: 50 },
      ]),
    ).toEqual({ x: -10, y: -20, width: 150, height: 160 });
  });

  it('ignores boxes already inside', () => {
    expect(unionBounds(nodes, [{ x: 10, y: 10, width: 10, height: 10 }])).toEqual(nodes);
  });
});

describe('isExportable', () => {
  it('keeps ordinary elements', () => {
    expect(isExportable(document.createElement('div'))).toBe(true);
  });

  it('drops elements marked as screen-only', () => {
    const button = document.createElement('button');
    button.setAttribute('data-export-hidden', '');
    expect(isExportable(button)).toBe(false);
  });
});
