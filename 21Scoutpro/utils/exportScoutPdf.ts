/**
 * Exporta o Scout Coletivo para PDF com geração programática (jsPDF).
 * Regras: header preto, marca d'água, um gráfico por página, donuts, ícones.
 */

import { jsPDF } from 'jspdf';
import type { PlayerTop10RowPdf } from './scoutPlayerStatsHelpers';

export interface PlayerTablesPdf {
  passes: PlayerTop10RowPdf[];
  shots: PlayerTop10RowPdf[];
  tackles: PlayerTop10RowPdf[];
  criticalErrors: PlayerTop10RowPdf[];
}

const LOGO_URL = '/public-logo.png.png';
const BRAND_NAME = 'SCOUT21';
const HEADER_PHRASE_PART1 = 'SCOUT21';
const HEADER_PHRASE_PART2 = ' — Gestão esportiva baseada em dados para decisões vencedoras.';
const WHATSAPP = '(48) 99148-6176';
const SITE = 'https://gestaoesportiva-free.vercel.app';

// Ícone WhatsApp - converte SVG para PNG via canvas (jsPDF não suporta SVG em addImage)
function loadWhatsAppIconPng(): Promise<string | null> {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else resolve(null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Cores da marca (RGB para jsPDF)
const COLORS = {
  cyan: [0, 240, 255] as [number, number, number],
  blueDark: [37, 99, 235] as [number, number, number],
  blueMedium: [59, 130, 246] as [number, number, number],
  blueLight: [96, 165, 250] as [number, number, number],
  rose: [255, 0, 85] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  /** Contra-ataque (Tipos de Desarmes) — azul bem mais escuro que blueDark */
  counterAttackDark: [30, 58, 138] as [number, number, number],
  slate: [113, 113, 122] as [number, number, number],
  /** Bloqueado (finalizações) — alinhado ao gráfico web */
  amber: [245, 158, 11] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [100, 100, 100] as [number, number, number],
};

// Cores para donuts (hex -> RGB)
const PIE_COLORS_SCORED = [[0, 153, 163], [74, 141, 232], [45, 106, 216], [29, 79, 214], [22, 51, 140], [10, 139, 196], [90, 90, 98]] as [number, number, number][];
const PIE_COLORS_CONCEDED = [[30, 64, 175], [37, 99, 235], [59, 130, 246], [0, 240, 255], [96, 165, 250], [14, 165, 233], [113, 113, 122]] as [number, number, number][];
const PIE_ORIGIN_BLUE = [0, 240, 255] as [number, number, number];
const PIE_ORIGIN_SLATE = [113, 113, 122] as [number, number, number];

const MARGIN = 15;
// A4 paisagem: 297mm x 210mm
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const WATERMARK_CENTER_Y = PAGE_HEIGHT / 2;
/** Número da página (canto inferior direito; páginas após a capa) */
const PAGE_NUM_Y = PAGE_HEIGHT - 8;
// Ajuste de espaçamento para paisagem (mantém proporção do layout em retrato)
const TOP_CHART_Y = 18;
/** Espaço entre o bloco de filtros e o título «RESUMO DE INDICADORES» (pág. 2) */
const GAP_FILTERS_TO_RESUMO_MM = 11;
/** Espaço entre o fim do resumo de KPIs e «META DE DESARMES» */
const GAP_RESUMO_TO_GAUGE_MM = 10;
/** Rosca acima da marca d'água (centro ~105 mm) */
const DONUT_PAIR_UPPER_Y = 18;
/** Rosca abaixo da marca d'água (par na mesma página) */
const DONUT_PAIR_LOWER_Y = 116;
const HEADER_PHRASE_SIZE = 16;
const COVER_TITLE = 'ANÁLISE DE ESTATÍSTICAS DO CLUBE';
/** Logo no canto inferior esquerdo (páginas internas; não na capa) */
const LOGO_CORNER_MAX_W_MM = 24;
/** Marca d'água central = logo (largura máx. em mm) */
const WATERMARK_LOGO_MAX_W_MM = 115;
const COVER_FOOTER_Y = PAGE_HEIGHT - 12;
/** Espaço entre o fim do título «ANÁLISE DE ESTATÍSTICAS…» e a linha nome + escudo */
const COVER_TITLE_TO_CLUB_GAP_MM = 16;
/** Altura máx. do escudo do clube na capa (mm) */
const COVER_SHIELD_MAX_H_MM = 14;
/** Espaço entre escudo e nome do clube */
const COVER_SHIELD_NAME_GAP_MM = 4;

export interface ExportScoutPdfFilters {
  compFilter?: string;
  monthFilter?: string;
  opponentFilter?: string;
  locationFilter?: string;
}

export interface ScoutPdfData {
  filters?: ExportScoutPdfFilters;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    avgGoalsScored: string | number;
    avgGoalsConceded: string | number;
    avgTacklesPerGame: string | number;
    passesCorrect: number;
    passesWrong: number;
    shotsOn: number;
    shotsOff: number;
    shotsShootZone: number;
    tacklesWithBall: number;
    tacklesWithoutBall: number;
    tacklesCounterAttack: number;
    tacklesTotal: number;
    wrongPassesTransition: number;
    yellowCards: number;
    redCards: number;
    goalsScoredOpen: number;
    goalsScoredSet: number;
    goalsConcededOpen: number;
    goalsConcededSet: number;
    goalMethodsScored: Record<string, number>;
    goalMethodsConceded: Record<string, number>;
  };
  timePeriodData: {
    maxScoredPeriod: { period: string; percentage: string };
    maxConcededPeriod: { period: string; percentage: string };
    scoredDist: Array<{ period: string; value: number }>;
    concededDist: Array<{ period: string; value: number }>;
  };
  chartData: Array<{
    name: string;
    passesCorrect: number;
    passesWrong: number;
    shotsOn: number;
    shotsOff: number;
    shotsShootZone: number;
    tacklesWithBall: number;
    tacklesWithoutBall: number;
    tacklesCounterAttack: number;
    transitionErrors: number;
  }>;
  goalMethodsScoredData: Array<{ name: string; value: number; percentage: string }>;
  goalMethodsConcededData: Array<{ name: string; value: number; percentage: string }>;
  goalOriginScoredData: Array<{ name: string; value: number; percentage: string }>;
  goalOriginConcededData: Array<{ name: string; value: number; percentage: string }>;
  gaugeData?: { percentageDisplay: number | string; totalTackles: number; tackleTarget: number; hasTackleTarget: boolean };
  teamShieldUrl?: string;
  teamName?: string;
  /** Top 10 jogadores por gráfico (mesma lógica da tabela na tela) */
  playerTables?: PlayerTablesPdf;
}

/** Logo PNG (fundo transparente) para cabeçalho e capa do PDF */
function loadLogoForPdf(): Promise<{ dataUrl: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = window.location.origin + LOGO_URL;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        } else resolve(null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Escudo do clube (URL ou data URL) para a capa do PDF — retorna PNG + dimensões */
function loadTeamShieldForPdf(
  src: string | undefined
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!src || !String(src).trim()) return Promise.resolve(null);
  const url = String(src).trim();
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        } else resolve(null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function loadImageBase64(src: string): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  if (src.startsWith('data:')) return Promise.resolve(src);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else resolve(null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Marca d'água: logo central semitransparente (fallback: texto cinza) */
function drawWatermark(
  doc: jsPDF,
  logoBase64: string | null,
  logoPdf: { width: number; height: number } | null
): void {
  doc.saveGraphicsState();
  try {
    const GState = (doc as any).GState;
    if (GState) doc.setGState(new GState({ opacity: 0.14 }));
  } catch {
    /* fallback: sem transparência nativa */
  }
  if (logoBase64) {
    const aspect = logoPdf ? logoPdf.width / Math.max(logoPdf.height, 1) : 2.2;
    const w = WATERMARK_LOGO_MAX_W_MM;
    const h = w / aspect;
    const x = PAGE_WIDTH / 2 - w / 2;
    const y = PAGE_HEIGHT / 2 - h / 2;
    try {
      doc.addImage(logoBase64, 'PNG', x, y, w, h);
    } catch {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(72);
      doc.setTextColor(120, 120, 120);
      doc.text(BRAND_NAME, PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(72);
    doc.setTextColor(120, 120, 120);
    doc.text(BRAND_NAME, PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center' });
  }
  doc.restoreGraphicsState();
}

function fillBackground(doc: jsPDF): void {
  doc.setFillColor(...COLORS.black);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
}

/** Contato (WhatsApp + site) — apenas na capa, centralizado na base */
function drawCoverContactFooter(doc: jsPDF, whatsAppIconPng: string | null, footerY: number): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(170, 170, 170);
  const iconSize = 4;
  const text = `WhatsApp: ${WHATSAPP}  |  ${SITE.replace('https://', '')}`;
  if (whatsAppIconPng) {
    try {
      const tw = doc.getTextWidth(text);
      const totalW = iconSize + 2 + tw;
      const startX = (PAGE_WIDTH - totalW) / 2;
      doc.addImage(whatsAppIconPng, 'PNG', startX, footerY - iconSize / 2, iconSize, iconSize);
      doc.text(text, startX + iconSize + 2, footerY);
    } catch {
      doc.text(text, PAGE_WIDTH / 2, footerY, { align: 'center' });
    }
  } else {
    doc.text(text, PAGE_WIDTH / 2, footerY, { align: 'center' });
  }
}

/** Número da página no canto inferior direito (páginas após a capa) */
function drawPageNumberBottomRight(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(170, 170, 170);
  const text = `${pageNum} / ${totalPages}`;
  doc.text(text, PAGE_WIDTH - MARGIN, PAGE_NUM_Y, { align: 'right' });
}

/** Logo no canto inferior esquerdo: encostada à borda esquerda e à base (sem margem lateral/inferior) */
function drawLogoBottomLeft(
  doc: jsPDF,
  logoBase64: string | null,
  logoPdf: { width: number; height: number } | null
): void {
  if (!logoBase64) return;
  const aspect = logoPdf ? logoPdf.width / Math.max(logoPdf.height, 1) : 2.2;
  const w = LOGO_CORNER_MAX_W_MM;
  const h = w / aspect;
  const x = 0;
  const y = PAGE_HEIGHT - h;
  try {
    doc.addImage(logoBase64, 'PNG', x, y, w, h);
  } catch {
    /* ignora se addImage falhar */
  }
}

function newPageWithWatermark(
  doc: jsPDF,
  logoBase64: string | null,
  logoPdf: { width: number; height: number } | null
): void {
  doc.addPage();
  fillBackground(doc);
  drawWatermark(doc, logoBase64, logoPdf);
}

export function exportScoutToPdf(data: ScoutPdfData): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const overlay = document.createElement('div');
    overlay.id = 'pdf-export-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 1000000;
      background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
      font-family: Calibri, sans-serif; font-size: 18px; color: #00f0ff; font-weight: bold;
    `;
    overlay.textContent = 'Gerando PDF...';
    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      const [logoPdf, teamShieldPdf] = await Promise.all([
        loadLogoForPdf(),
        loadTeamShieldForPdf(data.teamShieldUrl),
      ]);
      const logoBase64 = logoPdf?.dataUrl ?? null;
      const logoDims = logoPdf ? { width: logoPdf.width, height: logoPdf.height } : null;

      // CAPA (página 1): fundo preto + título superior (quebra de linha) + nome do clube
      // + escudo (Configurações) ao lado do nome + logo central SCOUT21 e tagline
      fillBackground(doc);

      // Título superior com quebra de linha
      const titleLines = doc.splitTextToSize(COVER_TITLE, PAGE_WIDTH - MARGIN * 2);
      const titleStartY = 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(...COLORS.white);
      doc.text(titleLines as string[], PAGE_WIDTH / 2, titleStartY, { align: 'center' });

      // Nome do clube + escudo (Configurações), com mais espaço abaixo do título
      const teamNameUpper = (data.teamName || '').trim().toUpperCase();
      const clubNameY = titleStartY + titleLines.length * 8 + COVER_TITLE_TO_CLUB_GAP_MM;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(22);
      doc.setTextColor(...COLORS.white);
      if (teamNameUpper && teamShieldPdf) {
        const aspect = teamShieldPdf.width / Math.max(teamShieldPdf.height, 1);
        let shH = COVER_SHIELD_MAX_H_MM;
        let shW = shH * aspect;
        const maxShieldW = 32;
        if (shW > maxShieldW) {
          shW = maxShieldW;
          shH = shW / aspect;
        }
        const textW = doc.getTextWidth(teamNameUpper);
        const blockW = shW + COVER_SHIELD_NAME_GAP_MM + textW;
        const startX = PAGE_WIDTH / 2 - blockW / 2;
        const textCenterY = clubNameY - 2.4;
        const imgY = textCenterY - shH / 2;
        let shieldOk = false;
        try {
          doc.addImage(teamShieldPdf.dataUrl, 'PNG', startX, imgY, shW, shH);
          shieldOk = true;
        } catch {
          shieldOk = false;
        }
        if (shieldOk) {
          doc.text(teamNameUpper, startX + shW + COVER_SHIELD_NAME_GAP_MM, clubNameY);
        } else {
          doc.text(teamNameUpper, PAGE_WIDTH / 2, clubNameY, { align: 'center' });
        }
      } else if (teamNameUpper) {
        doc.text(teamNameUpper, PAGE_WIDTH / 2, clubNameY, { align: 'center' });
      } else if (teamShieldPdf) {
        const aspect = teamShieldPdf.width / Math.max(teamShieldPdf.height, 1);
        let shH = COVER_SHIELD_MAX_H_MM;
        let shW = shH * aspect;
        if (shW > 40) {
          shW = 40;
          shH = shW / aspect;
        }
        try {
          doc.addImage(
            teamShieldPdf.dataUrl,
            'PNG',
            PAGE_WIDTH / 2 - shW / 2,
            clubNameY - shH / 2 - 2,
            shW,
            shH
          );
        } catch {
          /* ignora */
        }
      }

      // Centro da capa: logo PNG (transparente) ou texto fallback
      const scoutLogoCenterY = 98;
      let taglineStartY = scoutLogoCenterY + 22;
      if (logoPdf && logoBase64) {
        const maxLogoW = 78;
        const aspect = logoPdf.width / Math.max(logoPdf.height, 1);
        const imgW = maxLogoW;
        const imgH = maxLogoW / aspect;
        const x = PAGE_WIDTH / 2 - imgW / 2;
        const yTop = scoutLogoCenterY - imgH / 2;
        try {
          doc.addImage(logoBase64, 'PNG', x, yTop, imgW, imgH);
        } catch {
          doc.setFont('helvetica', 'bolditalic');
          doc.setFontSize(38);
          doc.setTextColor(...COLORS.cyan);
          doc.text(BRAND_NAME, PAGE_WIDTH / 2, scoutLogoCenterY, { align: 'center' });
        }
        taglineStartY = yTop + imgH + 10;
      } else {
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(38);
        doc.setTextColor(...COLORS.cyan);
        doc.text(BRAND_NAME, PAGE_WIDTH / 2, scoutLogoCenterY, { align: 'center' });
      }

      // Tagline abaixo do logo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(20);
      doc.setTextColor(...COLORS.white);
      doc.text('Gestão esportiva baseada em dados para decisões', PAGE_WIDTH / 2, taglineStartY, { align: 'center' });
      doc.text('vencedoras.', PAGE_WIDTH / 2, taglineStartY + 10, { align: 'center' });

      // Folha 1 (conteúdo): marca d'água (logo) + RESUMO (sup) + META (inf) — logo canto no loop final
      doc.addPage();
      fillBackground(doc);
      drawWatermark(doc, logoBase64, logoDims);
      const yAfterFilters = drawFiltersSummary(doc, TOP_CHART_Y, data.filters);
      const resumoStartY =
        yAfterFilters > TOP_CHART_Y ? yAfterFilters + GAP_FILTERS_TO_RESUMO_MM : yAfterFilters;
      const resumoEndY = drawResumoSection(doc, resumoStartY, data);
      drawGaugeSection(doc, resumoEndY + GAP_RESUMO_TO_GAUGE_MM, data.gaugeData, data.stats.tacklesTotal);

      const barH = 28;
      const compactOpts = { chartHeight: barH };
      const pt = data.playerTables;
      const hdrPasses = ['JOGADOR', 'CERTOS', 'ERRADOS', 'TOTAL'] as [string, string, string, string];
      const hdrShots = ['JOGADOR', 'NO GOL', 'FORA', 'BLOQ.', 'TOTAL'] as [
        string,
        string,
        string,
        string,
        string,
      ];
      const hdrTackles = ['JOGADOR', 'C/SEM POSSE', 'C.-ATQ.', 'TOTAL'] as [string, string, string, string];
      const hdrCrit = ['JOGADOR', 'P. ERRADOS', 'GER. TRANS.', 'TOTAL'] as [string, string, string, string];

      // Pág 3: Passes certos vs errados
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawBarChartSection(doc, TOP_CHART_Y, 'Passes Certos vs Errados', data.chartData, [
        { key: 'passesCorrect', label: 'Certos', color: COLORS.green },
        { key: 'passesWrong', label: 'Errados', color: COLORS.rose },
      ], data.stats.passesCorrect + data.stats.passesWrong, {
        ...compactOpts,
        playerTable: pt?.passes?.length ? { headers: hdrPasses, rows: pt.passes } : undefined,
      });

      // Pág 4: Finalizações (no gol, fora, bloqueado)
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawBarChartSection(doc, TOP_CHART_Y, 'Finalizações', data.chartData, [
        { key: 'shotsOn', label: 'No Gol', color: COLORS.blueMedium },
        { key: 'shotsOff', label: 'Pra Fora', color: COLORS.slate },
        { key: 'shotsShootZone', label: 'Bloqueado', color: COLORS.amber },
      ], data.stats.shotsOn + data.stats.shotsOff + data.stats.shotsShootZone, {
        ...compactOpts,
        playerTable: pt?.shots?.length ? { headers: hdrShots, rows: pt.shots } : undefined,
      });

      // Pág 5: Tipos de Desarmes
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawBarChartSection(doc, TOP_CHART_Y, 'Tipos de Desarmes', data.chartData, [
        { key: 'tacklesWithBall', label: 'Com Posse', color: COLORS.blueLight },
        { key: 'tacklesWithoutBall', label: 'Sem Posse', color: COLORS.blueDark },
        { key: 'tacklesCounterAttack', label: 'Contra-Ataque', color: COLORS.counterAttackDark },
      ], data.stats.tacklesTotal, {
        ...compactOpts,
        playerTable: pt?.tackles?.length ? { headers: hdrTackles, rows: pt.tackles } : undefined,
      });

      // Pág 6: Erros Críticos (Transição)
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawBarChartSection(doc, TOP_CHART_Y, 'Erros Críticos (Transição)', data.chartData, [
        { key: 'passesWrong', label: 'Passes errados', color: COLORS.slate },
        { key: 'transitionErrors', label: 'Geraram transição', color: COLORS.rose },
      ], data.stats.wrongPassesTransition, {
        ...compactOpts,
        playerTable: pt?.criticalErrors?.length ? { headers: hdrCrit, rows: pt.criticalErrors } : undefined,
      });

      // Pág 7–8: Gols por período (uma página cada)
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawTimePeriodChart(doc, TOP_CHART_Y, 'Gols Feitos por Período', data.timePeriodData.scoredDist, COLORS.green,
        `${data.timePeriodData.maxScoredPeriod.percentage}% dos gols feitos saíram no período de ${data.timePeriodData.maxScoredPeriod.period}`,
        compactOpts);
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawTimePeriodChart(doc, TOP_CHART_Y, 'Gols Tomados por Período', data.timePeriodData.concededDist, COLORS.rose,
        `${data.timePeriodData.maxConcededPeriod.percentage}% dos gols tomados saíram no período de ${data.timePeriodData.maxConcededPeriod.period}`,
        compactOpts);

      const detailedDonutOpts = { donutSize: 36 };
      const originDonutOpts = { donutSize: 36 };

      /* Pág. única: Marcado — detalhados (acima da marca d'água) + origem (abaixo) */
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawDonutPairPage(
        doc,
        {
          title: 'Métodos de Gols Marcado - Métodos Detalhados',
          data: data.goalMethodsScoredData,
          colors: PIE_COLORS_SCORED,
          opts: detailedDonutOpts,
        },
        {
          title: 'Métodos de Gols Marcado - Origem do Gol',
          data: data.goalOriginScoredData,
          colors: [PIE_ORIGIN_BLUE, PIE_ORIGIN_SLATE],
          opts: originDonutOpts,
        }
      );
      /* Pág. única: Tomado — detalhados + origem */
      newPageWithWatermark(doc, logoBase64, logoDims);
      drawDonutPairPage(
        doc,
        {
          title: 'Métodos de Gols Tomado - Métodos Detalhados',
          data: data.goalMethodsConcededData,
          colors: PIE_COLORS_CONCEDED,
          opts: detailedDonutOpts,
        },
        {
          title: 'Métodos de Gols Tomado - Origem do Gol',
          data: data.goalOriginConcededData,
          colors: [[30, 64, 175] as [number, number, number], PIE_ORIGIN_SLATE],
          opts: originDonutOpts,
        }
      );

      // Capa: contato centralizado na base. Demais páginas: número inferior direito + logo canto esquerdo (sem contato)
      const whatsAppIconPng = await loadWhatsAppIconPng();
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        if (p === 1) {
          drawCoverContactFooter(doc, whatsAppIconPng, COVER_FOOTER_Y);
        } else {
          drawPageNumberBottomRight(doc, p, pageCount);
          drawLogoBottomLeft(doc, logoBase64, logoDims);
        }
      }

      const filename = `scout-coletivo-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      cleanup();
      resolve();
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function formatMonthFilterForPdf(m: string | undefined): string {
  if (!m || m === 'Todos') return 'Todos os meses';
  const idx = parseInt(m, 10);
  if (!Number.isNaN(idx) && idx >= 0 && idx <= 11) return MONTH_NAMES_PT[idx];
  return m;
}

function formatLocationFilterForPdf(loc: string | undefined): string {
  if (!loc || loc === 'Todos') return 'Todos os locais';
  if (loc === 'Mandante' || loc === 'Visitante') return loc;
  return loc;
}

/** Bloco «FILTROS APLICADOS» no topo da pág. 2; retorna Y após o bloco (ou startY se não houver filtros). */
function drawFiltersSummary(doc: jsPDF, startY: number, filters?: ExportScoutPdfFilters): number {
  if (!filters) return startY;

  const comp = filters.compFilter?.trim() || 'Todas';
  const month = formatMonthFilterForPdf(filters.monthFilter);
  const opp = filters.opponentFilter?.trim() || 'Todos';
  const loc = formatLocationFilterForPdf(filters.locationFilter);

  const lines = [
    `Competição: ${comp === 'Todas' ? 'Todas as competições' : comp}`,
    `Mês: ${month}`,
    `Adversário: ${opp === 'Todos' ? 'Todos os adversários' : opp}`,
    `Local: ${loc}`,
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.cyan);
  doc.text('FILTROS APLICADOS', MARGIN, startY, { charSpace: -0.2 });
  let y = startY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, CONTENT_WIDTH);
    wrapped.forEach((w) => {
      doc.text(w, MARGIN, y);
      y += 4;
    });
  });
  return y + 2;
}

function drawResumoSection(doc: jsPDF, startY: number, data: ScoutPdfData): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text('RESUMO DE INDICADORES', MARGIN, startY, { charSpace: -0.2 });
  startY += 8;

  doc.setFontSize(10);
  const kpis: [string, string | number][] = [
    ['Total de Jogos', data.stats.totalGames],
    ['Vitórias', data.stats.wins],
    ['Derrotas', data.stats.losses],
    ['Empates', data.stats.draws],
    ['Gols Feitos (média)', data.stats.avgGoalsScored],
    ['Gols Sofridos (média)', data.stats.avgGoalsConceded],
    ['Período Mais Produtivo', `${data.timePeriodData.maxScoredPeriod.percentage}% - ${data.timePeriodData.maxScoredPeriod.period}`],
    ['Período Mais Vulnerável', `${data.timePeriodData.maxConcededPeriod.percentage}% - ${data.timePeriodData.maxConcededPeriod.period}`],
    ['Desarmes Realizados', data.gaugeData?.totalTackles ?? data.stats.tacklesTotal],
    ['Passes Certos', data.stats.passesCorrect],
    ['Passes Errados', data.stats.passesWrong],
    ['Chutes no Gol', data.stats.shotsOn],
    ['Chutes pra Fora', data.stats.shotsOff],
    ['Chutes bloqueados', data.stats.shotsShootZone],
    ['Erros de Transição', data.stats.wrongPassesTransition],
    ['Cartões Amarelos', data.stats.yellowCards],
    ['Cartões Vermelhos', data.stats.redCards],
  ];
  const col1X = MARGIN;
  const col2X = MARGIN + 100;
  let col = 0;
  let rowY = startY;
  kpis.forEach(([label, value], i) => {
    const x = col === 0 ? col1X : col2X;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(`${label}:`, x, rowY);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.white);
    doc.text(String(value), x + 55, rowY);
    col++;
    if (col === 2) {
      col = 0;
      rowY += 6;
    }
  });
  return rowY + 6;
}

