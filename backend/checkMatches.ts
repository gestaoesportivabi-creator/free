import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:%23Gestaoesportiva21@db.mymuvraqtnoqrtuzoimj.supabase.co:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  console.log("\n--- BUSCA DETALHADA: 'teste' ---");
  const programadas: any[] = await prisma.$queryRaw`
    SELECT cj.id, cj.data, cj.adversario, c.equipe_id 
    FROM campeonatos_jogos cj
    JOIN campeonatos c ON cj.campeonato_id = c.id
    WHERE cj.adversario ILIKE '%teste%'
  `;
  console.log("📅 PROGRAMADAS (Agendadas):", programadas);

  const salvas: any[] = await prisma.$queryRaw`
    SELECT id, data, adversario, equipe_id, status 
    FROM jogos 
    WHERE adversario ILIKE '%teste%'
  `;
  console.log("📈 SALVAS (Scouts):", salvas);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
