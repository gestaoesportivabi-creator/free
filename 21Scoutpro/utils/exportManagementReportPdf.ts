import { jsPDF } from 'jspdf';
import { wellnessClosenessRgb } from './wellnessRadarColors';

const LOGO_URL = '/public-logo.png.png';
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  bg: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  zinc500: [113, 113, 122] as [number, number, number],
  zinc700: [63, 63, 70] as [number, number, number],
  cyan: [0, 240, 255] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
};

export interface ManagementReportPdfData {
  teamName?: string;
  teamShieldUrl?: string;
  player: { name: string; number?: number; position?: string; photoUrl?: string };
  periodLabel: string;
  topCards: Array<{ title: string; value: string }>;
  gameStatsCards: Array<{ title: string; value: string; sub?: string }>;
  scoutCards: Array<{ title: string; value: string }>;
  rankings: Array<{ name: string; position: number }>;
  dualities: Array<{ pairLabel: string; total: number; given: number; received: number }>;
  wellnessIdeal: { subject: string; avg: number }[];
  wellnessReal: { subject: string; avg: number | null }[];
  wellnessCloseness: number | null;
  injuryTypes: { name: string; value: number }[];
  injurySide: { direito: number; esquerdo: number };
  heatmapImageDataUrl?: string | null;
}

function fillBg(doc: jsPDF) {
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
}

function drawFooter(doc: jsPDF) {
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.zinc500);
  doc.text('Gestão esportiva baseada em dados para decisões vencedoras.', MARGIN + 26, PAGE_HEIGHT - 5.5);
}

function drawPageHeader(doc: jsPDF, title: string) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.cyan);
  doc.text(title, MARGIN, 18);
}

function newPage(doc: jsPDF, title: string) {
  doc.addPage();
  fillBg(doc);
  drawFooter(doc);
  drawPageHeader(doc, title);
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
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: c.toDataURL('image/png'), width: c.width, height: c.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadCircleCroppedImage(url?: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!url) return null;
  const img = await loadImage(url);
  if (!img) return null;
  try {
    const size = Math.min(img.width, img.height);
    const sx = Math.floor((img.width - size) / 2);
    const sy = Math.floor((img.height - size) / 2);
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const source = new Image();
    source.src = img.dataUrl;
    await new Promise<void>((res) => {
      source.onload = () => res();
      source.onerror = () => res();
    });
    ctx.drawImage(source, sx, sy, size, size, 0, 0, 256, 256);
    ctx.restore();
    return { dataUrl: c.toDataURL('image/png'), width: 256, height: 256 };
  } catch {
    return null;
  }
}

function drawCardGrid(doc: jsPDF, cards: Array<{ title: string; value: string; sub?: string }>, cols: number, y: number) {
  const gap = 4;
  const w = (CONTENT_W - gap * (cols - 1)) / cols;
  const h = 34;
  cards.forEach((c, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = MARGIN + col * (w + gap);
    const yy = y + row * (h + 4);
    doc.setDrawColor(...COLORS.zinc700);
    doc.roundedRect(x, yy, w, h, 2, 2);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.zinc500);
    doc.text(c.title.toUpperCase(), x + 3, yy + 6);
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.white);
    doc.text(c.value, x + 3, yy + 18);
    if (c.sub) {
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.zinc500);
      doc.text(c.sub, x + 3, yy + 24);
    }
  });
}

function drawRankingTable(doc: jsPDF, rankings: Array<{ name: string; position: number }>) {
  let y = 36;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.zinc500);
  doc.text('INDICADOR', MARGIN, y);
  doc.text('POSIÇÃO', PAGE_WIDTH - MARGIN, y, { align: 'right' });
  y += 6;
  rankings.forEach((r) => {
    doc.setDrawColor(...COLORS.zinc700);
    doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.text(r.name, MARGIN, y);
    doc.text(`${r.position}º`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
    y += 8;
  });
}