function drawGaugeSection(
  doc: jsPDF,
  startY: number,
  gaugeData: ScoutPdfData['gaugeData'],
  tacklesTotal: number
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text('META DE DESARMES', MARGIN, startY, { charSpace: -0.2 });
  startY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);

  const totalTackles = gaugeData?.totalTackles ?? tacklesTotal;

  if (gaugeData?.hasTackleTarget) {
    doc.text(`Desarmes realizados (partidas com meta): ${totalTackles}`, MARGIN, startY);
    startY += 6;
    doc.text(`Meta total (soma das metas por partida): ${Math.round(gaugeData.tackleTarget)}`, MARGIN, startY);
    startY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(`Percentual (em relação às metas das partidas realizadas e salvas): ${gaugeData.percentageDisplay}%`, MARGIN, startY);
    doc.setFont('helvetica', 'normal');
    startY += 8;
  } else {
    doc.text(`Desarmes realizados: ${totalTackles}`, MARGIN, startY);
    startY += 6;
    doc.text('Meta: cadastre metas nas partidas (tabela de campeonato) para acompanhar.', MARGIN, startY);
    startY += 8;
  }

  return startY;
}

function chartTitleStyle(doc: jsPDF, title: string): string {
  return title.toUpperCase();
}

/** Tabela Top 10 jogadores abaixo do gráfico (4 colunas ou 5 em finalizações). */
function drawPlayerTableBlock(
  doc: jsPDF,
  startY: number,
  headers: [string, string, string, string] | [string, string, string, string, string],
  rows: PlayerTop10RowPdf[]
): void {
  if (!rows.length) return;
  const five = headers.length === 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.cyan);
  doc.text('TOP 10 JOGADORES', MARGIN, startY);
  startY += 5;
  const colW = five ? ([48, 17, 17, 17, 17] as const) : ([72, 22, 22, 18] as const);
  let x = MARGIN;
  doc.setTextColor(...COLORS.white);
  headers.forEach((h, i) => {
    doc.text(h, x, startY, { maxWidth: colW[i] });
    x += colW[i];
  });
  startY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  rows.forEach((r) => {
    x = MARGIN;
    const nameMax = five ? 18 : 22;
    const name = r.name.length > nameMax ? `${r.name.slice(0, nameMax - 1)}…` : r.name;
    doc.setTextColor(...COLORS.white);
    doc.text(name, x, startY, { maxWidth: colW[0] });
    x += colW[0];
    doc.text(String(r.col1), x, startY);
    x += colW[1];
    doc.text(String(r.col2), x, startY);
    x += colW[2];
    if (five) {
      doc.text(String(r.col3 ?? 0), x, startY);
      x += colW[3];
    }
    doc.text(String(r.total), x, startY);
    startY += 3.6;
  });
}

