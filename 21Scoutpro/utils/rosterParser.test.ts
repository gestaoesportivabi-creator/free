import { describe, expect, it } from 'vitest';
import {
  blockingRosterLines,
  parseRoster,
  planRosterSave,
  ROSTER_NAME_ERROR,
  ROSTER_NUMBER_WARNING,
  ROSTER_PASTE_LIMIT,
  ROSTER_POSITION_WARNING,
  rosterDuplicateError,
  rosterExistingNumberError,
  rosterLimitMessage,
  rosterPositionError,
  rosterSaveFailureMessage,
  runRosterSave,
  savableRosterLines,
  toRosterPlayer,
} from './rosterParser';

const FUTSAL_ROWS: Array<[string, string, string]> = [
  ['Lucas Andrade', '1', 'Goleiro'],
  ['Rafael Souza', '12', 'Goleiro'],
  ['Matheus Lima', '2', 'Fixo'],
  ['Gabriel Rocha', '3', 'Fixo'],
  ['João Pedro Alves', '4', 'Ala'],
  ['Thiago Martins', '5', 'Ala'],
  ['Vinícius Costa', '6', 'Ala'],
  ['Guilherme Ribeiro', '7', 'Ala'],
  ['Leonardo Ferreira', '8', 'Pivô'],
  ['Caio Mendes', '9', 'Pivô'],
  ['Felipe Araújo', '10', 'Ala'],
  ['Bruno Carvalho', '11', 'Fixo'],
  ['Enzo Nascimento', '13', 'Ala'],
  ['Ícaro Barbosa', '14', 'Pivô'],
];

function tsv(rows: Array<[string, string, string]>, header = true): string {
  const body = rows.map((row) => row.join('\t'));
  return header ? ['Nome\tNúmero\tPosição', ...body].join('\n') : body.join('\n');
}

describe('parseRoster — lista de futsal', () => {
  it('lê 14 atletas com cabeçalho e tab, sem gravar a linha Nome', () => {
    const result = parseRoster(tsv(FUTSAL_ROWS));

    expect(result.separator).toBe('tab');
    expect(result.lines).toHaveLength(14);
    expect(result.hasBlockingErrors).toBe(false);
    expect(result.overflowCount).toBe(0);
    expect(result.lines.map((line) => line.name)).not.toContain('Nome');
    expect(result.lines.map((line) => line.name)).toEqual(FUTSAL_ROWS.map((row) => row[0]));
    expect(result.lines.map((line) => line.number)).toEqual(FUTSAL_ROWS.map((row) => Number(row[1])));
    expect(result.lines.map((line) => line.position)).toEqual([
      'Goleiro',
      'Goleiro',
      'Fixo',
      'Fixo',
      'Ala',
      'Ala',
      'Ala',
      'Ala',
      'Pivô',
      'Pivô',
      'Ala',
      'Fixo',
      'Ala',
      'Pivô',
    ]);
    expect(result.lines.every((line) => line.errors.length === 0)).toBe(true);
    expect(result.lines.every((line) => line.number !== 0)).toBe(true);
  });

  it('aceita ponto-e-vírgula e cabeçalho equivalente', () => {
    const body = FUTSAL_ROWS.map((row) => row.join(';')).join('\n');
    const result = parseRoster(`Nome;Número;Posição\n${body}`);

    expect(result.separator).toBe('semicolon');
    expect(result.lines).toHaveLength(14);
    expect(result.lines[0]).toMatchObject({ name: 'Lucas Andrade', number: 1, position: 'Goleiro' });
    expect(result.lines[8]).toMatchObject({ name: 'Leonardo Ferreira', number: 8, position: 'Pivô' });
    expect(result.hasBlockingErrors).toBe(false);
  });

  it('pula cabeçalho com nº e não transforma a linha em atleta', () => {
    const result = parseRoster('Nome\tnº\tPosição\nCaio Mendes\t9\tPivô');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({ name: 'Caio Mendes', number: 9, position: 'Pivô', errors: [] });
  });

  it('funciona sem cabeçalho', () => {
    const result = parseRoster(tsv(FUTSAL_ROWS, false));
    expect(result.lines).toHaveLength(14);
    expect(result.lines[0].name).toBe('Lucas Andrade');
    expect(result.lines[result.lines.length - 1]).toMatchObject({ name: 'Ícaro Barbosa', number: 14, position: 'Pivô' });
  });
});

