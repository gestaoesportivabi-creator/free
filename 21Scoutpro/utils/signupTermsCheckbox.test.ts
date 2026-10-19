/**
 * @vitest-environment happy-dom
 */
import { createElement, type ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SignUp } from '../components/SignUp';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('checkbox dos termos no cadastro', () => {
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

  function render() {
    const element = createElement(SignUp, {
      onSignedUp: () => {},
      onGoToLogin: () => {},
      onBackToHome: () => {},
    }) as ReactElement;
    act(() => {
      root.render(element);
    });
  }

  function checkbox(): HTMLInputElement {
    const input = container.querySelector('#signup-terms');
    if (!(input instanceof HTMLInputElement)) throw new Error('checkbox ausente');
    return input;
  }

  function click(target: Element) {
    act(() => {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
  }

  it('liga o input ao texto por id e htmlFor', () => {
    render();
    const input = checkbox();
    const label = container.querySelector('label[for="signup-terms"]');
    expect(label).toBeTruthy();
    expect(input.id).toBe('signup-terms');
    expect(input.className).not.toContain('sr-only');
    expect(input.checked).toBe(false);
  });

  it('clique na caixa marca e desmarca', () => {
    render();
    const input = checkbox();
    const box = container.querySelector('[data-testid="signup-terms-box"]');
    if (!(box instanceof HTMLElement)) throw new Error('caixa visual ausente');

    click(box);
    expect(input.checked).toBe(true);
    click(box);
    expect(input.checked).toBe(false);
  });

  it('clique no texto marca e desmarca', () => {
    render();
    const input = checkbox();
    const text = Array.from(container.querySelectorAll('label span')).find((node) =>
      node.textContent?.includes('Li e aceito'),
    );
    if (!(text instanceof HTMLElement)) throw new Error('texto dos termos ausente');

    click(text);
    expect(input.checked).toBe(true);
    click(text);
    expect(input.checked).toBe(false);
  });

  it('clique no link dos termos não marca a caixa', () => {
    render();
    const input = checkbox();
    const link = container.querySelector('a[href="/termos"]');
    if (!(link instanceof HTMLAnchorElement)) throw new Error('link dos termos ausente');
    link.addEventListener('click', (event) => event.preventDefault());
    click(link);
    expect(input.checked).toBe(false);
  });

  it('espaço no input focado marca e desmarca', () => {
    render();
    const input = checkbox();
    act(() => {
      input.focus();
    });
    expect(document.activeElement).toBe(input);

    act(() => {
      const down = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
      input.dispatchEvent(down);
      if (!down.defaultPrevented) input.click();
    });
    expect(input.checked).toBe(true);

    act(() => {
      const down = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
      input.dispatchEvent(down);
      if (!down.defaultPrevented) input.click();
    });
    expect(input.checked).toBe(false);
  });
});
