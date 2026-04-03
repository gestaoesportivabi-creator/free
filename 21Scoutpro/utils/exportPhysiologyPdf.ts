/**
 * Exporta o Departamento de Fisiologia para PDF (jsPDF).
 * Padrão visual alinhado com exportScoutPdf.ts: fundo preto, marca d'água, cyan #00f0ff.
 */

import { jsPDF } from 'jspdf';

const LOGO_URL = '/public-logo.png.png';
const BRAND = 'SCOUT21';
const TAGLINE = 'Gestão esportiva baseada em dados para decisões vencedoras.';

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
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

function drawWatermark(doc: jsPDF, logo: { dataUrl: string; width: number; height: number } | null) {
  if (!logo) return;
  const aspect = logo.width / Math.max(logo.height, 1);
  const wm = 30;
  const wmH = wm / aspect;
  try { doc.addImage(logo.dataUrl, 'PNG', PAGE_WIDTH - MARGIN - wm, PAGE_HEIGHT - MARGIN - wmH, wm, wmH, undefined, 'NONE', 0); } catch {}
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.zinc700);
  doc.text(BRAND, PAGE_WIDTH - MARGIN - wm - 2, PAGE_HEIGHT - MARGIN, { align: 'right' });
}

function drawFooter(doc: jsPDF) {
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.zinc500);
  doc.text(TAGLINE, MARGIN, PAGE_HEIGHT - 6);
}

function newPage(doc: jsPDF, logo: { dataUrl: string; width: number; height: number } | null) {
  doc.addPage();
  fillBg(doc);
  drawWatermark(doc, logo);
  drawFooter(doc);
}

export interface PhysiologyPdfData {
  teamName?: string;
  teamShieldUrl?: string;
  filters: { competition: string; month: string; injuryType: string };
  kpis: {
    avgPseMatch: string | number;
    injuriesByOrigin: { treino: number; jogo: number; outros: number };
    totalInjuries: number;
    matchesWithAbsence: number;
  };
  pseMatchData: { date: string; rpe: number }[];
  pseTrainingData: { date: string; rpe: number }[];
  psrMatchData: { date: string; rpe: number }[];
  psrTrainingData: { date: string; rpe: number }[];
  sleepChartData: { name: string; media: number; type: string }[];
  injuryTypeData: { name: string; value: number }[];
  injurySideData: { direito: number; esquerdo: number };
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

export async function exportPhysiologyPdf(data: PhysiologyPdfData): Promise<void> {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;font-family:Calibri,sans-serif;font-size:18px;color:#00f0ff;font-weight:bold;';
  overlay.textContent = 'Gerando PDF...';
  document.body.appendChild(overlay);

  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const [logo, shield] = await Promise.all([
      loadImage(LOGO_URL),
      data.teamShieldUrl ? loadImage(data.teamShieldUrl) : Promise.resolve(null),
    ]);

    // --- COVER ---
    fillBg(doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...COLORS.white);
    doc.text('DEPARTAMENTO DE FISIOLOGIA', PAGE_WIDTH / 2, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.cyan);
    doc.text('Relatório de Carga & Mapa de Lesões', PAGE_WIDTH / 2, 52, { align: 'center' });

    if (data.teamName) {
      doc.setFontSize(18);
      doc.setTextColor(...COLORS.white);
      doc.text(data.teamName.toUpperCase(), PAGE_WIDTH / 2, 70, { align: 'center' });
    }
    if (shield) {
      const aspect = shield.width / Math.max(shield.height, 1);
      const sh = 22;
      const sw = sh * aspect;
      try { doc.addImage(shield.dataUrl, 'PNG', PAGE_WIDTH / 2 - sw / 2, 76, sw, sh); } catch {}
    }

    if (logo) {
      const aspect = logo.width / Math.max(logo.height, 1);
      const lh = 18;
      const lw = lh * aspect;
      try { doc.addImage(logo.dataUrl, 'PNG', PAGE_WIDTH / 2 - lw / 2, 115, lw, lh); } catch {}
    }

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.zinc500);
    const filterText = `Filtros: ${data.filters.competition} · ${data.filters.month} · ${data.filters.injuryType}`;
    doc.text(filterText, PAGE_WIDTH / 2, 145, { align: 'center' });
    doc.text(new Date().toLocaleDateString('pt-BR'), PAGE_WIDTH / 2, 150, { align: 'center' });
    drawFooter(doc);
    drawWatermark(doc, logo);

