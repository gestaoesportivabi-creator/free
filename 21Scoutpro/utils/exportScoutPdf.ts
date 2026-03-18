/**
 * Exporta o Scout Coletivo para PDF com geração programática (jsPDF).
 * Fundo branco, texto preto, header nas cores da marca, gráficos limpos.
 */

import { jsPDF } from 'jspdf';

const LOGO_URL = '/public-logo.png.png';
const BRAND_NAME = 'SCOUT21';
const WHATSAPP = '(48) 99148-6176';
const SITE = 'https://gestaoesportiva-free.vercel.app';

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
  gray: [100, 100, 100] as [number, number, number],
};

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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
  gaugeData?: { percentageDisplay: number; totalTackles: number; tackleTarget: number; hasTackleTarget: boolean };
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

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = 297;
  const bottomMargin = 20;
  if (y + needed > pageHeight - bottomMargin) {
    doc.addPage();
    return MARGIN;
  }
  return y;
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
      let y = MARGIN;

      // Header - barra cyan
      doc.setFillColor(...COLORS.cyan);
      doc.rect(0, 0, PAGE_WIDTH, 25, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);

      const logoBase64 = await loadLogoBase64();
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', MARGIN, 4, 17, 17);
        doc.text(BRAND_NAME, MARGIN + 22, 17);
      } else {
        doc.text(BRAND_NAME, MARGIN, 17);
      }

      y = 35;

      // Filtros
      const filters = data.filters;
      if (filters && (filters.compFilter || filters.monthFilter || filters.opponentFilter || filters.locationFilter)) {
        const parts: string[] = [];
        if (filters.compFilter && filters.compFilter !== 'Todas') parts.push(`Competição: ${filters.compFilter}`);
        if (filters.monthFilter && filters.monthFilter !== 'Todos') {
          const monthLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(filters.monthFilter, 10)];
          if (monthLabel) parts.push(`Mês: ${monthLabel}`);
        }
        if (filters.opponentFilter && filters.opponentFilter !== 'Todos') parts.push(`Adversário: ${filters.opponentFilter}`);
        if (filters.locationFilter && filters.locationFilter !== 'Todos') parts.push(`Local: ${filters.locationFilter}`);
        if (parts.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...COLORS.black);
          doc.text(`Filtros aplicados: ${parts.join(' • ')}`, MARGIN, y);
          y += 8;
        }
      }

      // KPIs
      y = checkPageBreak(doc, y, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.black);
      doc.text('Resumo de Indicadores', MARGIN, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
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
      let rowY = y;
      kpis.forEach(([label, value], i) => {
        const x = col === 0 ? col1X : col2X;
        doc.text(`${label}:`, x, rowY);
        doc.text(String(value), x + 55, rowY);
        col++;
        if (col === 2) {
          col = 0;
          rowY += 6;
        }
      });
      y = rowY + (col === 1 ? 6 : 0) + 10;

      // Meta de Desarmes - card dedicado
      y = checkPageBreak(doc, y, 45);
      y = drawGaugeSection(doc, y, data.gaugeData, data.stats.tacklesTotal);
      y += 15;

      // Gráfico de barras - Passes
      y = checkPageBreak(doc, y, 80);
      drawBarChartSection(doc, y, 'Passes Certos vs Errados', data.chartData, [
        { key: 'passesCorrect', label: 'Certos', color: COLORS.cyan },
        { key: 'passesWrong', label: 'Errados', color: COLORS.rose },
      ], data.stats.passesCorrect + data.stats.passesWrong);
      y += 55;

      // Gráfico de barras - Chutes
      y = checkPageBreak(doc, y, 80);
      drawBarChartSection(doc, y, 'Chutes no Gol vs Fora', data.chartData, [
        { key: 'shotsOn', label: 'No Gol', color: COLORS.blueMedium },
        { key: 'shotsOff', label: 'Pra Fora', color: COLORS.slate },
      ], data.stats.shotsOn + data.stats.shotsOff);
      y += 55;

      // Gráfico de barras - Desarmes
      y = checkPageBreak(doc, y, 80);
      drawBarChartSection(doc, y, 'Tipos de Desarme', data.chartData, [
        { key: 'tacklesWithBall', label: 'Com Posse', color: COLORS.blueLight },
        { key: 'tacklesWithoutBall', label: 'Sem Posse', color: COLORS.blueDark },
        { key: 'tacklesCounterAttack', label: 'Contra-Ataque', color: COLORS.cyan },
      ], data.stats.tacklesTotal);
      y += 55;

      // Gráfico de barras - Erros Transição
      y = checkPageBreak(doc, y, 80);
      drawBarChartSection(doc, y, 'Erros Críticos (Transição)', data.chartData, [
        { key: 'passesWrong', label: 'Passes errados', color: COLORS.slate },
        { key: 'transitionErrors', label: 'Geraram transição', color: COLORS.rose },
      ], data.stats.wrongPassesTransition);
      y += 55;

      // Gols por Período - linha simplificada (barras)
      y = checkPageBreak(doc, y, 70);
      drawTimePeriodChart(doc, y, 'Gols Feitos por Período', data.timePeriodData.scoredDist, COLORS.green);
      y += 50;

      y = checkPageBreak(doc, y, 70);
      drawTimePeriodChart(doc, y, 'Gols Tomados por Período', data.timePeriodData.concededDist, COLORS.rose);
      y += 50;

      // Métodos de Gol - tabelas
      y = checkPageBreak(doc, y, 60);
      drawGoalMethodsTable(doc, y, 'Métodos de Gol Marcado', data.goalMethodsScoredData, data.goalOriginScoredData);
      y += 40;

      y = checkPageBreak(doc, y, 60);
      drawGoalMethodsTable(doc, y, 'Métodos de Gol Tomado', data.goalMethodsConcededData, data.goalOriginConcededData);
      y += 40;

      // Footer em todas as páginas
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.gray);
        doc.text(`WhatsApp: ${WHATSAPP}  |  ${SITE.replace('https://', '')}`, PAGE_WIDTH / 2, 290, { align: 'center' });
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

