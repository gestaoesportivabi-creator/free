/**
 * Exporta o Scout Coletivo para PDF com geração programática (jsPDF).
 * Regras: header preto, marca d'água, um gráfico por página, donuts, ícones.
 */

import { jsPDF } from 'jspdf';

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
  slate: [113, 113, 122] as [number, number, number],
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
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const WATERMARK_CENTER_Y = PAGE_HEIGHT / 2;
const FOOTER_Y = WATERMARK_CENTER_Y + 18;
const TOP_CHART_Y = 25;
const GAP_FROM_WATERMARK = 62;
const BOTTOM_CHART_Y = WATERMARK_CENTER_Y + GAP_FROM_WATERMARK;
const COMPACT_CHART_HEIGHT = 32;
const COMPACT_DONUT_SIZE = 32;
const HEADER_PHRASE_SIZE = 16;
const HEADER_HEIGHT = 18;

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
}

function loadLogoBase64(): Promise<string | null> {
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

function drawWatermark(doc: jsPDF): void {
  doc.saveGraphicsState();
  try {
    const GState = (doc as any).GState;
    if (GState) doc.setGState(new GState({ opacity: 0.15 }));
  } catch {
    /* fallback: sem transparência nativa */
  }
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(72);
  doc.setTextColor(180, 180, 180);
  doc.text(BRAND_NAME, PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center' });
  doc.restoreGraphicsState();
}

function drawFooter(doc: jsPDF, whatsAppIconPng: string | null): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  const iconSize = 4;
  const text = `WhatsApp: ${WHATSAPP}  |  ${SITE.replace('https://', '')}`;
  if (whatsAppIconPng) {
    try {
      const tw = doc.getTextWidth(text);
      const totalW = iconSize + 2 + tw;
      const startX = (PAGE_WIDTH - totalW) / 2;
      doc.addImage(whatsAppIconPng, 'PNG', startX, FOOTER_Y - iconSize / 2, iconSize, iconSize);
      doc.text(text, startX + iconSize + 2, FOOTER_Y);
    } catch {
      doc.text(text, PAGE_WIDTH / 2, FOOTER_Y, { align: 'center' });
    }
  } else {
    doc.text(text, PAGE_WIDTH / 2, FOOTER_Y, { align: 'center' });
  }
}

function drawHeader(doc: jsPDF, logoBase64: string | null): void {
  doc.setFillColor(...COLORS.black);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
  const logoW = 14;
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 0, 2, logoW, 14);
  }
  // Frase: Calibri tamanho 16 (Helvetica como fallback). Apenas SCOUT21 em negrito itálico.
  doc.setFontSize(HEADER_PHRASE_SIZE);
  doc.setFont('helvetica', 'normal');
  const fullPhrase = HEADER_PHRASE_PART1 + HEADER_PHRASE_PART2;
  const phraseWrapWidth = PAGE_WIDTH - logoW - 20;
  const phraseLines = doc.splitTextToSize(fullPhrase, phraseWrapWidth);
  const lineH = HEADER_PHRASE_SIZE * 0.42;
  const totalH = phraseLines.length * lineH;
  const phraseStartY = (HEADER_HEIGHT - totalH) / 2 + lineH * 0.85;
  const phraseCenterX = (logoW + PAGE_WIDTH) / 2;
  phraseLines.forEach((line, i) => {
    const y = phraseStartY + i * lineH;
    if (line.startsWith('SCOUT21')) {
      const rest = line.replace(/^SCOUT21\s*/, '');
      doc.setFont('helvetica', 'bolditalic');
      const w1 = doc.getTextWidth('SCOUT21');
      doc.setFont('helvetica', 'normal');
      const w2 = rest ? doc.getTextWidth(rest) : 0;
      const lineW = w1 + w2;
      const startX = phraseCenterX - lineW / 2;
      doc.setFont('helvetica', 'bolditalic');
      doc.setTextColor(...COLORS.cyan);
      doc.text('SCOUT21', startX, y);
      if (rest) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.white);
        doc.text(rest, startX + w1, y);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.white);
      doc.text(line, phraseCenterX, y, { align: 'center' });
    }
  });
}

