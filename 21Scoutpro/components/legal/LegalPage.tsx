import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * Páginas legais — Termos de Uso e Política de Privacidade.
 *
 * Obrigatórias antes de abrir o cadastro público: o SCOUT21 recolhe dados de
 * saúde de atletas (lesões, PSE, sono, bem-estar), que a LGPD classifica como
 * dados pessoais sensíveis. O ponto crítico está na cláusula de operador/controlador:
 * quem cadastra os atletas é o clube/técnico, e é dele a responsabilidade pelo
 * consentimento. Sem isso explícito, o risco recai sobre a plataforma.
 *
 * Este texto é uma base séria mas NÃO substitui revisão jurídica antes de produção.
 */

const CONTACT_EMAIL = 'scout21@intersomos.com.br';
const LAST_UPDATE = '6 de agosto de 2026';

interface LegalPageProps {
  document: 'terms' | 'privacy';
  onBack: () => void;
}

const h2 = 'text-lg font-black uppercase tracking-tight text-white mt-10 mb-3';
const h3 = 'text-sm font-bold text-white mt-6 mb-2';
const p = 'text-sm text-zinc-300 leading-relaxed mb-3';
const ul = 'text-sm text-zinc-300 leading-relaxed mb-3 pl-5 list-disc space-y-1.5';

export const LegalPage: React.FC<LegalPageProps> = ({ document, onBack }) => {
  const isTerms = document === 'terms';

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">SCOUT21</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-24">
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
          {isTerms ? 'Termos de Uso' : 'Política de Privacidade'}
        </h1>
        <p className="text-xs text-zinc-500 mt-2">Última atualização: {LAST_UPDATE}</p>

        {isTerms ? <TermsContent /> : <PrivacyContent />}

        <div className="mt-12 pt-6 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Dúvidas sobre este documento? Escreva para{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#00f0ff] hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
};

const TermsContent: React.FC = () => (
  <>
    <h2 className={h2}>1. Aceitação</h2>
    <p className={p}>
      Ao criar uma conta no SCOUT21 você concorda com estes Termos de Uso e com a Política de
      Privacidade. Se não concordar, não utilize a plataforma.
    </p>

    <h2 className={h2}>2. O serviço</h2>
    <p className={p}>
      O SCOUT21 é uma plataforma de scout, análise de desempenho e gestão para equipes esportivas.
      O serviço é fornecido no estado em que se encontra, com melhorias contínuas.
    </p>

    <h2 className={h2}>3. Teste gratuito</h2>
    <p className={p}>
      Novas contas recebem <strong className="text-white">30 dias de acesso gratuito</strong> a
      partir do cadastro. Durante este período:
    </p>
    <ul className={ul}>
      <li>Não solicitamos cartão de crédito, Pix ou qualquer dado de pagamento.</li>
      <li>Não há cobrança automática, nem ao fim do período nem depois dele.</li>
      <li>Não há renovação automática de qualquer espécie.</li>
    </ul>
    <p className={p}>
      Ao término dos 30 dias, o acesso passa a modo de <strong className="text-white">consulta</strong>:
      você continua a poder ver e exportar tudo o que registou, mas o lançamento de novos dados fica
      suspenso. Nenhum dado é apagado nesse momento.
    </p>

    <h2 className={h2}>4. Sua conta</h2>
    <ul className={ul}>
      <li>Você é responsável por manter a confidencialidade da sua senha.</li>
      <li>Você é responsável por toda a atividade realizada na sua conta.</li>
      <li>Contas são pessoais; o compartilhamento de credenciais é desaconselhado.</li>
      <li>Informe-nos imediatamente se suspeitar de acesso não autorizado.</li>
    </ul>

    <h2 className={h2}>5. Dados de terceiros — atletas</h2>
    <p className={p}>
      Esta cláusula é a mais importante deste documento. Ao cadastrar atletas e registar informações
      sobre eles — incluindo dados de saúde como lesões, percepção de esforço, qualidade de sono e
      bem-estar — você atua como <strong className="text-white">controlador</strong> desses dados nos
      termos da Lei Geral de Proteção de Dados (Lei 13.709/2018). O SCOUT21 atua como{' '}
      <strong className="text-white">operador</strong>, processando os dados conforme suas instruções.
    </p>
    <p className={p}>Isso significa que é sua responsabilidade:</p>
    <ul className={ul}>
      <li>Obter o consentimento dos atletas, ou de seus responsáveis legais no caso de menores.</li>
      <li>Informar aos atletas quais dados são recolhidos e com que finalidade.</li>
      <li>Garantir que o tratamento tem base legal adequada.</li>
      <li>Atender a pedidos dos atletas sobre os seus próprios dados.</li>
    </ul>

    <h2 className={h2}>6. Uso aceitável</h2>
    <p className={p}>É vedado utilizar o SCOUT21 para:</p>
    <ul className={ul}>
      <li>Qualquer finalidade ilícita ou que viole direitos de terceiros.</li>
      <li>Tentar obter acesso não autorizado a contas ou sistemas.</li>
      <li>Realizar engenharia reversa, extração automatizada em massa ou sobrecarga do serviço.</li>
      <li>Registar dados de pessoas sem a devida autorização.</li>
    </ul>

    <h2 className={h2}>7. Propriedade</h2>
    <p className={p}>
      O software, a marca e a interface do SCOUT21 pertencem aos seus desenvolvedores.{' '}
      <strong className="text-white">Os dados que você regista pertencem a você</strong> e podem ser
      exportados a qualquer momento.
    </p>

    <h2 className={h2}>8. Limitação de responsabilidade</h2>
    <p className={p}>
      O SCOUT21 é uma ferramenta de apoio à decisão. As decisões técnicas, táticas e de saúde tomadas
      a partir dos dados são de responsabilidade exclusiva do usuário e da sua comissão técnica.
      A plataforma não substitui avaliação médica ou profissional qualificada.
    </p>

    <h2 className={h2}>9. Encerramento</h2>
    <p className={p}>
      Você pode encerrar sua conta a qualquer momento. Podemos suspender contas que violem estes
      termos, com aviso prévio sempre que possível.
    </p>

    <h2 className={h2}>10. Alterações</h2>
    <p className={p}>
      Estes termos podem ser atualizados. Alterações relevantes serão comunicadas por e-mail com
      antecedência razoável.
    </p>

    <h2 className={h2}>11. Foro</h2>
    <p className={p}>
      Aplica-se a legislação brasileira. Fica eleito o foro da comarca do domicílio do usuário para
      dirimir controvérsias.
    </p>
  </>
);

