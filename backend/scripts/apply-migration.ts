/**
 * Aplica um ficheiro de migração SQL ao banco configurado em DATABASE_URL.
 *
 * O projeto usa migrações SQL escritas à mão (prisma/migrations/NNN_nome/migration.sql)
 * em vez de `prisma migrate`, porque o schema foi adotado a partir de um banco existente.
 * Este script executa o SQL numa transação e regista a aplicação em `_scout_migrations`.
 *
 * Uso:
 *   npm run migrate:apply 023_subscriptions
 *   npm run migrate:apply 023_subscriptions -- --force   (reaplica uma já registada)
 */

import fs from 'fs';
import path from 'path';
import prisma from '../src/config/database';

/**
 * Divide o SQL em comandos individuais.
 *
 * Um `split(';')` ingénuo parte os blocos `DO $$ ... END $$;` ao meio, porque
 * eles contêm ponto-e-vírgula por dentro. Este parser rastreia o dollar-quoting
 * (`$$`, `$tag$`) e ignora comentários de linha.
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let dollarTag: string | null = null;
  let i = 0;

  while (i < sql.length) {
    // Comentário de linha fora de dollar-quote
    if (!dollarTag && sql.startsWith('--', i)) {
      const end = sql.indexOf('\n', i);
      i = end === -1 ? sql.length : end + 1;
      current += '\n';
      continue;
    }

    if (sql[i] === '$') {
      const match = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (match) {
        const tag = match[0];
        if (dollarTag === null) dollarTag = tag;
        else if (dollarTag === tag) dollarTag = null;
        current += tag;
        i += tag.length;
        continue;
      }
    }

    if (sql[i] === ';' && dollarTag === null) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      i += 1;
      continue;
    }

    current += sql[i];
    i += 1;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function applyMigration() {
  const name = process.argv[2];
  const force = process.argv.includes('--force');

  if (!name) {
    console.error('❌ Informe o nome da migração. Ex.: npm run migrate:apply 023_subscriptions');
    process.exit(1);
  }

  const file = path.join(__dirname, '..', 'prisma', 'migrations', name, 'migration.sql');

  if (!fs.existsSync(file)) {
    console.error(`❌ Migração não encontrada: ${file}`);
    process.exit(1);
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _scout_migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const existing = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    'SELECT name FROM _scout_migrations WHERE name = $1',
    name
  );

  if (existing.length > 0 && !force) {
    console.log(`⏭️  Migração ${name} já aplicada. Use --force para reaplicar.`);
    return;
  }

  const sql = fs.readFileSync(file, 'utf8');
  console.log(`🔄 Aplicando ${name}...`);

  // O pooler do Supabase (pgbouncer em modo transação) recusa múltiplos comandos
  // numa mesma prepared statement, por isso executamos um a um. O SQL das migrações
  // é idempotente (IF NOT EXISTS / EXCEPTION duplicate_object), logo é seguro repetir.
  const statements = splitSqlStatements(sql);
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log(`   ${statements.length} comando(s) executado(s).`);

  await prisma.$executeRawUnsafe(
    'INSERT INTO _scout_migrations (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET applied_at = now()',
    name
  );

  console.log(`✅ Migração ${name} aplicada com sucesso.`);
}

applyMigration()
  .catch((error) => {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
