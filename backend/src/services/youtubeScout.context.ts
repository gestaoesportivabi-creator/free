/**
 * Pré-busca dados do YouTube Scout no BFF — evita loop do Hermes em "carregar skill".
 */

import type { TenantInfo } from '../utils/tenant.helper';
import {
  extractOpponentHintFromMessage,
  extractYouTubeUrls,
} from '../utils/youtubeUrl.helper';
import { getLastMatchSummary } from './insights/coachInsights.service';
import {
  addVideoFromPaste,
  type OpponentDetail,
} from './insights/coachOpponents.service';

function trimDetail(detail: OpponentDetail | null | undefined) {
  if (!detail) return null;
  return {
    key: detail.key,
    name: detail.name,
    competition: detail.competition,
    pontosFortes: detail.pontosFortes,
    pontosFracos: detail.pontosFracos,
    analiseTexto: detail.analiseTexto?.slice(0, 2000) ?? null,
    observacoes: detail.observacoes?.slice(0, 1500) ?? null,
    meetings: detail.meetings?.slice(0, 5) ?? [],
    videos: detail.videos?.slice(0, 8) ?? [],
    headToHead: detail.headToHead,
  };
}

export async function buildYouTubeScoutContext(
  tenantInfo: TenantInfo,
  userMessage: string,
  role: string
): Promise<string> {
  const urls = extractYouTubeUrls(userMessage);
  if (urls.length === 0) return '';

  const url = urls[0];
  const opponentHint = extractOpponentHintFromMessage(userMessage);
  const hasEquipes = (tenantInfo.equipe_ids?.length ?? 0) > 0;

  if (!hasEquipes) {
    if (role === 'ADMINISTRADOR') {
      return `[SCOUT21_YOUTUBE_CONTEXT]
status: admin_no_equipe
url: ${url}
${opponentHint ? `opponent_hint: ${opponentHint}` : ''}
acao: Conta administrador sem equipe vinculada. Responda em UMA mensagem: explique que para salvar e extrair scout de video precisa (a) informar o adversario E usar conta de tecnico com equipe, ou (b) consultar tenants em /admin/platform/tenants. NAO diga "carregar skill".`;
    }
    return `[SCOUT21_YOUTUBE_CONTEXT]
status: no_equipe
url: ${url}
acao: Pergunte UMA vez o nome do adversario. NAO diga "carregar skill".`;
  }

  try {
    const saved = await addVideoFromPaste(tenantInfo, {
      url,
      opponentName: opponentHint,
    });
    const [lastMatch, detail] = await Promise.all([
      getLastMatchSummary(tenantInfo).catch(() => ({ match: null })),
      Promise.resolve(saved.opponent),
    ]);

    const pack = {
      status: 'saved',
      url,
      opponent: saved.opponent?.name ?? saved.video?.opponentName,
      opponentKey: saved.opponent?.key ?? saved.video?.opponentKey,
      dossier: trimDetail(detail as OpponentDetail | null),
      lastMatch: lastMatch.match,
    };

    return `[SCOUT21_YOUTUBE_CONTEXT]
status: saved
${JSON.stringify(pack, null, 2)}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar video';
    return `[SCOUT21_YOUTUBE_CONTEXT]
status: save_failed
url: ${url}
${opponentHint ? `opponent_hint: ${opponentHint}` : ''}
error: ${message}
acao: Se faltar adversario, pergunte UMA vez. Se ja informou, explique o erro em portugues simples. NAO diga "carregar skill" nem repita a mesma frase.`;
  }
}
