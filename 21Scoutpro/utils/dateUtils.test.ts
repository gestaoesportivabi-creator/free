import { describe, expect, it } from 'vitest';
import { formatMatchDayLabel, parseLocalDateOnly, toLocalYmd } from './dateUtils';

describe('formatMatchDayLabel', () => {
  it('21/10/2026 20:00 permanece quarta, não terça por causa de UTC', () => {
    const gravada = '2026-10-21';
    const isoMeiaNoiteUtc = '2026-10-21T00:00:00.000Z';
    const comHora = '2026-10-21T20:00:00';

    expect(formatMatchDayLabel(gravada)).toBe('qua., 21 de out.');
    expect(formatMatchDayLabel(isoMeiaNoiteUtc)).toBe('qua., 21 de out.');
    expect(formatMatchDayLabel(comHora)).toBe('qua., 21 de out.');

    const deslocadoEmSaoPaulo = new Date(isoMeiaNoiteUtc).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
    expect(deslocadoEmSaoPaulo).toMatch(/20/);
    expect(formatMatchDayLabel(isoMeiaNoiteUtc)).not.toContain('20');
  });

  it('horários colados na meia-noite não trocam o dia do calendário', () => {
    expect(formatMatchDayLabel('2026-10-21T23:59:00')).toBe('qua., 21 de out.');
    expect(formatMatchDayLabel('2026-10-21T23:59:00-03:00')).toBe('qua., 21 de out.');
    expect(formatMatchDayLabel('2026-10-22T00:05:00')).toBe('qui., 22 de out.');
    expect(formatMatchDayLabel('2026-10-22T00:05:00.000Z')).toBe('qui., 22 de out.');
    expect(formatMatchDayLabel('2026-10-22T00:05:00-03:00')).toBe('qui., 22 de out.');
  });

  it('parse local não usa o instante UTC da meia-noite', () => {
    const local = parseLocalDateOnly('2026-10-21T00:00:00.000Z');
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(9);
    expect(local.getDate()).toBe(21);
    expect(local.getHours()).toBe(0);
  });
});

describe('toLocalYmd perto da meia-noite', () => {
  it('22/10 02:30Z é 21/10 no calendário de America/Sao_Paulo', () => {
    const instant = new Date('2026-10-22T02:30:00.000Z');
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant);
    expect(partes).toBe('2026-10-21');
    expect(instant.toISOString().slice(0, 10)).toBe('2026-10-22');
  });

  it('toLocalYmd segue o calendário do processo, não o dia UTC', () => {
    const instant = new Date('2026-10-22T02:30:00.000Z');
    const y = instant.getFullYear();
    const m = String(instant.getMonth() + 1).padStart(2, '0');
    const d = String(instant.getDate()).padStart(2, '0');
    expect(toLocalYmd(instant)).toBe(`${y}-${m}-${d}`);
    if (instant.getTimezoneOffset() >= 180) {
      expect(toLocalYmd(instant)).toBe('2026-10-21');
      expect(instant.toISOString().slice(0, 10)).not.toBe(toLocalYmd(instant));
    }
  });
});
