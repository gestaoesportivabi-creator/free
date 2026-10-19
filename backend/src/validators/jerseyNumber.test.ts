import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  activeJerseyLookup,
  findActiveJerseyConflict,
  jerseyConflictError,
  jerseyConflictMessage,
  jerseyUpdateCheck,
  type JerseyCandidate,
  type JerseyUpdateDecision,
} from './jerseyNumber';

const equipeA = 'equipe-jose';
const equipeB = 'equipe-outro-clube';

function player(partial: Partial<JerseyCandidate> & Pick<JerseyCandidate, 'id' | 'equipeId'>): JerseyCandidate {
  return {
    nome: 'Atleta',
    numeroCamisa: 10,
    isAtivo: true,
    isTransferido: false,
    dataFim: null,
    ...partial,
  };
}

describe('camisa repetida na equipe do tenant', () => {
  it('recusa com 409 e mensagem em pt-BR quando outro atleta ativo usa o número', () => {
    const conflict = findActiveJerseyConflict({
      equipeId: equipeA,
      numeroCamisa: 10,
      tenantEquipeIds: [equipeA],
      candidates: [player({ id: 'lucas', nome: 'Lucas Andrade', equipeId: equipeA, numeroCamisa: 10 })],
    });

    assert.deepEqual(conflict, { id: 'lucas', nome: 'Lucas Andrade' });
    const error = jerseyConflictError(10, conflict!.nome);
    assert.equal(error.statusCode, 409);
    assert.equal(error.message, 'Número 10 já está em uso por Lucas Andrade nesta equipe.');
    assert.equal(jerseyConflictMessage(10, 'Lucas Andrade'), error.message);
  });

  it('deixa o próprio atleta manter o número na edição', () => {
    const conflict = findActiveJerseyConflict({
      equipeId: equipeA,
      numeroCamisa: 10,
      tenantEquipeIds: [equipeA],
      excludePlayerId: 'lucas',
      candidates: [player({ id: 'lucas', nome: 'Lucas Andrade', equipeId: equipeA })],
    });
    assert.equal(conflict, null);
  });

  it('ignora transferido, inativo e vínculo encerrado', () => {
    const candidates = [
      player({ id: 't', equipeId: equipeA, isTransferido: true }),
      player({ id: 'i', equipeId: equipeA, isAtivo: false }),
      player({ id: 'f', equipeId: equipeA, dataFim: '2026-01-01' }),
    ];
    assert.equal(
      findActiveJerseyConflict({
        equipeId: equipeA,
        numeroCamisa: 10,
        tenantEquipeIds: [equipeA],
        candidates,
      }),
      null,
    );
  });

  it('não vê camisa de outro tenant, mesmo com o mesmo número', () => {
    const outroClube = player({
      id: 'jogador-b',
      nome: 'Atleta do outro clube',
      equipeId: equipeB,
      numeroCamisa: 10,
    });
    const conflict = findActiveJerseyConflict({
      equipeId: equipeA,
      numeroCamisa: 10,
      tenantEquipeIds: [equipeA],
      candidates: [outroClube],
    });
    assert.equal(conflict, null);

    const lookup = activeJerseyLookup({
      equipeId: equipeA,
      numeroCamisa: 10,
      tenantEquipeIds: [equipeA],
    });
    assert.equal(lookup.refused, false);
    if (lookup.refused) return;
    assert.equal(lookup.where.equipes.some.equipeId, equipeA);
    assert.equal(JSON.stringify(lookup.where).includes(equipeB), false);
    assert.equal(JSON.stringify(lookup).includes('Atleta do outro clube'), false);
  });

  it('recusa a consulta quando a equipe pedida não é do tenant', () => {
    const lookup = activeJerseyLookup({
      equipeId: equipeB,
      numeroCamisa: 10,
      tenantEquipeIds: [equipeA],
    });
    assert.deepEqual(lookup, { refused: true, reason: 'outside_tenant' });

    const conflict = findActiveJerseyConflict({
      equipeId: equipeB,
      numeroCamisa: 10,
      tenantEquipeIds: [equipeA],
      candidates: [player({ id: 'jogador-b', nome: 'Segredo', equipeId: equipeB, numeroCamisa: 10 })],
    });
    assert.equal(conflict, null);
  });
});

