/**
 * Exporta o conteúdo do Scout Coletivo para PDF com header, marca d'água e footer.
 * Usa os filtros aplicados na página para gerar o relatório.
 */

import html2pdf from 'html2pdf.js';

const LOGO_URL = '/public-logo.png.png';
const BRAND_NAME = 'SCOUT21';
const WHATSAPP = '(48) 99148-6176';
const SITE = 'https://gestaoesportiva-free.vercel.app';

/** Aguarda o logo carregar antes de capturar (evita PDF sem logo) */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Continua mesmo se falhar
    img.src = src;
    if (img.complete) resolve();
  });
}

export interface ExportScoutPdfFilters {
  compFilter?: string;
  monthFilter?: string;
  opponentFilter?: string;
  locationFilter?: string;
}

export function exportScoutToPdf(
  contentRef: { current: HTMLElement | null },
  filters?: ExportScoutPdfFilters
): Promise<void> {
  return new Promise((resolve, reject) => {
    const contentEl = contentRef?.current;
    if (!contentEl) {
      reject(new Error('Conteúdo não disponível para exportação'));
      return;
    }

    // Overlay para bloquear a tela durante a geração (evita flash)
    const overlay = document.createElement('div');
    overlay.id = 'pdf-export-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 1000000;
      background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
      font-family: Calibri, sans-serif; font-size: 18px; color: #00f0ff; font-weight: bold;
    `;
    overlay.textContent = 'Gerando PDF...';

    const wrapper = document.createElement('div');
    wrapper.id = 'pdf-export-wrapper';
    Object.assign(wrapper.style, {
      position: 'relative',
      width: '800px',
      margin: '0 auto',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'Calibri, Segoe UI, sans-serif',
      padding: '0',
      zIndex: '999999',
    });

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid #27272a;
      background: #09090b;
    `;
    const logo = document.createElement('img');
    logo.src = LOGO_URL;
    logo.alt = BRAND_NAME;
    logo.style.cssText = 'height: 40px; width: auto;';
    const brandText = document.createElement('span');
    brandText.textContent = BRAND_NAME;
    brandText.style.cssText = 'font-size: 24px; font-weight: 800; color: #00f0ff; letter-spacing: 0.05em;';
    header.appendChild(logo);
    header.appendChild(brandText);
    wrapper.appendChild(header);

    // Content container with watermark
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      position: relative;
      padding: 24px;
      min-height: 200px;
    `;

    // Watermark
    const watermark = document.createElement('div');
    watermark.textContent = BRAND_NAME;
    watermark.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: 900;
      color: #00f0ff;
      opacity: 0.08;
      pointer-events: none;
      white-space: nowrap;
      user-select: none;
    `;
    contentContainer.appendChild(watermark);

    // Resumo dos filtros (se fornecido)
    if (filters && (filters.compFilter || filters.monthFilter || filters.opponentFilter || filters.locationFilter)) {
      const summary = document.createElement('div');
      summary.style.cssText = `
        margin-bottom: 16px;
        padding: 12px 16px;
        background: #18181b;
        border-radius: 8px;
        font-size: 11px;
        color: #a1a1aa;
      `;
      const parts: string[] = [];
      if (filters.compFilter && filters.compFilter !== 'Todas') parts.push(`Competição: ${filters.compFilter}`);
      if (filters.monthFilter && filters.monthFilter !== 'Todos') {
        const monthLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(filters.monthFilter, 10)];
        if (monthLabel) parts.push(`Mês: ${monthLabel}`);
      }
      if (filters.opponentFilter && filters.opponentFilter !== 'Todos') parts.push(`Adversário: ${filters.opponentFilter}`);
      if (filters.locationFilter && filters.locationFilter !== 'Todos') parts.push(`Local: ${filters.locationFilter}`);
      summary.textContent = parts.length > 0 ? `Filtros aplicados: ${parts.join(' • ')}` : '';
      if (parts.length > 0) contentContainer.appendChild(summary);
    }

    // Cloned content
    const contentClone = contentEl.cloneNode(true) as HTMLElement;
    contentClone.style.position = 'relative';
    contentClone.style.zIndex = '1';
    contentContainer.appendChild(contentClone);

    wrapper.appendChild(contentContainer);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 12px 24px;
      border-top: 1px solid #27272a;
      background: #09090b;
      font-size: 11px;
      color: #a1a1aa;
      text-align: center;
    `;
    footer.textContent = `WhatsApp: ${WHATSAPP}  |  ${SITE.replace('https://', '')}`;
    wrapper.appendChild(footer);

    document.body.appendChild(overlay);
    document.body.insertBefore(wrapper, document.body.firstChild);

    const filename = `scout-coletivo-${new Date().toISOString().slice(0, 10)}.pdf`;

    const options = {
      margin: 10,
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const },
    };

    const cleanup = () => {
      wrapper.remove();
      overlay.remove();
    };

    // Aguarda logo carregar e um frame para layout estável (elemento em viewport)
    preloadImage(LOGO_URL)
      .then(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 300))))
      .then(() =>
        html2pdf()
          .set(options)
          .from(wrapper)
          .save()
      )
      .then(() => {
        cleanup();
        resolve();
      })
      .catch((err: unknown) => {
        cleanup();
        reject(err);
      });
  });
}
