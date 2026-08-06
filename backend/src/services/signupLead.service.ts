/**
 * Registo do cadastro na tabela de leads.
 *
 * Motivo: o funil de aquisição já vive em `leads` (landing, blog, outreach).
 * Escrever ali também os auto-cadastros mantém uma fonte única para medir
 * "visitante → lead → conta" sem juntar tabelas em cada consulta.
 *
 * Nunca lança: uma falha aqui não pode derrubar um cadastro bem-sucedido.
 */

import prisma from '../config/database';

interface SignupLeadInput {
  name: string;
  email: string;
  phone?: string | null;
  source: string;
}

export async function captureSignupLead(input: SignupLeadInput): Promise<void> {
  try {
    await prisma.lead.create({
      data: {
        name: input.name.slice(0, 255),
        email: input.email.slice(0, 255),
        phone: input.phone?.slice(0, 50) ?? null,
        message: null,
        source: input.source.slice(0, 120),
        lang: 'pt-BR',
      },
    });
  } catch (error) {
    // Log e segue: o lead é telemetria, a conta é o que importa.
    console.warn('[signupLead] Não foi possível registar o lead:', error);
  }
}