describe('parseRoster — variantes', () => {
  it('nomes só: sem número não vira 0 e não bloqueia', () => {
    const result = parseRoster('Lucas Andrade\nRafael Souza\n');
    expect(result.separator).toBe('none');
    expect(result.lines).toHaveLength(2);
    expect(result.hasBlockingErrors).toBe(false);
    for (const line of result.lines) {
      expect(line.number).toBeNull();
      expect(line.position).toBeNull();
      expect(line.errors).toEqual([]);
      expect(line.warnings).toContain(ROSTER_NUMBER_WARNING);
      expect(line.warnings).toContain(ROSTER_POSITION_WARNING);
    }
  });

  it('reconhece GOL, FIX, ALA e PIV em minúsculas', () => {
    const result = parseRoster(
      ['lucas andrade\t1\tgol', 'matheus lima\t2\tfix', 'joão pedro\t4\tala', 'leonardo ferreira\t8\tpiv'].join('\n'),
    );
    expect(result.lines.map((line) => line.position)).toEqual(['Goleiro', 'Fixo', 'Ala', 'Pivô']);
    expect(result.lines.every((line) => line.errors.length === 0)).toBe(true);
    expect(result.lines[2].name).toBe('joão pedro');
  });

  it('aceita G, Zagueiro, Ala direita e Ala esquerda', () => {
    const result = parseRoster('1\tLucas Andrade\tG\n2\tMatheus Lima\tZagueiro\n4\tJoão\tAla direita\n5\tThiago\tAla esquerda');
    expect(result.lines.map((line) => line.position)).toEqual(['Goleiro', 'Fixo', 'Ala', 'Ala']);
  });

  it('colapsa espaços extras e ignora linha em branco', () => {
    const result = parseRoster('  Lucas   Andrade  \t  1 \t  Goleiro  \n\n   Rafael Souza    12    gol  \n');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({ name: 'Lucas Andrade', number: 1, position: 'Goleiro' });
    expect(result.lines[1]).toMatchObject({ name: 'Rafael Souza', number: 12, position: 'Goleiro' });
    expect(result.lines[0].lineNumber).toBe(1);
    expect(result.lines[1].lineNumber).toBe(3);
  });

  it('número repetido na lista é erro nas duas linhas', () => {
    const result = parseRoster('Lucas Andrade\t7\tAla\nThiago Martins\t7\tFixo');
    expect(result.hasBlockingErrors).toBe(true);
    expect(result.lines[0].errors).toContain(rosterDuplicateError(7));
    expect(result.lines[1].errors).toContain(rosterDuplicateError(7));
    expect(savableRosterLines(result.lines)).toHaveLength(0);
  });

  it('número já usado no elenco da tela é erro', () => {
    const result = parseRoster('Lucas Andrade\t1\tGoleiro\nRafael Souza\t12\tGoleiro', {
      existingNumbers: [12],
    });
    expect(result.lines[0].errors).toEqual([]);
    expect(result.lines[1].errors).toContain(rosterExistingNumberError(12));
    expect(blockingRosterLines(result.lines)).toHaveLength(1);
  });

  it('não parte nome com vírgula (Silva, Jr.)', () => {
    const tabbed = parseRoster('Silva, Jr.\t10\tAla');
    expect(tabbed.separator).toBe('tab');
    expect(tabbed.lines).toEqual([
      expect.objectContaining({ name: 'Silva, Jr.', number: 10, position: 'Ala', errors: [] }),
    ]);

    const alone = parseRoster('Silva, Jr.');
    expect(alone.separator).toBe('none');
    expect(alone.lines).toHaveLength(1);
    expect(alone.lines[0].name).toBe('Silva, Jr.');
    expect(alone.lines[0].number).toBeNull();

    const csv = parseRoster('Silva, Jr.,10,Ala');
    expect(csv.separator).toBe('comma');
    expect(csv.lines[0]).toMatchObject({ name: 'Silva, Jr.', number: 10, position: 'Ala' });
  });

  it('usa vírgula quando a colagem é claramente uma tabela', () => {
    const result = parseRoster('1,Lucas Andrade,Goleiro\n8,Leonardo Ferreira,Pivô');
    expect(result.separator).toBe('comma');
    expect(result.lines.map((line) => [line.name, line.number, line.position])).toEqual([
      ['Lucas Andrade', 1, 'Goleiro'],
      ['Leonardo Ferreira', 8, 'Pivô'],
    ]);
  });

  it('FIX e PIV entram; Universal e UNI são inválidos e não viram Ala', () => {
    const result = parseRoster('Matheus Lima\t2\tFIX\nLeonardo Ferreira\t8\tPIV\nEnzo Nascimento\t13\tUniversal\nIcaro\t15\tUNI');
    expect(result.lines[0].position).toBe('Fixo');
    expect(result.lines[1].position).toBe('Pivô');
    expect(result.lines[2].position).toBeNull();
    expect(result.lines[2].errors).toContain(rosterPositionError('Universal'));
    expect(result.lines[3].errors).toContain(rosterPositionError('UNI'));
    expect(result.lines.map((line) => line.position)).not.toContain('Ala');
  });

  it('linha sem nome é erro; número ausente com cabeçalho não vira coluna errada', () => {
    const result = parseRoster('Nome\tNúmero\tPosição\n\t7\tAla\nLucas Andrade\t\tGoleiro');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].name).toBe('');
    expect(result.lines[0].number).toBe(7);
    expect(result.lines[0].errors).toContain(ROSTER_NAME_ERROR);
    expect(result.lines[1]).toMatchObject({
      name: 'Lucas Andrade',
      number: null,
      position: 'Goleiro',
    });
    expect(result.lines[1].warnings).toContain(ROSTER_NUMBER_WARNING);
    expect(result.lines[1].number).not.toBe(0);
  });

  it('mostra o limite em vez de cortar a linha 61 em silêncio', () => {
    const rows = Array.from({ length: ROSTER_PASTE_LIMIT + 1 }, (_, index) => {
      const n = index + 1;
      return `Atleta ${n}\t${n}\tAla`;
    });
    const result = parseRoster(['Nome\tNúmero\tPosição', ...rows].join('\n'));
    expect(result.lines).toHaveLength(ROSTER_PASTE_LIMIT + 1);
    expect(result.overflowCount).toBe(1);
    expect(result.lines[ROSTER_PASTE_LIMIT - 1].overLimit).toBe(false);
    expect(result.lines[ROSTER_PASTE_LIMIT].overLimit).toBe(true);
    expect(result.lines[ROSTER_PASTE_LIMIT].errors).toContain(rosterLimitMessage());
    expect(result.lines[ROSTER_PASTE_LIMIT].name).toBe(`Atleta ${ROSTER_PASTE_LIMIT + 1}`);
    expect(savableRosterLines(result.lines)).toHaveLength(ROSTER_PASTE_LIMIT);
    expect(result.hasBlockingErrors).toBe(false);
  });

  it('reconhece número colado ao nome', () => {
    const result = parseRoster('7 Rafael Souza\n9 Thiago Barros Ala');
    expect(result.lines[0]).toMatchObject({ name: 'Rafael Souza', number: 7, position: null });
    expect(result.lines[1]).toMatchObject({ name: 'Thiago Barros Ala', number: 9 });
  });
});

