import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  activeJerseyLookup,
  findActiveJerseyConflict,
  jerseyConflictError,
  jerseyConflictMessage,
  type JerseyCandidate,
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