function newPageWithWatermark(doc: jsPDF): void {
  doc.addPage();
  drawWatermark(doc);
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
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const logoBase64 = await loadLogoBase64();

      // Folha 1: cabeçalho + marca d'água + RESUMO DE INDICADORES (superior) + META DE DESARMES (inferior)
      drawHeader(doc, logoBase64);
      drawWatermark(doc);
      drawResumoSection(doc, TOP_CHART_Y, data);
      drawGaugeSection(doc, BOTTOM_CHART_Y, data.gaugeData, data.stats.tacklesTotal);

      const compactOpts = { chartHeight: COMPACT_CHART_HEIGHT };
      const topDonutOpts = { donutSize: COMPACT_DONUT_SIZE };
      const bottomDonutOpts = { donutSize: 42 };

      // Folha 2: Passes certos vs errados (superior) + Chutes no Gol vs pra fora (inferior)
      newPageWithWatermark(doc);
      drawBarChartSection(doc, TOP_CHART_Y, 'Passes Certos vs Errados', data.chartData, [
        { key: 'passesCorrect', label: 'Certos', color: COLORS.cyan },
        { key: 'passesWrong', label: 'Errados', color: COLORS.rose },
      ], data.stats.passesCorrect + data.stats.passesWrong, compactOpts);
      drawBarChartSection(doc, BOTTOM_CHART_Y, 'Chutes no Gol vs Chutes pra Fora', data.chartData, [
        { key: 'shotsOn', label: 'No Gol', color: COLORS.blueMedium },
        { key: 'shotsOff', label: 'Pra Fora', color: COLORS.slate },
      ], data.stats.shotsOn + data.stats.shotsOff, compactOpts);

      // Folha 3: Tipos de Desarmes (superior) + Erros Críticos Transição (inferior)
      newPageWithWatermark(doc);
      drawBarChartSection(doc, TOP_CHART_Y, 'Tipos de Desarmes', data.chartData, [
        { key: 'tacklesWithBall', label: 'Com Posse', color: COLORS.blueLight },
        { key: 'tacklesWithoutBall', label: 'Sem Posse', color: COLORS.blueDark },
        { key: 'tacklesCounterAttack', label: 'Contra-Ataque', color: COLORS.cyan },
      ], data.stats.tacklesTotal, compactOpts);
      drawBarChartSection(doc, BOTTOM_CHART_Y, 'Erros Críticos (Transição)', data.chartData, [
        { key: 'passesWrong', label: 'Passes errados', color: COLORS.slate },
        { key: 'transitionErrors', label: 'Geraram transição', color: COLORS.rose },
      ], data.stats.wrongPassesTransition, compactOpts);

      // Folha 4: Gols Feitos por período (superior) + Gols Tomados por Período (inferior)
      newPageWithWatermark(doc);
      drawTimePeriodChart(doc, TOP_CHART_Y, 'Gols Feitos por Período', data.timePeriodData.scoredDist, COLORS.green,
        `${data.timePeriodData.maxScoredPeriod.percentage}% dos gols feitos saíram no período de ${data.timePeriodData.maxScoredPeriod.period}`,
        compactOpts);
      drawTimePeriodChart(doc, BOTTOM_CHART_Y, 'Gols Tomados por Período', data.timePeriodData.concededDist, COLORS.rose,
        `${data.timePeriodData.maxConcededPeriod.percentage}% dos gols tomados saíram no período de ${data.timePeriodData.maxConcededPeriod.period}`,
        compactOpts);

      // Folha 5: Métodos de Gols Marcado - Métodos Detalhados (superior) + Origem do Gol (inferior)
      newPageWithWatermark(doc);
      drawDonutChartPage(doc, TOP_CHART_Y, 'Métodos de Gols Marcado - Métodos Detalhados', data.goalMethodsScoredData, PIE_COLORS_SCORED, topDonutOpts);
      drawDonutChartPage(doc, BOTTOM_CHART_Y, 'Métodos de Gols Marcado - Origem do Gol', data.goalOriginScoredData, [PIE_ORIGIN_BLUE, PIE_ORIGIN_SLATE], bottomDonutOpts);

      // Folha 6: Métodos de Gols Tomado - Métodos Detalhados (superior) + Origem do Gol (inferior)
      newPageWithWatermark(doc);
      drawDonutChartPage(doc, TOP_CHART_Y, 'Métodos de Gols Tomado - Métodos Detalhados', data.goalMethodsConcededData, PIE_COLORS_CONCEDED, topDonutOpts);
      drawDonutChartPage(doc, BOTTOM_CHART_Y, 'Métodos de Gols Tomado - Origem do Gol', data.goalOriginConcededData, [[30, 64, 175] as [number, number, number], PIE_ORIGIN_SLATE], bottomDonutOpts);

      // Regra 9: Footer com ícone WhatsApp em todas as páginas
      const whatsAppIconPng = await loadWhatsAppIconPng();
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        drawFooter(doc, whatsAppIconPng);
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

function drawResumoSection(doc: jsPDF, startY: number, data: ScoutPdfData): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
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
    doc.text(`${label}:`, x, rowY);
    doc.setFont('helvetica', 'italic');
    doc.text(String(value), x + 55, rowY);
    col++;
    if (col === 2) {
      col = 0;
      rowY += 6;
    }
  });
}