    // --- PAGE 2: KPIs ---
    newPage(doc, logo);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.cyan);
    doc.text('INDICADORES PRINCIPAIS', MARGIN, 18);

    const kpiY = 28;
    const kpiW = CONTENT_W / 4 - 4;
    const kpiBoxH = 32;
    const kpis = [
      { title: 'MÉDIA PSE (JOGOS)', value: String(data.kpis.avgPseMatch), color: COLORS.lime, sub: 'Escala 0-10' },
      { title: 'LESÕES TREINO / JOGO / OUTROS', value: `${data.kpis.injuriesByOrigin.treino} / ${data.kpis.injuriesByOrigin.jogo} / ${data.kpis.injuriesByOrigin.outros}`, color: COLORS.cyan, sub: 'Por origem' },
      { title: 'LESÕES (FILTRO)', value: String(data.kpis.totalInjuries), color: COLORS.red, sub: data.filters.injuryType === 'Todos' ? 'Total Temporada' : `Tipo: ${data.filters.injuryType}` },
      { title: 'JOGOS COM DESFALQUE', value: String(data.kpis.matchesWithAbsence), color: COLORS.orange, sub: 'Time desfalcado' },
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

    // PSE charts on same page
    const chartY = kpiY + kpiBoxH + 14;
    const halfW = CONTENT_W / 2 - 4;
    drawLineChart(doc, data.pseMatchData, COLORS.lime, 'EVOLUÇÃO PSE (JOGOS)', MARGIN, chartY, halfW, 60);
    drawLineChart(doc, data.pseTrainingData, COLORS.emerald, 'MÉDIA PSE (TREINOS)', MARGIN + halfW + 8, chartY, halfW, 60);

    // --- PAGE 3: PSR + Sleep ---
    newPage(doc, logo);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.cyan);
    doc.text('RECUPERAÇÃO & SONO', MARGIN, 18);

    drawLineChart(doc, data.psrMatchData, COLORS.sky, 'EVOLUÇÃO PSR (JOGOS)', MARGIN, 28, halfW, 60);
    drawLineChart(doc, data.psrTrainingData, [14, 165, 233], 'MÉDIA PSR (TREINOS)', MARGIN + halfW + 8, 28, halfW, 60);

    if (data.sleepChartData.length > 0) {
      const sleepY = 100;
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.white);
      doc.text('QUALIDADE DE SONO DA EQUIPE', MARGIN, sleepY);

      const barW = CONTENT_W / Math.max(data.sleepChartData.length, 1);
      const maxSleep = 5;
      const barAreaH = 50;

      data.sleepChartData.forEach((d, i) => {
        const bx = MARGIN + i * barW + 2;
        const bw = barW - 4;
        const bh = (d.media / maxSleep) * barAreaH;
        const by = sleepY + 6 + barAreaH - bh;
        doc.setFillColor(...(d.type === 'treino' ? COLORS.emerald : [234, 179, 8] as [number, number, number]));
        doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.white);
        doc.text(String(d.media), bx + bw / 2, by - 1, { align: 'center' });
      });
    }

    // --- PAGE 4: Injuries ---
    newPage(doc, logo);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.cyan);
    doc.text('DISTRIBUIÇÃO DE LESÕES', MARGIN, 18);

    if (data.injuryTypeData.length > 0) {
      drawHorizontalBar(doc, data.injuryTypeData, MARGIN, 30, halfW);
    }

    const sideX = MARGIN + halfW + 10;
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.text('LATERALIDADE', sideX, 30);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.zinc500);
    doc.text('Lado Direito', sideX, 42);
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.white);
    doc.text(String(data.injurySideData.direito), sideX, 52);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.zinc500);
    doc.text('Lado Esquerdo', sideX, 68);
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.white);
    doc.text(String(data.injurySideData.esquerdo), sideX, 78);

    doc.save(`fisiologia_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    overlay.remove();
  }
}
