export type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data: string }[][];
};

export function scaleKeyboard(prefix: string): InlineKeyboard {
  const row1 = [0, 1, 2, 3, 4, 5].map((n) => ({
    text: String(n),
    callback_data: `${prefix}:${n}`,
  }));
  const row2 = [6, 7, 8, 9, 10].map((n) => ({
    text: String(n),
    callback_data: `${prefix}:${n}`,
  }));
  return { inline_keyboard: [row1, row2] };
}

export function cancelRow(): InlineKeyboard['inline_keyboard'][0] {
  return [{ text: '✖ Cancelar', callback_data: 'act:cancel' }];
}

export function fillMenuKeyboard(summary: {
  tasks: AthleteTaskFlags;
  recentMatchOpponent: string | null;
}): InlineKeyboard {
  const rows: InlineKeyboard['inline_keyboard'] = [];
  if (!summary.tasks.bemEstarDiario.completed) {
    rows.push([{ text: '🧘 Bem-estar diário', callback_data: 'act:be' }]);
  }
  if (summary.tasks.pseTreino.required && !summary.tasks.pseTreino.completed) {
    rows.push([{ text: '💪 PSE treino', callback_data: 'act:pse:t' }]);
  }
  if (summary.tasks.psrTreino.required && !summary.tasks.psrTreino.completed) {
    rows.push([{ text: '🔄 PSR pós-treino', callback_data: 'act:psr:t' }]);
  }
  if (summary.recentMatchOpponent) {
    if (summary.tasks.pseJogo.required && !summary.tasks.pseJogo.completed) {
      rows.push([
        {
          text: `⚽ PSE jogo (${summary.recentMatchOpponent})`,
          callback_data: 'act:pse:j',
        },
      ]);
    }
    if (summary.tasks.psrJogo.required && !summary.tasks.psrJogo.completed) {
      rows.push([
        {
          text: `⚽ PSR jogo (${summary.recentMatchOpponent})`,
          callback_data: 'act:psr:j',
        },
      ]);
    }
  }
  rows.push([{ text: '📋 Ver /hoje', callback_data: 'act:hoje' }]);
  return { inline_keyboard: rows.length ? rows : [[{ text: '📋 Ver status', callback_data: 'act:hoje' }]] };
}

type AthleteTaskFlags = {
  bemEstarDiario: { required: boolean; completed: boolean };
  pseTreino: { required: boolean; completed: boolean };
  psrTreino: { required: boolean; completed: boolean };
  pseJogo: { required: boolean; completed: boolean };
  psrJogo: { required: boolean; completed: boolean };
};
