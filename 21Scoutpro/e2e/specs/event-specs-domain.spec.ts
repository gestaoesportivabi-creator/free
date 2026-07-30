import { expect, test } from '@playwright/test';
import { eventSpecs, getEventSpecsForMode } from '../../components/collection-shell/eventSpecs';
import { ShellEventDraft } from '../../components/collection-shell/types';

const baseDraft = (eventId: string): ShellEventDraft => ({
  eventId,
  playerId: 'player-1',
  choices: {},
});

test('presets geram o mesmo payload de domínio que o fluxo manual equivalente', () => {
  const cases = [
    {
      specId: 'shot',
      presetId: 'shot-post',
      manual: { result: 'post' },
    },
    {
      specId: 'foul',
      presetId: 'sixth-foul-us',
      manual: { team: 'for' },
    },
    {
      specId: 'goal',
      presetId: 'goal-corner',
      manual: { team: 'for', goalMethod: 'Escanteio' },
    },
    {
      specId: 'card',
      presetId: 'yellow-us',
      manual: { team: 'for', cardType: 'yellow' },
    },
  ] as const;

  for (const item of cases) {
    const spec = eventSpecs.find((candidate) => candidate.id === item.specId);
    const preset = spec?.presets?.find((candidate) => candidate.id === item.presetId);
    expect(spec, `spec ${item.specId}`).toBeTruthy();
    expect(preset, `preset ${item.presetId}`).toBeTruthy();

    const presetDraft = {
      ...baseDraft(item.specId),
      ...preset!.patch,
      choices: { ...(preset!.patch.choices ?? {}) },
    };
    const manualDraft = {
      ...baseDraft(item.specId),
      ...item.manual,
    };
    expect(spec!.toDomainInput(presetDraft)).toEqual(spec!.toDomainInput(manualDraft));
  }
});

test('passe genérico e enriquecimentos existem somente no postmatch', () => {
  const realtimeIds = getEventSpecsForMode('realtime').map((spec) => spec.id);
  const postmatchIds = getEventSpecsForMode('postmatch').map((spec) => spec.id);

  expect(realtimeIds).not.toContain('pass');
  expect(realtimeIds).not.toContain('keyPass');
  expect(realtimeIds).not.toContain('assist');
  expect(realtimeIds).not.toContain('lateral');
  expect(postmatchIds).toEqual(expect.arrayContaining(['pass', 'keyPass', 'assist', 'lateral']));
  expect(realtimeIds).not.toContain('possessionLost');
  expect(realtimeIds).not.toContain('possessionWon');
});

test('passe postmatch projeta receptor, transição, zona e timestamp sem montar MatchEvent', () => {
  const spec = getEventSpecsForMode('postmatch').find((candidate) => candidate.id === 'pass');
  expect(spec).toBeTruthy();

  expect(spec!.toDomainInput({
    eventId: 'pass',
    mode: 'postmatch',
    playerId: 'sender',
    secondaryPlayerId: 'receiver',
    result: 'wrong',
    wrongPassGeneratedTransition: true,
    zone: 'ataqueDireita',
    timeOverride: 372,
    periodOverride: '2T',
    choices: {},
  })).toEqual({
    action: 'pass',
    playerId: 'sender',
    secondaryPlayerId: 'receiver',
    result: 'wrong',
    wrongPassGeneratedTransition: true,
    zone: 'ataqueDireita',
    timeOverride: 372,
    periodOverride: '2T',
  });
});

test('ZONE é declarativo, opcional e pulado no realtime', () => {
  const shot = eventSpecs.find((candidate) => candidate.id === 'shot');
  const zoneStep = shot?.steps.find((step) => step.kind === 'ZONE');
  expect(zoneStep).toMatchObject({ optional: true, skipLabel: 'Sem zona' });
  expect(zoneStep?.skipWhen?.({ ...baseDraft('shot'), mode: 'realtime' })).toBe(true);
  expect(zoneStep?.skipWhen?.({ ...baseDraft('shot'), mode: 'postmatch' })).toBe(false);
});