const PrivacyContent: React.FC = () => (
  <>
    <h2 className={h2}>1. Quem somos</h2>
    <p className={p}>
      O SCOUT21 é operado pela Intersomos. Para qualquer questão sobre dados pessoais, incluindo o
      exercício dos seus direitos, escreva para{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#00f0ff] hover:underline">{CONTACT_EMAIL}</a>.
    </p>

    <h2 className={h2}>2. Dados que recolhemos</h2>

    <h3 className={h3}>2.1 Dados da sua conta</h3>
    <ul className={ul}>
      <li>Nome, e-mail e senha (armazenada apenas como hash criptográfico).</li>
      <li>Nome da equipe e, se fornecido, escudo.</li>
      <li>Telefone, quando informado voluntariamente.</li>
      <li>Data e hora do último acesso.</li>
    </ul>

    <h3 className={h3}>2.2 Dados que você regista sobre atletas</h3>
    <p className={p}>
      Incluem nome, número, posição, idade, dados antropométricos e, conforme o seu uso da
      plataforma, <strong className="text-white">dados de saúde</strong>: histórico de lesões,
      percepção subjetiva de esforço, qualidade de sono e indicadores de bem-estar.
    </p>
    <p className={p}>
      Estes dados são classificados como <strong className="text-white">dados pessoais sensíveis</strong>{' '}
      pela LGPD e recebem tratamento reforçado: acesso restrito ao seu tenant, transmissão cifrada e
      isolamento entre contas.
    </p>

    <h3 className={h3}>2.3 Dados técnicos</h3>
    <ul className={ul}>
      <li>Endereço IP e identificação do navegador, para segurança e prevenção de abuso.</li>
      <li>Parâmetros de origem (UTM), quando você chega por uma campanha.</li>
      <li>Registos de erro, para diagnóstico.</li>
    </ul>

    <h2 className={h2}>3. Para que usamos</h2>
    <ul className={ul}>
      <li>Fornecer e operar a plataforma.</li>
      <li>Autenticar o seu acesso e proteger a sua conta.</li>
      <li>Enviar e-mails operacionais: confirmação, recuperação de senha e avisos sobre o teste.</li>
      <li>Melhorar o produto a partir de padrões de uso agregados.</li>
      <li>Cumprir obrigações legais.</li>
    </ul>
    <p className={p}>
      <strong className="text-white">Não vendemos os seus dados</strong> e não os partilhamos com
      terceiros para fins publicitários.
    </p>

    <h2 className={h2}>4. Base legal</h2>
    <ul className={ul}>
      <li><strong className="text-white">Execução de contrato</strong> — dados da sua conta e operação do serviço.</li>
      <li><strong className="text-white">Legítimo interesse</strong> — segurança, prevenção de fraude e melhoria do produto.</li>
      <li><strong className="text-white">Consentimento</strong> — comunicações não essenciais.</li>
      <li><strong className="text-white">Responsabilidade do controlador</strong> — no caso dos dados de atletas, a base legal é definida por você (clube/técnico), conforme a cláusula 5 dos Termos de Uso.</li>
    </ul>

    <h2 className={h2}>5. Com quem partilhamos</h2>
    <p className={p}>Apenas com fornecedores necessários à operação, todos sob contrato:</p>
    <ul className={ul}>
      <li><strong className="text-white">Supabase</strong> — base de dados.</li>
      <li><strong className="text-white">Vercel</strong> — hospedagem da aplicação.</li>
      <li><strong className="text-white">Resend</strong> — envio de e-mails transacionais.</li>
    </ul>

    <h2 className={h2}>6. Retenção</h2>
    <ul className={ul}>
      <li>Dados da conta ativa: enquanto a conta existir.</li>
      <li>Após o fim do teste: dados preservados e acessíveis por consulta e exportação.</li>
      <li>Conta inativa por longo período: aviso por e-mail com 30 dias de antecedência antes de qualquer arquivamento.</li>
      <li>Pedido de exclusão: cumprido em até 30 dias, salvo obrigação legal de retenção.</li>
    </ul>

    <h2 className={h2}>7. Seus direitos (LGPD, art. 18)</h2>
    <ul className={ul}>
      <li>Confirmação de existência de tratamento.</li>
      <li>Acesso aos seus dados.</li>
      <li>Correção de dados incompletos ou desatualizados.</li>
      <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
      <li>Portabilidade — exportação dos seus dados em formato legível.</li>
      <li>Eliminação dos dados tratados com base em consentimento.</li>
      <li>Informação sobre com quem os dados foram partilhados.</li>
      <li>Revogação do consentimento.</li>
    </ul>
    <p className={p}>
      Para exercer qualquer destes direitos, escreva para{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#00f0ff] hover:underline">{CONTACT_EMAIL}</a>.
      Respondemos em até 15 dias.
    </p>

    <h2 className={h2}>8. Segurança</h2>
    <ul className={ul}>
      <li>Transmissão cifrada (HTTPS) em toda a aplicação.</li>
      <li>Senhas armazenadas com hash bcrypt — nunca em texto legível.</li>
      <li>Isolamento entre contas: cada tenant só acede aos próprios dados.</li>
      <li>Tokens de autenticação com expiração e uso único.</li>
    </ul>
    <p className={p}>
      Nenhum sistema é infalível. Em caso de incidente de segurança relevante, comunicaremos os
      afetados e a autoridade competente conforme exige a LGPD.
    </p>

    <h2 className={h2}>9. Cookies</h2>
    <p className={p}>
      Utilizamos armazenamento local do navegador para manter a sua sessão iniciada e guardar
      preferências de interface. São essenciais ao funcionamento e não servem para publicidade.
    </p>

    <h2 className={h2}>10. Menores de idade</h2>
    <p className={p}>
      A plataforma destina-se a profissionais maiores de 18 anos. Atletas menores podem ter dados
      registados pelo clube, desde que com consentimento dos responsáveis legais — obrigação do
      controlador, conforme a cláusula 5 dos Termos de Uso.
    </p>

    <h2 className={h2}>11. Alterações</h2>
    <p className={p}>
      Alterações relevantes nesta política serão comunicadas por e-mail antes de entrarem em vigor.
    </p>
  </>
);
