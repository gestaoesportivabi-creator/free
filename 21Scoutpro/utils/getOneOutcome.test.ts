import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyGetOneHttp, GetOneFailure } from './getOneOutcome';
import { MATCH_SAVE_TIMEOUT_MS, matchesApi } from '../services/api';

describe('classifyGetOneHttp', () => {
  it('404 vira ausência, sem mascarar o resto como null', () => {
    expect(classifyGetOneHttp({ status: 404, parseFailed: false, body: null })).toEqual({ kind: 'not_found' });
    expect(classifyGetOneHttp({ status: 404, parseFailed: true, body: null })).toEqual({ kind: 'not_found' });
  });

  it('rede simulada por HTTP 500, corpo inválido e payload sem dados são falha', () => {
    expect(classifyGetOneHttp({ status: 500, parseFailed: false, body: { success: false, error: 'boom' } }).kind).toBe(
      'failure'
    );
    expect(classifyGetOneHttp({ status: 200, parseFailed: true, body: null }).kind).toBe('failure');
    expect(classifyGetOneHttp({ status: 200, parseFailed: false, body: { success: false } }).kind).toBe('failure');
    expect(classifyGetOneHttp({ status: 200, parseFailed: false, body: { success: true, data: null } }).kind).toBe(
      'failure'
    );
  });

  it('200 com data devolve o objeto', () => {
    expect(classifyGetOneHttp({ status: 200, parseFailed: false, body: { success: true, data: { id: 'j1' } } })).toEqual({
      kind: 'data',
      data: { id: 'j1' },
    });
  });
});

describe('getOne', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function stubStorage() {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
  }

  it('404 devolve null e registra aviso', async () => {
    stubStorage();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    globalThis.fetch = vi.fn(async () => new Response('', { status: 404 })) as typeof fetch;
    await expect(matchesApi.getById('jogo-ausente')).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('500 lança e registra erro, em vez de null', async () => {
    stubStorage();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ success: false, error: 'falha' }), { status: 500 })
    ) as typeof fetch;
    await expect(matchesApi.getById('jogo-1')).rejects.toBeInstanceOf(GetOneFailure);
    expect(error).toHaveBeenCalled();
  });

  it('falha de rede lança e registra erro', async () => {
    stubStorage();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;
    await expect(matchesApi.getById('jogo-1')).rejects.toBeInstanceOf(GetOneFailure);
    expect(error).toHaveBeenCalled();
  });
});

describe('timeout do save', () => {
  it('espera 55s, abaixo do maxDuration de 60s da Vercel', () => {
    expect(MATCH_SAVE_TIMEOUT_MS).toBe(55_000);
    expect(MATCH_SAVE_TIMEOUT_MS).toBeLessThan(60_000);
  });

  it('corpo preso do PUT aborta aos 55s em vez de deixar Salvando pendurado', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.useFakeTimers();
    globalThis.fetch = vi.fn((_url: string, init?: RequestInit) => {
      const body = new Promise<string>((_resolve, reject) => {
        const fail = () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        };
        if (init?.signal?.aborted) fail();
        init?.signal?.addEventListener('abort', fail);
      });
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => body,
      } as Response);
    }) as typeof fetch;

    const pending = matchesApi.update('jogo-j2-1', { opponent: 'J2-1' } as never);
    const assertion = expect(pending).rejects.toThrow(/Tempo esgotado/);
    await vi.advanceTimersByTimeAsync(MATCH_SAVE_TIMEOUT_MS);
    await assertion;
    vi.useRealTimers();
  });
});