function drawDualities(doc: jsPDF, dualities: Array<{ pairLabel: string; total: number; given: number; received: number }>) {
  let y = 36;
  dualities.slice(0, 3).forEach((d, i) => {
    const boxH = 44;
    doc.setDrawColor(...COLORS.zinc700);
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.text(`${i + 1}. ${d.pairLabel}`, MARGIN + 4, y + 8);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.zinc500);
    doc.text('Interações totais', MARGIN + 4, y + 16);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(14);
    doc.text(String(d.total), MARGIN + 4, y + 24);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.zinc500);
    doc.text('Gol parceiro (sua assist.)', MARGIN + 58, y + 16);
    doc.text('Seu gol (assist. parceiro)', MARGIN + 132, y + 16);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.text(String(d.given), MARGIN + 58, y + 24);
    doc.text(String(d.received), MARGIN + 132, y + 24);
    y += boxH + 6;
  });
}

function drawRadar(
  doc: jsPDF,
  data: { subject: string; avg: number | null }[],
  x: number,
  y: number,
  size: number,
  stroke: [number, number, number],
  valueColor: [number, number, number]
) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.36;
  const axisCount = Math.max(3, data.length);
  doc.setDrawColor(...COLORS.zinc700);
  doc.setLineWidth(0.2);
  [1, 2, 3, 4, 5].forEach(level => {
    const rr = (r * level) / 5;
    for (let i = 0; i < axisCount; i++) {
      const a1 = -Math.PI / 2 + (2 * Math.PI * i) / axisCount;
      const a2 = -Math.PI / 2 + (2 * Math.PI * ((i + 1) % axisCount)) / axisCount;
      doc.line(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr, cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr);
    }
  });
  doc.setFontSize(7);
  for (let i = 0; i < axisCount; i++) {
    const item = data[i];
    const a = -Math.PI / 2 + (2 * Math.PI * i) / axisCount;
    doc.line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    const lx = cx + Math.cos(a) * (r + 11);
    const ly = cy + Math.sin(a) * (r + 11);
    const label = item?.subject || `Indicador ${i + 1}`;
    doc.setTextColor(...COLORS.zinc500);
    doc.text(label.length > 20 ? `${label.slice(0, 19)}…` : label, lx, ly, { align: 'center' });
    doc.setTextColor(...valueColor);
    doc.text(item?.avg != null ? `Ø ${item.avg}` : '—', lx, ly + 3.8, { align: 'center' });
  }
  const points = data.map((d, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / axisCount;
    const rv = ((d.avg ?? 0) / 5) * r;
    return { x: cx + Math.cos(a) * rv, y: cy + Math.sin(a) * rv };
  });
  doc.setDrawColor(...stroke);
  doc.setFillColor(stroke[0], stroke[1], stroke[2]);
  doc.setLineWidth(0.8);
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }
  points.forEach(p => doc.circle(p.x, p.y, 1, 'F'));
}

function drawInjuryTypes(doc: jsPDF, data: { name: string; value: number }[], x: number, y: number, w: number) {
  const max = Math.max(1, ...data.map(d => d.value));
  let yy = y;
  doc.setFontSize(8);
  data.slice(0, 10).forEach(d => {
    doc.setTextColor(...COLORS.zinc500);
    doc.text(d.name, x, yy + 4);
    const bw = ((w - 36) * d.value) / max;
    doc.setFillColor(90, 90, 98);
    doc.roundedRect(x + 30, yy, bw, 4, 1, 1, 'F');
    doc.setTextColor(...COLORS.white);
    doc.text(String(d.value), x + 30 + bw + 2, yy + 3.6);
    yy += 7;
  });
}

