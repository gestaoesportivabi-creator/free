import assert from 'node:assert/strict';
import test from 'node:test';
import { LIST_MATCH_META_SQL, listMatchMetaFromRows } from './matches.listMeta';

test('listagem busca status, contagem e métodos de gol numa query só', () => {
  const selects = LIST_MATCH_META_SQL.match(/SELECT/gi) ?? [];
  assert.equal(selects.length, 1);
  assert.match(LIST_MATCH_META_SQL, /jsonb_array_length\(j\.post_match_event_log\)/);
  assert.match(LIST_MATCH_META_SQL, /LEFT JOIN jogos_estatisticas_equipe/);
  assert.match(LIST_MATCH_META_SQL, /j\.id = ANY\(\$1::text\[\]\)/);
  assert.match(LIST_MATCH_META_SQL, /j\.equipe_id = ANY\(\$2::text\[\]\)/);
  assert.match(LIST_MATCH_META_SQL, /AS event_count/);
  assert.doesNotMatch(LIST_MATCH_META_SQL, /AS post_match_event_log/i);
});

test('parser da listagem não exige o log e aceita contagem numérica em string', () => {
  const map = listMatchMetaFromRows([
    {
      id: 'j1',
      status: 'encerrado',
      event_count: '12',
      metodo_gol: '{"JOGO ABERTO":2}',
      metodo_gol_tomado: null,
    },
    {
      id: 'j2',
      status: null,
      event_count: null,
      metodo_gol: null,
      metodo_gol_tomado: '{"CONTRA":1}',
    },
  ]);

  assert.deepEqual(map.get('j1'), {
    status: 'encerrado',
    eventCount: 12,
    metodoGol: '{"JOGO ABERTO":2}',
    metodoGolTomado: undefined,
  });
  assert.equal(map.get('j2')?.eventCount, 0);
  assert.equal(map.get('j2')?.status, undefined);
  assert.equal(map.get('j2')?.metodoGolTomado, '{"CONTRA":1}');
});
