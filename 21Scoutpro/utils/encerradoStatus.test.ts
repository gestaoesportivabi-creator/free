import { describe, expect, it } from 'vitest';
import { preserveEncerradoStatus, saveLaterUi, statusForScoutSave } from './matchStatus';

describe('encerrado nunca regride no front', () => {
  it('autosave e guardar incompleto mantêm a coleta já encerrada', () => {
    expect(statusForScoutSave('encerrado', 'em_andamento')).toBe('encerrado');
    expect(statusForScoutSave('encerrado', 'encerrado')).toBe('encerrado');
    expect(statusForScoutSave('em_andamento', 'em_andamento')).toBe('em_andamento');
    expect(statusForScoutSave('disponivel', 'em_andamento')).toBe('em_andamento');
    expect(statusForScoutSave(undefined, 'encerrado')).toBe('encerrado');
  });

  it('um próximo status em_andamento não cobre o encerrado anterior', () => {
    expect(preserveEncerradoStatus({ status: 'encerrado' }, { status: 'em_andamento', id: 'jogo-1' })).toEqual({
      status: 'encerrado',
      id: 'jogo-1',
    });
    expect(preserveEncerradoStatus({ status: 'em_andamento' }, { status: 'encerrado' }).status).toBe('encerrado');
    expect(preserveEncerradoStatus({ status: 'em_andamento' }, { status: 'em_andamento' }).status).toBe(
      'em_andamento'
    );
  });

  it('partida encerrada oferece salvar alterações, sem dizer que ficou incompleta', () => {
    expect(saveLaterUi('encerrado')).toEqual({
      label: 'Salvar alterações',
      alert: 'Alterações salvas. A partida continua finalizada.',
    });
    expect(statusForScoutSave('encerrado', 'em_andamento')).toBe('encerrado');
  });

  it('partida em andamento continua salvando como incompleta', () => {
    expect(saveLaterUi('em_andamento').label).toBe('Salvar como incompleta');
    expect(saveLaterUi('disponivel').alert).toBe(
      'Dados guardados como incompleto. Pode continuar a coleta mais tarde.'
    );
    expect(saveLaterUi(undefined).label).toBe('Salvar como incompleta');
  });
});