export async function exportManagementReportPdf(data: ManagementReportPdfData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const [logo, shield, playerPhoto] = await Promise.all([
    loadImage(LOGO_URL),
    data.teamShieldUrl ? loadImage(data.teamShieldUrl) : Promise.resolve(null),
    loadCircleCroppedImage(data.player.photoUrl),
  ]);

  // PAGE 1: Capa + cards superiores
  fillBg(doc);
  drawFooter(doc);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(28);
  doc.text('RELATÓRIO GERENCIAL', PAGE_WIDTH / 2, 26, { align: 'center' });
  if (data.teamName) {
    doc.setFontSize(16);
    const nameX = shield ? PAGE_WIDTH / 2 - 8 : PAGE_WIDTH / 2;
    doc.text(String(data.teamName).toUpperCase(), nameX, 38, { align: shield ? 'right' : 'center' });
    if (shield) {
      const sh = 14;
      const sw = sh * (shield.width / Math.max(shield.height, 1));
      try { doc.addImage(shield.dataUrl, 'PNG', nameX + 4, 30.5, sw, sh); } catch {}
    }
  }
  doc.setDrawColor(...COLORS.zinc700);
  doc.roundedRect(MARGIN, 46, CONTENT_W, 36, 3, 3);
  if (playerPhoto) {
    try { doc.addImage(playerPhoto.dataUrl, 'PNG', MARGIN + 6, 50, 28, 28); } catch {}
    doc.setDrawColor(...COLORS.cyan);
    doc.circle(MARGIN + 20, 64, 14.8);
  }
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.text(data.player.name.toUpperCase(), MARGIN + 40, 59);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.zinc500);
  const sub = `#${data.player.number ?? '-'} • ${data.player.position || '-'} • ${data.periodLabel}`;
  doc.text(sub, MARGIN + 40, 66);
  drawCardGrid(doc, data.topCards, 5, 88);

  // PAGE 2: Estatísticas de Jogos
  newPage(doc, 'ESTATÍSTICAS DE JOGOS');
  drawCardGrid(doc, data.gameStatsCards, 4, 32);

  // PAGE 3: Estatísticas Scout Coletivo
  newPage(doc, 'ESTATÍSTICAS DO SCOUT COLETIVO');
  drawCardGrid(doc, data.scoutCards, 4, 32);

  // PAGE 4: Rankings
  newPage(doc, 'POSIÇÃO NOS RANKINGS');
  drawRankingTable(doc, data.rankings);

  // PAGE 5: Dualidades
  newPage(doc, 'DUALIDADES (TOP 3)');
  drawDualities(doc, data.dualities);

  // PAGE 6: Fisiológica radares
  newPage(doc, 'FISIOLÓGICA — RADARES');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.emerald);
  doc.text('Modelo ideal', MARGIN + 56, 30, { align: 'center' });
  doc.setTextColor(...COLORS.zinc500);
  doc.text('Realidade', MARGIN + 178, 30, { align: 'center' });
  drawRadar(doc, data.wellnessIdeal.map(d => ({ subject: d.subject, avg: d.avg })), MARGIN + 6, 34, 112, COLORS.emerald, COLORS.emerald);
  const realColor = data.wellnessCloseness != null ? wellnessClosenessRgb(data.wellnessCloseness) : COLORS.zinc500;
  drawRadar(doc, data.wellnessReal, MARGIN + 130, 34, 112, realColor, realColor);

  // PAGE 7: Mapa de calor + tipos
  newPage(doc, 'MAPA DE CALOR DE LESÕES E TIPOS');
  if (data.heatmapImageDataUrl) {
    try { doc.addImage(data.heatmapImageDataUrl, 'PNG', MARGIN, 34, 165, 150, undefined, 'FAST'); } catch {}
  } else {
    doc.setTextColor(...COLORS.zinc500);
    doc.setFontSize(10);
    doc.text('Não foi possível capturar o mapa de calor.', MARGIN + 80, 90, { align: 'center' });
  }
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.text('Tipos de lesão', MARGIN + 172, 38);
  drawInjuryTypes(doc, data.injuryTypes, MARGIN + 172, 42, 108);
  doc.setDrawColor(...COLORS.zinc700);
  doc.roundedRect(MARGIN + 172, 132, 108, 22, 2, 2);
  doc.setTextColor(...COLORS.zinc500);
  doc.setFontSize(8);
  doc.text('Lesões por lado', MARGIN + 175, 138);
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.text(`Direito: ${data.injurySide.direito}`, MARGIN + 175, 146);
  doc.text(`Esquerdo: ${data.injurySide.esquerdo}`, MARGIN + 226, 146);

  doc.save(`relatorio-gerencial-${data.player.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

