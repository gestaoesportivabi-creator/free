/**
 * @vitest-environment happy-dom
 */
import { createElement, type ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LiveScoutCourt } from '../components/liveScout/LiveScoutCourt';
import { QuadraScoutPreview } from '../components/liveScout/QuadraScoutPreview';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('QA da quadra em /dev/quadra', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.history.replaceState({}, '', '/dev/quadra');
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function render(element: ReactElement) {
    act(() => {
      root.render(element);
    });
  }

  it('mantém /dev/quadra depois da inicialização, para o reload não cair na home', () => {
    render(createElement(App));
    expect(window.location.pathname).toBe('/dev/quadra');
    expect(container.querySelector('h1')?.textContent).toMatch(/Quadra/i);
  });

  it('deixa o relógio fora da quadra e sem botão em cima das zonas', () => {
    render(
      createElement(LiveScoutCourt, {
        onSelectZone: () => {},
        children: createElement('button', { type: 'button' }, 'Pausa'),
      }),
    );
    const svg = container.querySelector('svg');
    const clock = container.querySelector('[data-testid="court-clock"]');
    const courtFace = container.querySelector('[data-testid="live-scout-court"] .relative');
    expect(svg).toBeTruthy();
    expect(clock).toBeTruthy();
    expect(svg!.querySelector('button')).toBeNull();
    expect(courtFace!.contains(clock)).toBe(false);
    expect(svg!.compareDocumentPosition(clock!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('em 390 a lateral direita continua selecionável com o Pausa na tela', () => {
    render(createElement(QuadraScoutPreview));
    const pause = container.querySelector('[data-testid="preview-pause"]');
    const rightWing = container.querySelector('[data-testid="shot-zone-LAT_AT_DIR"]');
    const svg = container.querySelector('[data-testid="live-scout-court"] svg');
    expect(pause).toBeTruthy();
    expect(svg!.contains(pause)).toBe(false);
    act(() => {
      rightWing!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="shot-zone-prompt"]')?.textContent).toMatch(/direita/i);
  });

  it('pausado trava chute, gol e tiro livre e avisa na tela', () => {
    render(createElement(QuadraScoutPreview));
    const pause = container.querySelector('[data-testid="preview-pause"]') as HTMLButtonElement;
    const shot = container.querySelector('[data-testid="preview-shot"]') as HTMLButtonElement;
    const goal = container.querySelector('[data-testid="preview-goal"]') as HTMLButtonElement;
    const freeKick = container.querySelector('[data-testid="preview-free-kick"]') as HTMLButtonElement;

    act(() => {
      pause.click();
    });
    expect(pause.textContent).toMatch(/Vai/i);
    expect(container.querySelector('[data-testid="preview-paused-lock"]')?.textContent).toMatch(/travados/i);
    expect(shot.disabled).toBe(true);
    expect(goal.disabled).toBe(true);
    expect(freeKick.disabled).toBe(true);
    expect(shot.className).toMatch(/cursor-not-allowed/);

    act(() => {
      shot.click();
      goal.click();
      freeKick.click();
    });
    expect(container.querySelector('[data-testid="preview-results"]')).toBeNull();
    expect(container.querySelector('[data-testid="preview-last-event"]')?.textContent).toMatch(/Nenhum lance/i);

    act(() => {
      pause.click();
    });
    expect(shot.disabled).toBe(false);
    expect(container.querySelector('[data-testid="preview-paused-lock"]')).toBeNull();
    act(() => {
      shot.click();
    });
    expect(container.querySelector('[data-testid="preview-results"]')).toBeTruthy();
  });
});