function drawBarChartSection(
  doc: jsPDF,
  startY: number,
  title: string,
  chartData: ScoutPdfData['chartData'],
  series: Array<{ key: keyof ScoutPdfData['chartData'][0]; label: string; color: [number, number, number] }>,
  total: number,
  opts?: {
    chartHeight?: number;
    playerTable?: {
      headers: [string, string, string, string] | [string, string, string, string, string];
      rows: PlayerTop10RowPdf[];
    };
  }
): void {
  const titleUpper = chartTitleStyle(doc, title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(titleUpper, MARGIN, startY, { charSpace: -0.2 });
  const totalW = doc.getTextWidth(`Total: ${total}`);
  doc.text(`Total: ${total}`, PAGE_WIDTH - MARGIN - totalW, startY);
  startY += 8;

  if (chartData.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Nenhum dado disponível', PAGE_WIDTH / 2, startY + 25, { align: 'center' });
    return;
  }

  const chartHeight = opts?.chartHeight ?? (opts?.playerTable ? 28 : 45);
  const chartTop = startY + 5;
  const barAreaWidth = CONTENT_WIDTH - 50;
  const chartCenterX = MARGIN + 45 + barAreaWidth / 2;
  const maxVal = Math.max(
    ...chartData.map((d) => series.reduce((sum, s) => sum + (Number(d[s.key]) || 0), 0)),
    1
  );
  const blockWidth = barAreaWidth / chartData.length;

  chartData.forEach((d, i) => {
    const blockLeft = MARGIN + 45 + i * blockWidth + 2;
    let stackX = blockLeft;
    series.forEach((s) => {
      const val = Number(d[s.key]) || 0;
      const w = (val / maxVal) * (blockWidth - 4) || 0;
      if (w > 0.5) {
        doc.setFillColor(...s.color);
        const barH = chartHeight - 8;
        doc.rect(stackX, chartTop + chartHeight - 4 - barH, w, barH, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.white);
        if (val > 0) doc.text(String(val), stackX + w / 2 - 2, chartTop + chartHeight - 6, { align: 'center' });
        stackX += w + 2;
      }
    });
  });

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  chartData.forEach((d, i) => {
    const x = MARGIN + 45 + i * blockWidth + blockWidth / 2 - 5;
    const name = d.name.length > 8 ? d.name.slice(0, 7) + '…' : d.name;
    doc.text(name, x, chartTop + chartHeight + 6, { align: 'center' });
  });

  // Legenda centralizada
  const legendStep = series.length > 2 ? 46 : 40;
  const legendWidth = series.length * legendStep;
  let legX = chartCenterX - legendWidth / 2 + 10;
  series.forEach((s) => {
    doc.setFillColor(...s.color);
    doc.rect(legX, chartTop + chartHeight + 12, 4, 3, 'F');
    doc.setTextColor(...COLORS.white);
    doc.text(s.label, legX + 6, chartTop + chartHeight + 14);
    legX += legendStep;
  });

  if (opts?.playerTable?.rows?.length) {
    drawPlayerTableBlock(
      doc,
      chartTop + chartHeight + 20,
      opts.playerTable.headers,
      opts.playerTable.rows
    );
  }
}

function drawTimePeriodChart(
  doc: jsPDF,
  startY: number,
  title: string,
  data: Array<{ period: string; value: number }>,
  color: [number, number, number],
  legendText?: string,
  opts?: { chartHeight?: number }
): void {
  const titleUpper = chartTitleStyle(doc, title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(titleUpper, MARGIN, startY, { charSpace: -0.2 });
  const total = data.reduce((s, d) => s + d.value, 0);
  const totalW = doc.getTextWidth(`Total: ${total}`);
  doc.text(`Total: ${total}`, PAGE_WIDTH - MARGIN - totalW, startY);
  startY += 8;

  if (!data.length) return;

  const chartHeight = opts?.chartHeight ?? 40;
  const chartWidth = CONTENT_WIDTH - 50;
  const chartCenterX = MARGIN + 45 + chartWidth / 2;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(2, chartWidth / data.length - 1);

  data.forEach((d, i) => {
    const x = MARGIN + 45 + i * (chartWidth / data.length);
    const h = (d.value / maxVal) * (chartHeight - 6) || 0;
    if (h > 0) {
      doc.setFillColor(...color);
      doc.rect(x, startY + chartHeight - h, barW, h, 'F');
    }
    if (d.value > 0) {
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.white);
      doc.text(String(d.value), x + barW / 2 - 1, startY + chartHeight - h - 2, { align: 'center' });
    }
  });

  doc.setFontSize(6);
  doc.setTextColor(...COLORS.white);
  let axisLabelBottom = startY + chartHeight + 5;
  data.forEach((d, i) => {
    const x = MARGIN + 45 + i * (chartWidth / data.length) + barW / 2;
    const sep = ' - ';
    const idx = d.period.indexOf(sep);
    if (idx >= 0) {
      const a = d.period.slice(0, idx);
      const b = d.period.slice(idx + sep.length);
      doc.text(a, x, startY + chartHeight + 4, { align: 'center' });
      doc.text(b, x, startY + chartHeight + 8, { align: 'center' });
      axisLabelBottom = Math.max(axisLabelBottom, startY + chartHeight + 8);
    } else {
      doc.text(d.period, x, startY + chartHeight + 5, { align: 'center' });
    }
  });

  // Regra 7: Legenda igual ao scout coletivo
  if (legendText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.text(legendText, chartCenterX, axisLabelBottom + 10, { align: 'center' });
  }
}

function createDonutImage(
  data: Array<{ name: string; value: number; percentage: string }>,
  colors: [number, number, number][],
  size: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return canvas.toDataURL('image/png');

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.6;
  let startAngle = -Math.PI / 2;

  data.forEach((d, i) => {
    const slice = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + slice;
    const c = colors[i % colors.length];
    ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    startAngle = endAngle;
  });

  return canvas.toDataURL('image/png');
}

type DonutSlice = { name: string; value: number; percentage: string };

/** Um bloco de rosca + legenda; retorna a coordenada Y inferior aproximada do bloco */
function drawDonutBlock(
  doc: jsPDF,
  startY: number,
  title: string,
  data: DonutSlice[],
  colors: [number, number, number][],
  opts?: { donutSize?: number }
): number {
  const titleUpper = chartTitleStyle(doc, title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(titleUpper, MARGIN, startY, { charSpace: -0.2 });
  const total = data.reduce((s, d) => s + d.value, 0);
  const totalW = doc.getTextWidth(`Total: ${total}`);
  doc.text(`Total: ${total}`, PAGE_WIDTH - MARGIN - totalW, startY);
  const contentTop = startY + 8;

  if (data.length === 0 || total === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Nenhum dado disponível', MARGIN, contentTop + 8);
    return contentTop + 14;
  }

  const donutSize = opts?.donutSize ?? 40;
  const donutX = MARGIN + 2;
  const donutY = contentTop + 2;
  const donutImg = createDonutImage(data, colors, 300);
  doc.addImage(donutImg, 'PNG', donutX, donutY, donutSize, donutSize);

  const legX0 = donutX + donutSize + 6;
  const legW = PAGE_WIDTH - MARGIN - legX0 - 2;
  const cols = data.length > 14 ? 3 : 2;
  const colW = legW / cols;
  const legendRowH = 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const rowCount = Math.ceil(data.length / cols);
  data.forEach((r, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const legX = legX0 + col * colW;
    const legY = donutY + row * legendRowH;
    doc.setFillColor(...colors[i % colors.length]);
    doc.rect(legX, legY - 0.8, 2.5, 2.5, 'F');
    const nameLimit = cols >= 3 ? 16 : 26;
    const name = r.name.length > nameLimit ? `${r.name.slice(0, nameLimit - 1)}…` : r.name;
    doc.setTextColor(...COLORS.white);
    doc.text(`${name} (${r.percentage}%)`, legX + 3.5, legY + 1.5);
  });

  const legendBottom = donutY + rowCount * legendRowH;
  const blockBottom = Math.max(donutY + donutSize, legendBottom);
  return blockBottom + 2;
}

/** Página única: duas roscas — uma acima e uma abaixo da marca d'água central */
function drawDonutPairPage(
  doc: jsPDF,
  upper: { title: string; data: DonutSlice[]; colors: [number, number, number][]; opts?: { donutSize?: number } },
  lower: { title: string; data: DonutSlice[]; colors: [number, number, number][]; opts?: { donutSize?: number } }
): void {
  drawDonutBlock(doc, DONUT_PAIR_UPPER_Y, upper.title, upper.data, upper.colors, upper.opts);
  drawDonutBlock(doc, DONUT_PAIR_LOWER_Y, lower.title, lower.data, lower.colors, lower.opts);
}

function drawDonutChartPage(
  doc: jsPDF,
  startY: number,
  title: string,
  data: DonutSlice[],
  colors: [number, number, number][],
  opts?: { donutSize?: number }
): void {
  drawDonutBlock(doc, startY, title, data, colors, opts);
}
