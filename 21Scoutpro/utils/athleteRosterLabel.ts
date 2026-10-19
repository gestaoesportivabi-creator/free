export interface AthleteNameSource {
  name?: string | null;
  nickname?: string | null;
}

export interface AthleteRosterLabel {
  /** Texto visível. Ellipsis fica no CSS, só quando o layout não couber. */
  label: string;
  /** Sempre o nome completo, para `title` / tooltip. */
  title: string;
}

function collapse(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Rótulo dos cards de Elenco, do Ranking e do Scout Coletivo.
 *
 * O apelido gravado por padrão é `nome.split(' ')[0]`. Em atletas "QA ATLETA 01"
 * isso vira só "QA". Esse recorte automático não entra no rótulo: mostramos o
 * nome completo. Um apelido diferente da primeira palavra (ex.: "Nenê") continua
 * visível, com o nome completo no title.
 */
export function athleteRosterLabel(source: AthleteNameSource): AthleteRosterLabel {
  const full = collapse(source.name);
  const nick = collapse(source.nickname);
  const first = full.split(' ')[0] ?? '';
  const nickIsAutoFirst =
    nick.length > 0 &&
    first.length > 0 &&
    nick.localeCompare(first, 'pt-BR', { sensitivity: 'base' }) === 0;

  const title = full || nick;
  if (!title) return { label: '—', title: '' };

  if (nick && !nickIsAutoFirst && nick.localeCompare(full, 'pt-BR', { sensitivity: 'base' }) !== 0) {
    return { label: nick, title };
  }

  return { label: title, title };
}
