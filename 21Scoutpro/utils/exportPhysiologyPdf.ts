/**
 * Exporta o Departamento de Fisiologia para PDF (jsPDF).
 * Padrão visual alinhado com exportScoutPdf.ts: fundo preto, marca d'água, cyan #00f0ff.
 */

import { jsPDF } from 'jspdf';
import { wellnessClosenessRgb } from './wellnessRadarColors';

const LOGO_DARK_URL = '/public-logo-dark.png';
const LOGO_LIGHT_URL = '/public-logo-light.png';
const LOGO_FALLBACK_URL = '/public-logo.png.png';
const BRAND = 'SCOUT21';
const TAGLINE = 'Gestão esportiva baseada em dados para decisões vencedoras.';

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_WIDTH - MARGIN * 2;

const DARK_COLORS = {
  bg: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  cyan: [0, 240, 255] as [number, number, number],
  zinc500: [113, 113, 122] as [number, number, number],
  zinc700: [63, 63, 70] as [number, number, number],
  lime: [204, 255, 0] as [number, number, number],
  red: [255, 0, 85] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  sky: [56, 189, 248] as [number, number, number],
};

const LIGHT_COLORS = {
  bg: [255, 255, 255] as [number, number, number],
  white: [17, 24, 39] as [number, number, number],
  cyan: [8, 145, 178] as [number, number, number],
  zinc500: [82, 82, 91] as [number, number, number],
  zinc700: [161, 161, 170] as [number, number, number],
  lime: [101, 163, 13] as [number, number, number],
  red: [190, 24, 93] as [number, number, number],
  orange: [194, 65, 12] as [number, number, number],
  emerald: [5, 150, 105] as [number, number, number],
  sky: [2, 132, 199] as [number, number, number],
};

let COLORS = DARK_COLORS;

function isLightModeActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'light';
}

async function recolorMonochromeLogo(
  logo: { dataUrl: string; width: number; height: number },
  rgb: [number, number, number]
): Promise<{ dataUrl: string; width: number; height: number }> {
  try {
    const img = new Image();
    img.src = logo.dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
    const c = document.createElement('canvas');
    c.width = logo.width;
    c.height = logo.height;
    const ctx = c.getContext('2d');
    if (!ctx) return logo;
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const px = id.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] === 0) continue;
      px[i] = rgb[0];
      px[i + 1] = rgb[1];
      px[i + 2] = rgb[2];
    }
    ctx.putImageData(id, 0, 0);
    return { dataUrl: c.toDataURL('image/png'), width: logo.width, height: logo.height };
  } catch {
    return logo;
  }
}

function fillBg(doc: jsPDF) {
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
}

function loadImage(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: c.toDataURL('image/png'), width: c.width, height: c.height });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadPdfLogoByTheme(
  lightMode: boolean
): Promise<{ logo: { dataUrl: string; width: number; height: number } | null; isFallback: boolean }> {
  const preferredUrl = lightMode ? LOGO_LIGHT_URL : LOGO_DARK_URL;
  const preferred = await loadImage(preferredUrl);
  if (preferred) {
    return { logo: preferred, isFallback: false };
  }
  const fallback = await loadImage(LOGO_FALLBACK_URL);
  return { logo: fallback, isFallback: true };
}