describe('salvamento do elenco', () => {
  it('não manda camisa 0 nem posição Ala quando faltam', () => {
    const draft = toRosterPlayer({ name: '  Lucas   Andrade ', number: null, position: null });
    expect(draft.name).toBe('Lucas Andrade');
    expect(draft).not.toHaveProperty('jerseyNumber');
    expect(draft).not.toHaveProperty('position');
  });

  it('preserva posição e número reconhecidos', () => {
    const draft = toRosterPlayer({ name: 'Leonardo Ferreira', number: 8, position: 'Pivô' });
    expect(draft.position).toBe('Pivô');
    expect(draft.jerseyNumber).toBe(8);
    expect(draft.nickname).toBe('Leonardo');
  });

  it('na nova tentativa pula quem já foi criado nesta sessão', () => {
    const players = [
      { name: 'Lucas Andrade', number: 1 },
      { name: 'Rafael Souza', number: 12 },
      { name: 'Lucas Andrade', number: null },
    ];
    const first = planRosterSave(players, new Set());
    expect(first.pending).toHaveLength(3);
    expect(first.alreadySaved).toBe(0);

    const saved = new Set([first.keys[0], first.keys[2]]);
    const retry = planRosterSave(players, saved);
    expect(retry.alreadySaved).toBe(2);
    expect(retry.pending).toEqual([{ name: 'Rafael Souza', number: 12 }]);
    expect(retry.keys).toEqual(first.keys);
  });

  it('a mensagem de falha parcial usa o total já gravado, não um contador zerado', () => {
    expect(rosterSaveFailureMessage(0, 14)).toMatch(/Nenhum atleta foi gravado/);
    expect(rosterSaveFailureMessage(10, 14)).toBe(
      'Salvamos 10 de 14 atletas. Quem já entrou fica salvo — tentar de novo não duplica esses.',
    );
  });

  it('no meio da lista, devolve a mensagem do servidor na linha e o retry não repete quem entrou', async () => {
    const items = [
      { name: 'Lucas Andrade', number: 1, lineNumber: 2 },
      { name: 'Rafael Souza', number: 12, lineNumber: 3 },
    ];
    const savedKeys = new Set<string>();
    const created: string[] = [];
    const serverMessage = 'Número 12 já está em uso por Ana nesta equipe.';

    const first = await runRosterSave({
      items,
      savedKeys,
      create: async (item) => {
        created.push(item.name);
        if (item.number === 12) throw new Error(serverMessage);
      },
    });

    expect(first.ok).toBe(false);
    if (first.ok) return;
    expect(first.saved).toBe(1);
    expect(first.failedLineNumber).toBe(3);
    expect(first.cause).toBe(serverMessage);
    expect(first.message).toMatch(/Salvamos 1 de 2/);
    expect(created).toEqual(['Lucas Andrade', 'Rafael Souza']);

    created.length = 0;
    const retry = await runRosterSave({
      items,
      savedKeys,
      create: async (item) => {
        created.push(item.name);
        if (item.number === 12) throw new Error(serverMessage);
      },
    });
    expect(created).toEqual(['Rafael Souza']);
    expect(retry.ok).toBe(false);
    if (!retry.ok) expect(retry.saved).toBe(1);
  });
});
