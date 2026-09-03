// frontend/src/services/export/exportService.ts
import type { ExportOptions } from '../../types/report';

export const exportService = {
  /**
   * Export document to PDF with exact 1:1 A4 page fidelity using jsPDF and html2canvas
   */
  async exportToPdf(options?: ExportOptions): Promise<boolean> {
    try {
      const fileName = options?.fileName || 'Event_Report.pdf';
      const rootDoc = document.querySelector('.a4-multi-page-document');
      
      // Select all visible A4 pages in document order (ignoring offscreen measurer)
      const pageWrappers = rootDoc 
        ? Array.from(rootDoc.querySelectorAll<HTMLElement>('.a4-page-wrapper'))
        : [];
      
      const pageElements = pageWrappers.length > 0
        ? pageWrappers.map(w => w.querySelector<HTMLElement>('.a4-page')).filter((p): p is HTMLElement => Boolean(p))
        : Array.from(document.querySelectorAll<HTMLElement>('.a4-page:not(.offscreen-measurer *)'));

      if (pageElements.length === 0) {
        window.print();
        return true;
      }

      const { jsPDF } = await import('jspdf');
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const firstPage = pageElements[0];
      const isLandscape = firstPage.classList.contains('landscape') || options?.orientation === 'landscape';
      const pageWidthMm = isLandscape ? 297 : 210;
      const pageHeightMm = isLandscape ? 210 : 297;

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        // Ensure all images within this page are loaded before capture
        const imgs = Array.from(pageEl.querySelectorAll('img'));
        await Promise.all(imgs.map(img => {
          if (img.complete) return Promise.resolve(true);
          return new Promise(resolve => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          });
        }));

        const canvas = await html2canvas(pageEl, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc, clonedElement) => {
            // In the cloned render iframe, reset all transforms for natural 1:1 sizing
            if (clonedElement) {
              clonedElement.style.transform = 'none';
              clonedElement.style.margin = '0';
              clonedElement.style.boxShadow = 'none';
            }

            clonedDoc.querySelectorAll<HTMLElement>('.a4-page-wrapper').forEach(wrapper => {
              wrapper.style.transform = 'none';
              wrapper.style.margin = '0';
              wrapper.style.padding = '0';
            });

            clonedDoc.querySelectorAll<HTMLElement>('.a4-page').forEach(p => {
              p.style.transform = 'none';
              p.style.margin = '0';
              p.style.boxShadow = 'none';
            });

            // Hide UI controls, buttons, and page badges from export
            clonedDoc.querySelectorAll('.no-print, .page-number-badge, button, input').forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        if (i > 0) {
          pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
      }

      pdf.save(fileName);
      return true;
    } catch (err) {
      console.error('Direct PDF export error, falling back to print dialog:', err);
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