function drawWatermark(doc: jsPDF, logo: { dataUrl: string; width: number; height: number } | null) {
  if (!logo) {
    doc.setFontSize(34);
    doc.setTextColor(35, 35, 42);
    doc.text(BRAND, PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center', angle: -20 });
    return;
  }
  const aspect = logo.width / Math.max(logo.height, 1);
  const wmW = 115;
  const wmH = wmW / aspect;
  const x = PAGE_WIDTH / 2 - wmW / 2;
  const y = PAGE_HEIGHT / 2 - wmH / 2;
  try {
    const anyDoc = doc as any;
    if (typeof anyDoc.GState === 'function' && typeof anyDoc.setGState === 'function') {
      anyDoc.setGState(new anyDoc.GState({ opacity: 0.08 }));
      doc.addImage(logo.dataUrl, 'PNG', x, y, wmW, wmH, undefined, 'NONE', 0);
      anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
    } else {
      doc.addImage(logo.dataUrl, 'PNG', x, y, wmW, wmH, undefined, 'NONE', 0);
    }
  } catch {}
}

function drawLogoBottomLeft(doc: jsPDF, logo: { dataUrl: string; width: number; height: number } | null) {
  if (!logo) return;
  const aspect = logo.width / Math.max(logo.height, 1);
  const h = 12;
  const w = h * aspect;
  const x = 0;
  const y = PAGE_HEIGHT - h;
  try { doc.addImage(logo.dataUrl, 'PNG', x, y, w, h, undefined, 'NONE', 0); } catch {}
}

function drawFooter(doc: jsPDF) {
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.zinc500);
  doc.text(TAGLINE, MARGIN + 26, PAGE_HEIGHT - 5.5);
}

function newPage(doc: jsPDF, logo: { dataUrl: string; width: number; height: number } | null) {
  doc.addPage();
  fillBg(doc);
  drawWatermark(doc, logo);
  drawLogoBottomLeft(doc, logo);
  drawFooter(doc);
}

export interface PhysiologyPdfData {
  teamName?: string;
  teamShieldUrl?: string;
  filters: { dateFrom: string; dateTo: string; playerLabel: string };
  kpis: {
    avgWellness: string | number;
    injuriesByOrigin: { treino: number; jogo: number; outros: number };
    totalInjuries: number;
    matchesWithAbsence: number;
  };
  pseMatchData: { date: string; rpe: number }[];
  pseTrainingData: { date: string; rpe: number }[];
  psrMatchData: { date: string; rpe: number }[];
  psrTrainingData: { date: string; rpe: number }[];
  /** Metas fixas (verde no PDF). */
  wellnessIdealRadarData: { subject: string; avg: number }[];
  wellnessRadarData: { subject: string; avg: number | null }[];
  /** 0–1 proximidade ao ideal; define cor do radar real no PDF. */
  wellnessRadarCloseness: number | null;
  injuryTypeData: { name: string; value: number }[];
  injurySideData: { direito: number; esquerdo: number };
  heatmapImageDataUrl?: string | null;
}

function drawLineChart(doc: jsPDF, data: { date: string; rpe: number }[], color: [number, number, number], title: string, x: number, y: number, w: number, h: number) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(title, x, y);
  
  const chartY = y + 4;
  const chartH = h - 8;
  const chartW = w;

  doc.setDrawColor(...COLORS.zinc700);
  doc.setLineWidth(0.2);
  doc.line(x, chartY + chartH, x + chartW, chartY + chartH);

  if (data.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.zinc500);
    doc.text('Sem dados', x + chartW / 2, chartY + chartH / 2, { align: 'center' });
    return;
  }

  const maxVal = Math.max(10, ...data.map(d => d.rpe));
  const step = chartW / Math.max(data.length - 1, 1);
  const avg = data.length > 0 ? Math.round((data.reduce((acc, d) => acc + d.rpe, 0) / data.length) * 10) / 10 : null;

  if (avg != null) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.cyan);
    doc.text(`Média: ${avg}`, x + chartW, y + 0.5, { align: 'right' });
  }

  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  for (let i = 1; i < data.length; i++) {
    const x1 = x + (i - 1) * step;
    const y1 = chartY + chartH - (data[i - 1].rpe / maxVal) * chartH;
    const x2 = x + i * step;
    const y2 = chartY + chartH - (data[i].rpe / maxVal) * chartH;
    doc.line(x1, y1, x2, y2);
  }

  doc.setFillColor(...color);
  data.forEach((d, i) => {
    const cx = x + i * step;
    const cy = chartY + chartH - (d.rpe / maxVal) * chartH;
    doc.circle(cx, cy, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.text(String(Math.round(d.rpe * 10) / 10), cx, cy - 2, { align: 'center' });
  });

  doc.setFontSize(6);
  doc.setTextColor(...COLORS.zinc500);
  const labelStep = Math.ceil(data.length / 8);
  data.forEach((d, i) => {
    if (i % labelStep === 0 || i === data.length - 1) {
      doc.text(d.date, x + i * step, chartY + chartH + 4, { align: 'center' });
    }
  });
}