function drawGaugeSection(
  doc: jsPDF,
  startY: number,
  gaugeData: ScoutPdfData['gaugeData'],
  tacklesTotal: number
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
  doc.text('META DE DESARMES', MARGIN, startY, { charSpace: -0.2 });
  startY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);

  const totalTackles = gaugeData?.totalTackles ?? tacklesTotal;

  if (gaugeData?.hasTackleTarget) {
    doc.text(`Desarmes realizados (partidas com meta): ${totalTackles}`, MARGIN, startY);
    startY += 6;
    doc.text(`Meta total (soma das metas por partida): ${Math.round(gaugeData.tackleTarget)}`, MARGIN, startY);
    startY += 6;
    doc.setFont('helvetica', 'bold');
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

function drawBarChartSection(
  doc: jsPDF,
  startY: number,
  title: string,
  chartData: ScoutPdfData['chartData'],
  series: Array<{ key: keyof ScoutPdfData['chartData'][0]; label: string; color: [number, number, number] }>,
  total: number,
  opts?: { chartHeight?: number }
): void {
  const titleUpper = chartTitleStyle(doc, title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
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

  const chartHeight = opts?.chartHeight ?? 45;
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
        doc.setTextColor(...COLORS.black);
        if (val > 0) doc.text(String(val), stackX + w / 2 - 2, chartTop + chartHeight - 6, { align: 'center' });
        stackX += w + 2;
      }
    });
  });

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.black);
  chartData.forEach((d, i) => {
    const x = MARGIN + 45 + i * blockWidth + blockWidth / 2 - 5;
    const name = d.name.length > 8 ? d.name.slice(0, 7) + '…' : d.name;
    doc.text(name, x, chartTop + chartHeight + 6, { align: 'center' });
  });

  // Legenda centralizada
  const legendWidth = series.length * 40;
  let legX = chartCenterX - legendWidth / 2 + 10;
  series.forEach((s) => {
    doc.setFillColor(...s.color);
    doc.rect(legX, chartTop + chartHeight + 12, 4, 3, 'F');
    doc.text(s.label, legX + 6, chartTop + chartHeight + 14);
    legX += 40;
  });
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
  doc.setTextColor(...COLORS.black);
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
      doc.setTextColor(...COLORS.black);
      doc.text(String(d.value), x + barW / 2 - 1, startY + chartHeight - h - 2, { align: 'center' });
    }
  });

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.black);
  data.forEach((d, i) => {
    const x = MARGIN + 45 + i * (chartWidth / data.length) + barW / 2 - 3;
    const label = d.period.split('-')[0] || d.period;
    doc.text(label, x, startY + chartHeight + 5, { align: 'center' });
  });

  // Regra 7: Legenda igual ao scout coletivo
  if (legendText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(legendText, chartCenterX, startY + chartHeight + 18, { align: 'center' });
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

function drawDonutChartPage(
  doc: jsPDF,
  startY: number,
  title: string,
  data: Array<{ name: string; value: number; percentage: string }>,
  colors: [number, number, number][],
  opts?: { donutSize?: number }
): void {
  const titleUpper = chartTitleStyle(doc, title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
  doc.text(titleUpper, MARGIN, startY, { charSpace: -0.2 });
  const total = data.reduce((s, d) => s + d.value, 0);
  const totalW = doc.getTextWidth(`Total: ${total}`);
  doc.text(`Total: ${total}`, PAGE_WIDTH - MARGIN - totalW, startY);
  startY += 8;

  if (data.length === 0 || total === 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('Nenhum dado disponível', PAGE_WIDTH / 2, startY + 40, { align: 'center' });
    return;
  }

  const donutSize = opts?.donutSize ?? 70;
  const centerX = PAGE_WIDTH / 2;
  const donutImg = createDonutImage(data, colors, 300);
  doc.addImage(donutImg, 'PNG', centerX - donutSize / 2, startY, donutSize, donutSize);
  const legendRowH = donutSize <= 40 ? 5 : 8;
  startY += donutSize + (donutSize <= 40 ? 6 : 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(donutSize <= 40 ? 8 : 9);
  const itemsPerRow = Math.min(data.length, 3);
  const colW = CONTENT_WIDTH / itemsPerRow;
  data.forEach((r, i) => {
    const col = i % itemsPerRow;
    const row = Math.floor(i / itemsPerRow);
    const legX = MARGIN + col * colW + 5;
    const legY = startY + row * legendRowH;
    doc.setFillColor(...colors[i % colors.length]);
    doc.rect(legX, legY - 1, 3, 3, 'F');
    const name = r.name.length > 22 ? r.name.slice(0, 21) + '…' : r.name;
    doc.text(`${name} (${r.percentage}%)`, legX + 5, legY + 2);
  });
}
