import assert from 'node:assert/strict';
import test from 'node:test';
import { LIST_MATCH_META_SQL, listMatchMetaFromRows, normalizeGoalTimeEntries } from './matches.listMeta';

test('listagem busca status, contagem, métodos e tempos de gol numa query só', () => {
  const statements = LIST_MATCH_META_SQL.split(';').map((part) => part.trim()).filter(Boolean);
  assert.equal(statements.length, 1);
  assert.match(LIST_MATCH_META_SQL, /jsonb_array_length\(j\.post_match_event_log\)/);
  assert.match(LIST_MATCH_META_SQL, /LEFT JOIN jogos_estatisticas_equipe/);
  assert.match(LIST_MATCH_META_SQL, /j\.id = ANY\(\$1::text\[\]\)/);
  assert.match(LIST_MATCH_META_SQL, /j\.equipe_id = ANY\(\$2::text\[\]\)/);
  assert.match(LIST_MATCH_META_SQL, /AS event_count/);
  assert.match(LIST_MATCH_META_SQL, /AS goal_times/);
  assert.match(LIST_MATCH_META_SQL, /AS goals_conceded_times/);
  assert.match(LIST_MATCH_META_SQL, /elem->>'action' = 'goal'/);
  assert.doesNotMatch(LIST_MATCH_META_SQL, /AS post_match_event_log/i);
});

test('tempos de gol agregados ignoram método vazio e item sem relógio', () => {
  assert.deepEqual(
    normalizeGoalTimeEntries([
      { time: '03:00 (1T)', method: 'JOGO ABERTO' },
      { time: '  ', method: 'FALTAS' },
      { time: '21:00 (2T)', method: '' },
      null,
    ]),
    [{ time: '03:00 (1T)', method: 'JOGO ABERTO' }, { time: '21:00 (2T)' }]
  );
  assert.deepEqual(normalizeGoalTimeEntries('[{"time":"04:00 (1T)"}]'), [{ time: '04:00 (1T)' }]);
  assert.deepEqual(normalizeGoalTimeEntries('nao-json'), []);
});

test('parser da listagem não exige o log e aceita contagem numérica em string', () => {
  const map = listMatchMetaFromRows([
    {
      id: 'j1',
      status: 'encerrado',
      event_count: '12',
      metodo_gol: '{"JOGO ABERTO":2}',
      metodo_gol_tomado: null,
      goal_times: [{ time: '03:00 (1T)', method: 'JOGO ABERTO' }],
      goals_conceded_times: '[]',
    },
    {
      id: 'j2',
      status: null,
      event_count: null,
      metodo_gol: null,
      metodo_gol_tomado: '{"CONTRA":1}',
      goal_times: null,
      goals_conceded_times: [{ time: '18:00 (2T)', method: null }],
    },
  ]);

  assert.deepEqual(map.get('j1'), {
    status: 'encerrado',
    eventCount: 12,
    metodoGol: '{"JOGO ABERTO":2}',
    metodoGolTomado: undefined,
    goalTimes: [{ time: '03:00 (1T)', method: 'JOGO ABERTO' }],
    goalsConcededTimes: [],
  });
  assert.equal(map.get('j2')?.eventCount, 0);
  assert.equal(map.get('j2')?.status, undefined);
  assert.equal(map.get('j2')?.metodoGolTomado, '{"CONTRA":1}');
  assert.deepEqual(map.get('j2')?.goalsConcededTimes, [{ time: '18:00 (2T)' }]);
});
