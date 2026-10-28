import { describe, expect, it } from 'vitest';
import { formatClockMinutes, formatClockTime } from './formatClockTime';

describe('formatClockTime', () => {
  it('zero e valores pequenos saem com dois dígitos', () => {
    expect(formatClockTime(0)).toBe('00:00');
    expect(formatClockTime(7)).toBe('00:07');
    expect(formatClockTime(5 * 60 + 7)).toBe('05:07');
  });

  it('carrega o minuto e o segundo', () => {
    expect(formatClockTime(65)).toBe('01:05');
    expect(formatClockTime(19 * 60 + 59)).toBe('19:59');
    expect(formatClockTime(40 * 60)).toBe('40:00');
  });

  it('trunca fração e trata inválido como 00:00', () => {
    expect(formatClockTime(90.9)).toBe('01:30');
    expect(formatClockTime(-3)).toBe('00:00');
    expect(formatClockTime(Number.NaN)).toBe('00:00');
    expect(formatClockTime(Number.POSITIVE_INFINITY)).toBe('00:00');
  });
});

describe('formatClockMinutes', () => {
  it('usa o mesmo mm:ss e arredonda o segundo', () => {
    expect(formatClockMinutes(0)).toBe('00:00');
    expect(formatClockMinutes(5 + 7 / 60)).toBe('05:07');
    expect(formatClockMinutes(1.999)).toBe('02:00');
  });
});
