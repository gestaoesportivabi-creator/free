import { describe, expect, it } from 'vitest';
import { athleteRosterLabel } from './athleteRosterLabel';

describe('athleteRosterLabel', () => {
  it('não corta "QA ATLETA 01" na primeira palavra', () => {
    const visible = athleteRosterLabel({ name: 'QA ATLETA 01', nickname: 'QA' });
    expect(visible.label).toBe('QA ATLETA 01');
    expect(visible.title).toBe('QA ATLETA 01');
    expect(visible.label).not.toBe('QA');
  });

  it('trata o apelido automático sem diferenciar maiúsculas', () => {
    expect(athleteRosterLabel({ name: 'QA ATLETA 02', nickname: 'qa' }).label).toBe('QA ATLETA 02');
  });

  it('mostra o nome completo quando o apelido é só o primeiro nome', () => {
    const visible = athleteRosterLabel({ name: 'Leonardo Ferreira', nickname: 'Leonardo' });
    expect(visible.label).toBe('Leonardo Ferreira');
    expect(visible.title).toBe('Leonardo Ferreira');
  });

  it('mantém apelido real e o nome completo no title', () => {
    const visible = athleteRosterLabel({ name: 'Leonardo Ferreira', nickname: 'Nenê' });
    expect(visible.label).toBe('Nenê');
    expect(visible.title).toBe('Leonardo Ferreira');
  });

  it('colapsa espaços e cai no apelido se o nome estiver vazio', () => {
    expect(athleteRosterLabel({ name: '  Ana   Souza  ', nickname: 'Ana' })).toEqual({
      label: 'Ana Souza',
      title: 'Ana Souza',
    });
    expect(athleteRosterLabel({ name: '   ', nickname: '  Nene  ' })).toEqual({
      label: 'Nene',
      title: 'Nene',
    });
  });

  it('não inventa primeiro + último para nome de três partes', () => {
    expect(athleteRosterLabel({ name: 'QA ATLETA 01', nickname: 'QA' }).label).toBe('QA ATLETA 01');
  });
});