describe('update só confere camisa quando o número muda ou o jogador reativa', () => {
  const eu = player({ id: 'eu', nome: 'Ricardo Alves', equipeId: equipeA, numeroCamisa: 7 });
  const outroAtivo = player({ id: 'outro', nome: 'Rafael Souza', equipeId: equipeA, numeroCamisa: 10 });
  const duplicado = player({ id: 'dup', nome: 'Ana Lima', equipeId: equipeA, numeroCamisa: 7 });

  function efeito(
    decision: JerseyUpdateDecision,
    candidates: JerseyCandidate[],
    tenantEquipeIds: readonly string[] = [equipeA],
  ): 'ok' | '409' {
    if (!decision.check) return 'ok';
    const conflict = findActiveJerseyConflict({
      equipeId: equipeA,
      numeroCamisa: decision.numeroCamisa,
      tenantEquipeIds,
      excludePlayerId: 'eu',
      candidates,
    });
    return conflict ? '409' : 'ok';
  }

  it('editar o nome, com a camisa já duplicada, não confere de novo', () => {
    const semNumero = jerseyUpdateCheck({
      numeroInformado: false,
      numeroSalvo: 7,
      isAtivoInformado: false,
      isAtivoSalvo: true,
    });
    const mesmoNumero = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 7,
      numeroSalvo: 7,
      isAtivoInformado: false,
      isAtivoSalvo: true,
    });
    assert.equal(efeito(semNumero, [eu, duplicado]), 'ok');
    assert.equal(efeito(mesmoNumero, [eu, duplicado]), 'ok');
  });

  it('desativar não confere, mesmo se o número mudar no mesmo payload', () => {
    const soDesativa = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 7,
      numeroSalvo: 7,
      isAtivoInformado: true,
      isAtivoNovo: false,
      isAtivoSalvo: true,
    });
    const desativaETroca = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 10,
      numeroSalvo: 7,
      isAtivoInformado: true,
      isAtivoNovo: false,
      isAtivoSalvo: true,
    });
    assert.deepEqual(soDesativa, { check: false });
    assert.deepEqual(desativaETroca, { check: false });
    assert.equal(efeito(desativaETroca, [eu, outroAtivo]), 'ok');
  });

  it('aceita mudar para uma camisa livre e recusa a de outro ativo', () => {
    const livre = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 4,
      numeroSalvo: 7,
      isAtivoInformado: false,
      isAtivoSalvo: true,
    });
    const ocupada = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 10,
      numeroSalvo: 7,
      isAtivoInformado: false,
      isAtivoSalvo: true,
    });
    assert.equal(efeito(livre, [eu, outroAtivo]), 'ok');
    assert.equal(efeito(ocupada, [eu, outroAtivo]), '409');
    if (ocupada.check) {
      const conflict = findActiveJerseyConflict({
        equipeId: equipeA,
        numeroCamisa: ocupada.numeroCamisa,
        tenantEquipeIds: [equipeA],
        excludePlayerId: 'eu',
        candidates: [eu, outroAtivo],
      });
      const error = jerseyConflictError(10, conflict!.nome);
      assert.equal(error.statusCode, 409);
      assert.equal(error.message, 'Número 10 já está em uso por Rafael Souza nesta equipe.');
    }
  });

  it('reativar com camisa de outro ativo recusa, e camisa livre passa', () => {
    const conflito = jerseyUpdateCheck({
      numeroInformado: false,
      numeroSalvo: 10,
      isAtivoInformado: true,
      isAtivoNovo: true,
      isAtivoSalvo: false,
    });
    const mesmoNumeroNoPayload = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 10,
      numeroSalvo: 10,
      isAtivoInformado: true,
      isAtivoNovo: true,
      isAtivoSalvo: false,
    });
    const livre = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 4,
      numeroSalvo: 10,
      isAtivoInformado: true,
      isAtivoNovo: true,
      isAtivoSalvo: false,
    });
    const inativo = player({ id: 'eu', equipeId: equipeA, numeroCamisa: 10, isAtivo: false });
    assert.equal(efeito(conflito, [inativo, outroAtivo]), '409');
    assert.equal(efeito(mesmoNumeroNoPayload, [inativo, outroAtivo]), '409');
    assert.equal(efeito(livre, [inativo, outroAtivo]), 'ok');
  });

  it('camisa igual em outro tenant não impede a troca', () => {
    const troca = jerseyUpdateCheck({
      numeroInformado: true,
      numeroNovo: 10,
      numeroSalvo: 7,
      isAtivoInformado: false,
      isAtivoSalvo: true,
    });
    const outroClube = player({
      id: 'fora',
      nome: 'Atleta do outro clube',
      equipeId: equipeB,
      numeroCamisa: 10,
    });
    assert.equal(efeito(troca, [eu, outroClube]), 'ok');
    assert.equal(JSON.stringify(troca).includes(equipeB), false);
  });
});
