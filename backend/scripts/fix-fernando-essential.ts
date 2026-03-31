/**
 * One-off: utilizador(es) com nome contendo "Fernando" com role ADMINISTRADOR
 * passam a ESSENCIAL e ganham registo Técnico se necessário.
 *
 * Uso: npx tsx scripts/fix-fernando-essential.ts
 *
 * Usa SQL raw no UPDATE para não depender da coluna last_login_at (migration pendente).
 */

import prisma from '../src/config/database';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(id: string, label: string): string {
  if (!UUID_RE.test(id)) throw new Error(`${label} inválido: ${id}`);
  return id;
}

async function main() {
  const essential = await prisma.role.findUnique({ where: { name: 'ESSENCIAL' } });
  if (!essential) throw new Error('Role ESSENCIAL não encontrada.');

  const rows = await prisma.$queryRaw<
    { id: string; name: string; email: string; clube_id: string | null }[]
  >`
    SELECT u.id, u.name, u.email, c.id AS clube_id
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    LEFT JOIN clubes c ON c.user_id = u.id
    WHERE r.name = 'ADMINISTRADOR' AND u.name ILIKE '%Fernando%'
  `;

  if (rows.length === 0) {
    const anyF = await prisma.$queryRaw<{ name: string; email: string; role_name: string }[]>`
      SELECT u.name, u.email, r.name AS role_name
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.name ILIKE '%Fernando%'
    `;
    if (anyF.length === 0) {
      console.log('Nenhum usuário com nome contendo "Fernando".');
    } else {
      console.log('Usuários "Fernando" encontrados, mas nenhum com role ADMINISTRADOR:');
      anyF.forEach((u) => console.log(`  - ${u.name} <${u.email}> → ${u.role_name}`));
    }
    return;
  }

  for (const row of rows) {
    if (row.clube_id) {
      const n = await prisma.$queryRawUnsafe<[{ n: bigint }]>(
        `SELECT COUNT(*)::bigint AS n FROM equipes WHERE clube_id = $1::uuid`,
        row.clube_id
      );
      if (Number(n[0].n) > 0) {
        console.error(`❌ ${row.email}: clube tem equipes; ajuste manualmente.`);
        continue;
      }
      await prisma.$executeRawUnsafe(`DELETE FROM clubes WHERE id = $1`, row.clube_id);
    }

    const rid = assertUuid(essential.id, 'role ESSENCIAL');
    const uid = assertUuid(row.id, 'user');
    // Colunas id/role_id em alguns ambientes são TEXT (não UUID nativo)
    await prisma.$executeRawUnsafe(
      `UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2`,
      rid,
      uid
    );

    const hasTecnico = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
      `SELECT COUNT(*)::bigint AS c FROM tecnicos WHERE user_id = $1`,
      row.id
    );
    if (Number(hasTecnico[0].c) === 0) {
      await prisma.tecnico.create({
        data: { userId: row.id, nome: row.name },
      });
    }

    console.log(`✅ ${row.name} <${row.email}> → ESSENCIAL (era ADMINISTRADOR)`);
  }

  console.log('\nConcluído.');
}

main()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
