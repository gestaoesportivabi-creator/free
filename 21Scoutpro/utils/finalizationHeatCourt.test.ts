/**
 * @vitest-environment happy-dom
 */
import { createElement, type ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FinalizationHeatCourt } from '../components/liveScout/FinalizationHeatCourt';
import { emptyHeatCellCount, type DensityPoint, type HeatCellCount } from './finalizationHeatMap';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const POINTS: DensityPoint[] = [
  { x: 100, y: 36, n: 7 },
  { x: 24, y: 110, n: 2 },
];

function withCounts(patch: Partial<HeatCellCount>): HeatCellCount {
  return { ...emptyHeatCellCount(), ...patch };
}

describe('FinalizationHeatCourt', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function render(mode: 'zones' | 'continuous', counts: HeatCellCount, points: readonly DensityPoint[]) {
    const element = createElement(FinalizationHeatCourt, { mode, counts, points }) as ReactElement;
    act(() => {
      root.render(element);
    });
  }

  function follows(earlier: Element, later: Element) {
    return Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  it('pinta o número de cada zona depois das linhas', () => {
    render('zones', withCounts({ AT_L_NEAR: 7, DF_R_NEAR: 1 }), []);
    const lines = container.querySelector('[data-testid="heat-lines"]');
    const counts = [...container.querySelectorAll('[data-testid="heat-count"]')];
    expect(lines).toBeTruthy();
    expect(counts).toHaveLength(8);
    expect(counts.map((node) => node.textContent)).toContain('7');
    expect(counts.every((node) => follows(lines!, node))).toBe(true);
  });

  it('pinta o número de cada mancha do contínuo acima do desfoque e das linhas', () => {
    render('continuous', emptyHeatCellCount(), POINTS);
    const blobs = container.querySelector('[data-testid="heat-blobs"]');
    const lines = container.querySelector('[data-testid="heat-lines"]');
    const counts = [...container.querySelectorAll('[data-testid="heat-count"]')];
    expect(blobs).toBeTruthy();
    expect(counts.map((node) => node.textContent)).toEqual(['7', '2']);
    expect(counts.every((node) => follows(blobs!, node) && follows(lines!, node))).toBe(true);
    expect(blobs!.contains(counts[0])).toBe(false);
  });
});
