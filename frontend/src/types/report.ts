// frontend/src/types/report.ts

import type { EventData } from './editor';

export interface ReportDraft {
  id: string;
  title: string;
  templateId: string;
  templateVersion: string;
  currentStep: number;
  data: EventData;
  lastSaved: string;
  status: 'Draft' | 'Completed';
}

export interface ExportOptions {
  format?: 'pdf' | 'docx' | 'print';
  fileName?: string;
  includeImages?: boolean;
  orientation?: 'portrait' | 'landscape';
}