function drawHorizontalBar(doc: jsPDF, data: { name: string; value: number }[], x: number, y: number, w: number) {
  const maxVal = Math.max(1, ...data.map(d => d.value));
  const barH = 6;
  const gap = 3;
  doc.setFontSize(8);
  
  data.forEach((d, i) => {
    const by = y + i * (barH + gap);
    doc.setTextColor(...COLORS.zinc500);
    doc.text(d.name, x, by + barH - 1);
    const barX = x + 28;
    const barW = (d.value / maxVal) * (w - 34);
    doc.setFillColor(...COLORS.red);
    doc.roundedRect(barX, by, barW, barH, 1, 1, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.text(String(d.value), barX + barW + 3, by + barH - 1);
    doc.setFontSize(8);
  });
}

function drawPageHeader(
  doc: jsPDF,
  _logo: { dataUrl: string; width: number; height: number } | null,
  title: string
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.cyan);
  doc.text(title, MARGIN, 18);
}

function mixRgbWithWhite(rgb: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(rgb[0] * t + 255 * (1 - t)),
    Math.round(rgb[1] * t + 255 * (1 - t)),
    Math.round(rgb[2] * t + 255 * (1 - t)),
  ];
}

function drawRadarChart(
  doc: jsPDF,
  data: { subject: string; avg: number | null }[],
  x: number,
  y: number,
  size: number,
  opts?: {
    strokeRgb: [number, number, number];
    valueLabelRgb?: [number, number, number];
    emptyMessage?: string;
  }
) {
  const strokeRgb = opts?.strokeRgb ?? COLORS.cyan;
  const valueRgb = opts?.valueLabelRgb ?? strokeRgb;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.38;
  const valid = data.filter(d => d.avg != null);
  const axisCount = Math.max(data.length, 3);
  if (valid.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.zinc500);
    doc.text(opts?.emptyMessage ?? 'Sem dados de bem-estar no período', cx, cy, { align: 'center' });
    return;
  }

  // grades concêntricas
  doc.setDrawColor(...COLORS.zinc700);
  doc.setLineWidth(0.2);
  [1, 2, 3, 4, 5].forEach(level => {
    const lr = (r * level) / 5;
    for (let i = 0; i < axisCount; i++) {
      const a1 = (-Math.PI / 2) + (2 * Math.PI * i) / axisCount;
      const a2 = (-Math.PI / 2) + (2 * Math.PI * ((i + 1) % axisCount)) / axisCount;
      doc.line(cx + Math.cos(a1) * lr, cy + Math.sin(a1) * lr, cx + Math.cos(a2) * lr, cy + Math.sin(a2) * lr);
    }
  });

  // eixos + rótulos
  doc.setFontSize(8);
  for (let i = 0; i < axisCount; i++) {
    const item = data[i];
    const a = (-Math.PI / 2) + (2 * Math.PI * i) / axisCount;
    doc.line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    const lx = cx + Math.cos(a) * (r + 12);
    const ly = cy + Math.sin(a) * (r + 12);
    const label = item?.subject || `Indicador ${i + 1}`;
    const avgLabel = item?.avg != null ? `Ø ${item.avg}` : '—';
    doc.setTextColor(...COLORS.zinc500);
    doc.text(label.length > 22 ? `${label.slice(0, 21)}…` : label, lx, ly, { align: 'center' });
    doc.setTextColor(...valueRgb);
    doc.text(avgLabel, lx, ly + 4, { align: 'center' });
  }

  const fillRgb = mixRgbWithWhite(strokeRgb, 0.35);
  doc.setDrawColor(...strokeRgb);
  doc.setLineWidth(0.9);
  doc.setFillColor(...fillRgb);
  const points = data.map((item, i) => {
    const a = (-Math.PI / 2) + (2 * Math.PI * i) / axisCount;
    const rv = ((item.avg ?? 0) / 5) * r;
    return { x: cx + Math.cos(a) * rv, y: cy + Math.sin(a) * rv };
  });
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }
  doc.setFillColor(...strokeRgb);
  points.forEach(p => doc.circle(p.x, p.y, 1.1, 'F'));
}