function drawGaugeSection(
  doc: jsPDF,
  startY: number,
  gaugeData: ScoutPdfData['gaugeData'],
  tacklesTotal: number
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text('Meta de Desarmes', MARGIN, startY);
  startY += 6;

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

function drawBarChartSection(
  doc: jsPDF,
  startY: number,
  title: string,
  chartData: ScoutPdfData['chartData'],
  series: Array<{ key: keyof ScoutPdfData['chartData'][0]; label: string; color: [number, number, number] }>,
  total: number
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text(title, MARGIN, startY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total: ${total}`, MARGIN + CONTENT_WIDTH - 25, startY);
  startY += 6;

  if (chartData.length === 0) {
    doc.setFontSize(10);
    doc.text('Nenhum dado disponível', MARGIN, startY + 10);
    return;
  }

  const chartHeight = 35;
  const chartTop = startY + 5;
  const barAreaWidth = CONTENT_WIDTH - 50;
  const maxVal = Math.max(
    ...chartData.map((d) => series.reduce((sum, s) => sum + (Number(d[s.key]) || 0), 0)),
    1
  );
  const barWidth = Math.max(3, (barAreaWidth / chartData.length - 4) / series.length);
  const gap = 2;

  chartData.forEach((d, i) => {
    const blockWidth = barAreaWidth / chartData.length;
    const blockLeft = MARGIN + 45 + i * blockWidth + 2;
    let stackX = blockLeft;
    series.forEach((s, si) => {
      const val = Number(d[s.key]) || 0;
      const w = (val / maxVal) * (blockWidth - 4) || 0;
      if (w > 0.5) {
        doc.setFillColor(...s.color);
        const barH = chartHeight - 8;
        doc.rect(stackX, chartTop + chartHeight - 4 - barH, w, barH, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.black);
        if (val > 0) doc.text(String(val), stackX + w / 2 - 2, chartTop + chartHeight - 6, { align: 'center' });
        stackX += w + gap;
      }
    });
  });

  // Eixo X - nomes (abreviados)
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.black);
  chartData.forEach((d, i) => {
    const blockWidth = CONTENT_WIDTH / chartData.length;
    const x = MARGIN + 45 + i * blockWidth + blockWidth / 2 - 5;
    const name = d.name.length > 8 ? d.name.slice(0, 7) + '…' : d.name;
    doc.text(name, x, chartTop + chartHeight + 6);
  });

  // Legenda
  let legX = MARGIN + 45;
  series.forEach((s) => {
    doc.setFillColor(...s.color);
    doc.rect(legX, chartTop + chartHeight + 12, 4, 3, 'F');
    doc.text(s.label, legX + 6, chartTop + chartHeight + 14);
    legX += 35;
  });
}

function drawTimePeriodChart(
  doc: jsPDF,
  startY: number,
  title: string,
  data: Array<{ period: string; value: number }>,
  color: [number, number, number]
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text(title, MARGIN, startY);
  startY += 6;

  if (!data.length) return;

  const chartHeight = 35;
  const chartWidth = CONTENT_WIDTH - 50;
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
    if (i % 2 === 0) {
      const x = MARGIN + 45 + i * (chartWidth / data.length) + barW / 2 - 3;
      const label = d.period.split('-')[0] || d.period;
      doc.text(label, x, startY + chartHeight + 5);
    }
  });
}

function drawGoalMethodsTable(
  doc: jsPDF,
  startY: number,
  title: string,
  methodsData: Array<{ name: string; value: number; percentage: string }>,
  originData: Array<{ name: string; value: number; percentage: string }>
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text(title, MARGIN, startY);
  startY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (methodsData.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Método', MARGIN, startY);
    doc.text('Qtd', MARGIN + 100, startY);
    doc.text('%', MARGIN + 130, startY);
    doc.setFont('helvetica', 'normal');
    startY += 5;
    methodsData.forEach((r) => {
      doc.text(r.name.length > 35 ? r.name.slice(0, 34) + '…' : r.name, MARGIN, startY);
      doc.text(String(r.value), MARGIN + 100, startY);
      doc.text(`${r.percentage}%`, MARGIN + 130, startY);
      startY += 5;
    });
    startY += 3;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Origem', MARGIN, startY);
  doc.text('Qtd', MARGIN + 100, startY);
  doc.text('%', MARGIN + 130, startY);
  doc.setFont('helvetica', 'normal');
  startY += 5;
  originData.forEach((r) => {
    doc.text(r.name, MARGIN, startY);
    doc.text(String(r.value), MARGIN + 100, startY);
    doc.text(`${r.percentage}%`, MARGIN + 130, startY);
    startY += 5;
  });
}
