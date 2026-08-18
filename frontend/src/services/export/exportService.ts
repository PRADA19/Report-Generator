// frontend/src/services/export/exportService.ts
import type { ExportOptions } from '../../types/report';

export const exportService = {
  /**
   * Export document to PDF using browser print engine or canvas PDF generator
   */
  async exportToPdf(options?: ExportOptions): Promise<boolean> {
    try {
      const fileName = options?.fileName || 'Event_Report.pdf';
      const originalTitle = document.title;
      document.title = fileName.replace('.pdf', '');

      // Trigger standard high-resolution print stream (styled with @media print CSS in index.css)
      window.print();

      document.title = originalTitle;
      return true;
    } catch (err) {
      console.error('PDF export failed:', err);
      return false;
    }
  },

  /**
   * Export document to Word (.docx) format (service stub for backend/docx integration)
   */
  async exportToWord(reportTitle: string, data: any): Promise<boolean> {
    console.log('Initiating Word (.docx) export for:', reportTitle, data);
    alert(`Exporting "${reportTitle}" to Word document format...`);
    return true;
  },

  /**
   * Print current report layout
   */
  printDocument(): void {
    window.print();
  }
};
