// frontend/src/services/export/exportService.ts
import type { ExportOptions } from '../../types/report';

export const exportService = {
  /**
   * Export document to PDF using high-resolution print stream
   */
  async exportToPdf(options?: ExportOptions): Promise<boolean> {
    try {
      const fileName = options?.fileName || 'Event_Report.pdf';
      const reportElement = document.querySelector('.a4-multi-page-document') || document.querySelector('#live-report-preview');

      if (!reportElement) {
        window.print();
        return true;
      }

      // Clone DOM element to strip non-printable badges
      const clone = reportElement.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.no-print, .page-number-badge, button, input').forEach(el => el.remove());

      // Reset preview scale transforms on cloned pages for 1:1 rendering
      clone.querySelectorAll<HTMLElement>('.a4-page').forEach(pageEl => {
        pageEl.style.transform = 'none';
        pageEl.style.margin = '0 auto';
        pageEl.style.boxShadow = 'none';
      });

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'], avoid: '.no-break' }
      };

      await html2pdf().set(opt).from(clone).save();
      return true;
    } catch (err) {
      console.warn('Direct PDF generation notice, triggering print stream:', err);
      window.print();
      return true;
    }
  },

  /**
   * Export exact live report layout to Word (.doc/.docx) document
   */
  async exportToWord(reportTitle: string): Promise<boolean> {
    try {
      const reportElement = document.querySelector('.a4-multi-page-document') || document.querySelector('.continuous-document') || document.querySelector('#live-report-preview');
      
      if (!reportElement) {
        console.warn('Report element not found in DOM, falling back to basic download.');
        return false;
      }

      // Clone node to avoid mutating live editor DOM
      const clone = reportElement.cloneNode(true) as HTMLElement;

      // Remove non-printable elements, badges, or controls
      clone.querySelectorAll('.no-print, .page-number-badge, button, input').forEach(el => el.remove());

      // Reset inline zoom transforms and fixed scale dimensions on cloned elements
      clone.querySelectorAll<HTMLElement>('.a4-page-wrapper').forEach(wrapper => {
        wrapper.style.transform = 'none';
        wrapper.style.width = '100%';
        wrapper.style.height = 'auto';
        wrapper.style.margin = '0 0 20pt 0';
        wrapper.style.pageBreakAfter = 'always';
        (wrapper.style as any).breakAfter = 'page';
      });

      clone.querySelectorAll<HTMLElement>('.a4-page').forEach(pageEl => {
        pageEl.style.transform = 'none';
        pageEl.style.boxShadow = 'none';
        pageEl.style.width = '100%';
        pageEl.style.height = 'auto';
        pageEl.style.minHeight = 'auto';
        pageEl.style.maxHeight = 'none';
        pageEl.style.margin = '0 auto';
      });

      // Extract all page stylesheets for style preservation
      let cssText = `
        @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; background: #ffffff; color: #000000; margin: 0; padding: 0; }
        .a4-page { width: 100%; page-break-after: always; break-after: page; background: #ffffff; position: relative; box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
        td, th { border: 1px solid #000000; padding: 6px 8px; font-size: 10pt; }
        img { max-width: 100%; height: auto; }
      `;

      try {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            if (sheet.cssRules) {
              for (let j = 0; j < sheet.cssRules.length; j++) {
                cssText += '\n' + sheet.cssRules[j].cssText;
              }
            }
          } catch (e) {
            // Ignore CORS stylesheet rules
          }
        }
      } catch (err) {
        console.warn('Stylesheet extraction notice:', err);
      }

      const cleanTitle = (reportTitle || 'Event_Report').replace(/[^a-zA-Z0-9\s_-]/g, '').trim();

      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${cleanTitle}</title>
          <!--[if gte mso 9]>
          <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForCustomXSL/>
          </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            ${cssText}
          </style>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle.toLowerCase().replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Word export failed:', err);
      return false;
    }
  },

  /**
   * Print current report layout
   */
  printDocument(): void {
    window.print();
  }
};