export async function exportPhysiologyPdf(data: PhysiologyPdfData): Promise<void> {
  const lightMode = isLightModeActive();
  COLORS = lightMode ? LIGHT_COLORS : DARK_COLORS;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;font-family:Calibri,sans-serif;font-size:18px;color:#00f0ff;font-weight:bold;';
  overlay.textContent = 'Gerando PDF...';
  document.body.appendChild(overlay);

  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const [{ logo: logoByTheme, isFallback }, shield] = await Promise.all([
      loadPdfLogoByTheme(lightMode),
      data.teamShieldUrl ? loadImage(data.teamShieldUrl) : Promise.resolve(null),
    ]);
    const logo = logoByTheme
      ? (isFallback
          ? await recolorMonochromeLogo(logoByTheme, lightMode ? [0, 0, 0] : [255, 255, 255])
          : logoByTheme)
      : null;

    // --- PAGE 1: CAPA ---
    fillBg(doc);
    drawWatermark(doc, logo);
    drawLogoBottomLeft(doc, logo);
    drawFooter(doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(...COLORS.white);
    doc.text('MONITORAMENTO FISIOLOGICO', PAGE_WIDTH / 2, 40, { align: 'center' });

    if (data.teamName) {
      doc.setFontSize(18);
      doc.setTextColor(...COLORS.white);
      doc.text(data.teamName.toUpperCase(), PAGE_WIDTH / 2, 70, { align: 'center' });
    }
    if (shield) {
      const aspect = shield.width / Math.max(shield.height, 1);
      const sh = 20;
      const sw = sh * aspect;
      try { doc.addImage(shield.dataUrl, 'PNG', PAGE_WIDTH / 2 - sw / 2, 76, sw, sh); } catch {}
    }

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.zinc500);
    const filterText = `Periodo: ${data.filters.dateFrom} - ${data.filters.dateTo} | Filtro: ${data.filters.playerLabel}`;
    doc.text(filterText, PAGE_WIDTH / 2, 145, { align: 'center' });
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_WIDTH / 2, 150, { align: 'center' });

    // --- PAGE 2: CARDS ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'MONITORAMENTO FISIOLOGICO');

    const kpiY = 64;
    const kpiW = CONTENT_W / 4 - 4;
    const kpiBoxH = 32;
    const kpis = [
      { title: 'MEDIA DE BEM-ESTAR', value: String(data.kpis.avgWellness), color: COLORS.lime, sub: 'Escala 1-5' },
      { title: 'LESÕES TREINO / JOGO / OUTROS', value: `${data.kpis.injuriesByOrigin.treino} / ${data.kpis.injuriesByOrigin.jogo} / ${data.kpis.injuriesByOrigin.outros}`, color: COLORS.cyan, sub: 'Por origem' },
      { title: 'LESÕES (PERÍODO)', value: String(data.kpis.totalInjuries), color: COLORS.red, sub: 'No intervalo' },
      { title: 'JOGOS COM DESFALQUE', value: String(data.kpis.matchesWithAbsence), color: COLORS.orange, sub: 'Finalizados, elenco incompleto' },
    ];

    kpis.forEach((kpi, i) => {
      const bx = MARGIN + i * (kpiW + 5);
      doc.setDrawColor(...kpi.color);
      doc.setLineWidth(0.8);
      doc.line(bx, kpiY, bx, kpiY + kpiBoxH);
      
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.zinc500);
      doc.text(kpi.title, bx + 4, kpiY + 6);
      
      doc.setFontSize(22);
      doc.setTextColor(...COLORS.white);
      doc.text(kpi.value, bx + 4, kpiY + 18);
      
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.zinc500);
      doc.text(kpi.sub, bx + 4, kpiY + 24);
    });

    // --- PAGE 3: EVOLUÇÃO PSE (JOGOS) ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'EVOLUÇÃO PSE (JOGOS)');
    drawLineChart(doc, data.pseMatchData, COLORS.lime, 'EVOLUÇÃO PSE (JOGOS)', MARGIN, 34, CONTENT_W, 90);

    // --- PAGE 4: MÉDIA PSE (TREINOS) ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'MÉDIA PSE (TREINOS)');
    drawLineChart(doc, data.pseTrainingData, COLORS.emerald, 'MÉDIA PSE (TREINOS)', MARGIN, 34, CONTENT_W, 90);

    // --- PAGE 5: EVOLUÇÃO PSR (JOGOS) ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'EVOLUÇÃO PSR (JOGOS)');
    drawLineChart(doc, data.psrMatchData, COLORS.sky, 'EVOLUÇÃO PSR (JOGOS)', MARGIN, 34, CONTENT_W, 90);

    // --- PAGE 6: MÉDIA PSR (TREINOS) ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'MÉDIA PSR (TREINOS)');
    drawLineChart(doc, data.psrTrainingData, [14, 165, 233], 'MÉDIA PSR (TREINOS)', MARGIN, 34, CONTENT_W, 90);

    // --- PAGE 7: RADAR BEM-ESTAR (ideal + real) ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'RADAR — MÉDIAS DO PERÍODO');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.emerald);
    doc.text('Modelo ideal', MARGIN + 50, 30, { align: 'center' });
    doc.setTextColor(...COLORS.zinc500);
    doc.text('Realidade (periodo)', MARGIN + 155, 30, { align: 'center' });
    const idealRadar = data.wellnessIdealRadarData || [];
    const realRadar = data.wellnessRadarData || [];
    const closeness = data.wellnessRadarCloseness;
    const realRgb: [number, number, number] =
      closeness != null && !Number.isNaN(closeness) ? wellnessClosenessRgb(closeness) : COLORS.zinc500;
    drawRadarChart(doc, idealRadar.map(d => ({ subject: d.subject, avg: d.avg })), MARGIN + 2, 36, 118, {
      strokeRgb: COLORS.emerald,
      valueLabelRgb: COLORS.emerald,
    });
    drawRadarChart(doc, realRadar, MARGIN + 118, 36, 118, {
      strokeRgb: realRgb,
      valueLabelRgb: realRgb,
      emptyMessage: 'Sem dados no periodo',
    });

    // --- PAGE 8: DISTRIBUIÇÃO POR TIPO ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'DISTRIBUIÇÃO POR TIPO');
    if (data.injuryTypeData.length > 0) {
      drawHorizontalBar(doc, data.injuryTypeData, MARGIN, 34, CONTENT_W);
    } else {
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.zinc500);
      doc.text('Sem dados de lesões no período', PAGE_WIDTH / 2, 90, { align: 'center' });
    }

    // --- PAGE 9: MAPA DE CALOR ---
    newPage(doc, logo);
    drawPageHeader(doc, logo, 'MAPA DE CALOR (HEATMAP)');
    if (data.heatmapImageDataUrl) {
      const imgX = MARGIN + 40;
      const imgY = 34;
      const imgW = CONTENT_W - 80;
      const imgH = 150;
      try { doc.addImage(data.heatmapImageDataUrl, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST'); } catch {}
    } else {
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.zinc500);
      doc.text('Não foi possível capturar o heatmap para exportação.', PAGE_WIDTH / 2, 90, { align: 'center' });
    }

    doc.save(`fisiologia_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    overlay.remove();
  }
}
