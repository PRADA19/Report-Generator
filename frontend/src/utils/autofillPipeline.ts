// frontend/src/utils/autofillPipeline.ts
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { useEditorStore } from '../features/editor/store/editorStore';
import type { EventData } from '../types/editor';
import { normalizeOcrText } from './ocrNormalizer';
import { parsePosterText, type ParsedPosterData } from './posterParser';
import { generateEventReport } from './reportGenerator';
import { preprocessForOCR } from './canvasPreprocessor';
import { calculateFieldConfidence } from './confidenceEngine';

// Ensure pdf.js worker is configured
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export interface AutofillPipelineOptions {
  sessionId?: string;
  onProgress?: (step: number, message: string) => void;
  isCancelled?: () => boolean;
}

export interface ExtractedPosterFields {
  title: string;
  batch: string;
  date: string;
  time: string;
  eventType: string;
  dressCode: string;
  specialNote: string;
  venue: string;
  department: string;
  speaker: string;
  coordinator: string;
  facultyInCharge: string;
  theme: string;
  description: string;
  eventStartDate?: string;
  eventEndDate?: string;
  registrationDeadline?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  registrationStartTime?: string;
  collaborators?: string[];
  resourcePersons?: Array<{ name: string; qualification?: string; designation: string; organization: string }>;
}

export interface AutofillPipelineResult {
  success: boolean;
  sessionId: string;
  extractedData: ExtractedPosterFields;
  generatedReport: any;
  confidenceMapping: Record<string, number>;
  ocrMethod: string;
  rawResponse?: any;
}

/**
 * Standardized Date Formatter for HTML Date Inputs
 */
export function formatToInputDate(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  
  try {
    // Try parsing standard formats first
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}

  // Parse "12 August 2026", "12-08-2026", "12/08/2026"
  const textDateMatch = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (textDateMatch) {
    const day = parseInt(textDateMatch[1]).toString().padStart(2, '0');
    const monthStr = textDateMatch[2].toLowerCase();
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    let monthIdx = months.findIndex(m => m.startsWith(monthStr));
    if (monthIdx === -1) {
      monthIdx = monthShorts.findIndex(m => m === monthStr.substring(0, 3));
    }
    
    if (monthIdx !== -1) {
      const month = (monthIdx + 1).toString().padStart(2, '0');
      const year = textDateMatch[3];
      return `${year}-${month}-${day}`;
    }
  }

  const numericMatch = dateStr.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1]).toString().padStart(2, '0');
    const month = parseInt(numericMatch[2]).toString().padStart(2, '0');
    let year = numericMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  return '';
}

/**
 * Renders page 1 of a PDF file to a high-resolution PNG Blob via canvas
 */
export async function renderPdfPageToBlob(pdfFile: File): Promise<Blob> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  
  // Render at 2.5x resolution scale for crisp text and logo extraction
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get 2D canvas context for PDF rendering.');
  }
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  
  await page.render({ canvasContext: context, viewport }).promise;
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas conversion to blob failed.'));
    }, 'image/png');
  });
}

let activeAbortController: AbortController | null = null;

/**
 * Executes the complete Auto Fill Pipeline:
 * Poster File -> Fact Extraction -> Narrative Generation -> Format Standardizing -> Zustand Store Update
 */
export async function executePosterAutofill(
  file: File,
  options: AutofillPipelineOptions = {}
): Promise<AutofillPipelineResult> {
  const store = useEditorStore.getState();
  
  // Abort any prior HTTP request in-flight
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  // 1. Fresh session start: start new session in Zustand store if not provided
  const sessionId = options.sessionId || store.startAutofillSession();
  const onProgress = options.onProgress || (() => {});
  const isCancelled = () => {
    if (options.isCancelled && options.isCancelled()) return true;
    return !useEditorStore.getState().isAutofillSessionActive(sessionId);
  };

  if (isCancelled()) {
    throw new Error('STALE_SESSION');
  }

  // 2. Validate File Type (Supports PNG, JPG, JPEG, WebP, and PDF)
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, JPEG, WebP, and PDF files are supported.');
  }

  onProgress(1, 'Uploading and preparing poster...');

  let processedBlob: Blob = file;
  if (file.type === 'application/pdf') {
    onProgress(2, 'Rendering PDF to image...');
    processedBlob = await renderPdfPageToBlob(file);
  }

  if (isCancelled()) {
    throw new Error('STALE_SESSION');
  }

  onProgress(3, 'Extracting event details...');

  let extractedData: ExtractedPosterFields = {
    title: '',
    batch: '',
    date: '',
    time: '',
    eventType: '',
    dressCode: '',
    specialNote: '',
    venue: '',
    department: '',
    speaker: '',
    coordinator: '',
    facultyInCharge: '',
    theme: '',
    description: '',
  };

  let confMapping: Record<string, number> = {};
  let apiGeneratedContent: any = null;
  let ocrMethod = '';
  let isFallback = false;

  // 3. Send poster to backend API
  try {
    const formData = new FormData();
    formData.append('file', processedBlob, file.name.replace(/\.pdf$/i, '.png'));
    formData.append('sessionId', sessionId);

    const response = await fetch(`${API_URL}/api/autofill/extract`, {
      method: 'POST',
      body: formData,
      signal
    });

    if (isCancelled()) {
      throw new Error('STALE_SESSION');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (errData.status === 'QUOTA_EXCEEDED' || errData.status === 'OFFLINE') {
        throw new Error(errData.status);
      }
      throw new Error(errData.error || 'API server unavailable.');
    }

    const resData = await response.json();
    console.log('[AUTO FILL 07] Frontend received data:', resData);
    if (isCancelled()) {
      throw new Error('Autofill session cancelled.');
    }

    apiGeneratedContent = resData.generatedContent || null;
    ocrMethod = resData.ocrMethod || 'Gemini Vision';

    extractedData = {
      title: resData.eventTitle || '',
      batch: '',
      date: resData.eventStartDate || resData.date || '',
      time: resData.time || resData.eventStartTime || '',
      eventType: resData.eventType || '',
      dressCode: '',
      specialNote: '',
      venue: resData.venue || '',
      department: resData.organizingDepartment || resData.department || '',
      speaker: (resData.resourcePersons || resData.speakers)?.map((s: any) => {
        const name = s.name ? String(s.name).trim() : '';
        if (!name) return '';
        const designation = s.designation ? String(s.designation).trim() : '';
        if (designation && !name.toLowerCase().includes(designation.toLowerCase())) {
          return `${name} (${designation})`;
        }
        return name;
      }).filter(Boolean).join(', ') || '',
      coordinator: resData.organizingBody || resData.organizedBy || '',
      facultyInCharge: '',
      theme: (resData.resourcePersons || resData.speakers)?.[0]?.designation || '',
      description: resData.briefDescription || '',
      eventStartDate: resData.eventStartDate || resData.date || '',
      eventEndDate: resData.eventEndDate || '',
      registrationDeadline: resData.registrationDeadline || '',
      eventStartTime: resData.eventStartTime || '',
      eventEndTime: resData.eventEndTime || '',
      registrationStartTime: resData.registrationStartTime || '',
      collaborators: Array.isArray(resData.collaborators) ? resData.collaborators : [],
      resourcePersons: Array.isArray(resData.resourcePersons || resData.speakers) ? (resData.resourcePersons || resData.speakers) : []
    };

    confMapping = {
      title: extractedData.title ? Math.round((resData.confidence?.eventTitle ?? 0.96) * 100) : 50,
      batch: 90,
      date: extractedData.date ? Math.round((resData.confidence?.eventStartDate ?? resData.confidence?.date ?? 0.96) * 100) : 50,
      time: extractedData.time ? 92 : 80,
      eventType: extractedData.eventType ? 95 : 80,
      venue: extractedData.venue ? Math.round((resData.confidence?.venue ?? 0.92) * 100) : 85,
      department: extractedData.department ? Math.round((resData.confidence?.department ?? 0.94) * 100) : 85,
      speaker: extractedData.speaker ? Math.round((resData.confidence?.resourcePersons ?? resData.confidence?.speakers ?? 0.96) * 100) : 85,
      coordinator: extractedData.coordinator ? 92 : 85,
      theme: extractedData.theme ? 92 : 85,
    };
  } catch (apiErr: any) {
    if (isCancelled()) {
      throw new Error('Autofill session cancelled.');
    }
    if (apiErr.message === 'QUOTA_EXCEEDED' || apiErr.message === 'OFFLINE') {
      throw apiErr;
    }
    console.warn('Backend autofill extraction failed, using client-side fallback:', apiErr);
    isFallback = true;
  }

  // 4. Local Fallback Route: Tesseract OCR + Heuristic Poster Parser
  if (isFallback) {
    onProgress(4, 'Analyzing text locally (Fallback)...');
    
    // Preprocess canvas image for optimal local OCR
    const preprocessedBlob = await preprocessForOCR(processedBlob);
    
    let rawText = '';
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (extension === '.txt' || file.type.startsWith('text/')) {
      rawText = await file.text();
    } else {
      const ocrRes = await Tesseract.recognize(preprocessedBlob, 'eng');
      rawText = ocrRes.data.text;
    }

    if (isCancelled()) {
      throw new Error('Autofill session cancelled.');
    }

    const cleanedText = normalizeOcrText(rawText);
    const parsed = parsePosterText(cleanedText);
    ocrMethod = 'Tesseract OCR (Local Fallback)';

    extractedData = {
      title: parsed.title || '',
      batch: parsed.audience || '',
      date: parsed.date || '',
      time: parsed.time || '',
      eventType: parsed.eventType || '',
      dressCode: '',
      specialNote: '',
      venue: parsed.venue || '',
      department: parsed.department || '',
      speaker: parsed.speaker || '',
      coordinator: parsed.organizer || '',
      facultyInCharge: '',
      theme: parsed.designation || '',
      description: parsed.description || '',
    };

    confMapping = {
      title: calculateFieldConfidence('eventTitle', parsed.title, cleanedText),
      batch: 90,
      date: calculateFieldConfidence('date', parsed.date, cleanedText),
      time: calculateFieldConfidence('time', parsed.time, cleanedText),
      eventType: 90,
      venue: calculateFieldConfidence('venue', parsed.venue, cleanedText),
      department: calculateFieldConfidence('department', parsed.department, cleanedText),
      speaker: calculateFieldConfidence('speaker', parsed.speaker, cleanedText),
      coordinator: calculateFieldConfidence('department', parsed.department, cleanedText),
      theme: calculateFieldConfidence('speaker', parsed.speaker, cleanedText),
    };
  }

  if (isCancelled()) {
    throw new Error('Autofill session cancelled.');
  }

  onProgress(5, 'Generating report narrative...');

  // 5. Structure Generated Report Content
  let generatedReport: any;
  if (apiGeneratedContent && Object.keys(apiGeneratedContent).length > 0) {
    generatedReport = {
      title: extractedData.title,
      objective: apiGeneratedContent.objectiveDescription || '',
      objectiveDescription: apiGeneratedContent.objectiveDescription || '',
      eventSummary: apiGeneratedContent.eventSummary || '',
      highlights: apiGeneratedContent.summaryPoints || [],
      detailedHighlights: apiGeneratedContent.summaryPoints || [],
      outcomes: apiGeneratedContent.keyProgramOutcomes || [],
      attendancePercentage: '',
      conclusion: '',
      detailedConclusion: '',
      participationDetails: ''
    };
  } else {
    const parsedForReport: ParsedPosterData = {
      title: extractedData.title,
      department: extractedData.department,
      organizer: extractedData.coordinator,
      eventType: extractedData.eventType,
      speaker: extractedData.speaker,
      designation: extractedData.theme,
      date: extractedData.date,
      time: extractedData.time,
      venue: extractedData.venue,
      audience: extractedData.batch,
      description: extractedData.description,
      confidence: 100,
    };
    generatedReport = generateEventReport(parsedForReport);
  }

  if (isCancelled()) {
    throw new Error('Autofill session cancelled.');
  }

  onProgress(6, 'Applying structured data to document...');

  // 6. Centralized Date & Speaker Disambiguation
  const inputStartDateStr = formatToInputDate(extractedData.eventStartDate || extractedData.date);
  const inputEndDateStr = formatToInputDate(extractedData.eventEndDate || extractedData.eventStartDate || extractedData.date);

  const structuredResourcePersons = (extractedData.resourcePersons && extractedData.resourcePersons.length > 0)
    ? extractedData.resourcePersons.map((rp: any) => ({
        name: rp.name ? String(rp.name).trim() : '',
        qualification: rp.qualification ? String(rp.qualification).trim() : '',
        designation: rp.designation ? String(rp.designation).trim() : '',
        organization: rp.organization ? String(rp.organization).trim() : ''
      })).filter((rp: any) => rp.name)
    : (extractedData.speaker ? [{
        name: extractedData.speaker.trim(),
        designation: extractedData.theme ? extractedData.theme.trim() : '',
        organization: extractedData.coordinator || ''
      }] : []);

  const collaborationStr = (extractedData.collaborators || []).join(', ');

  const incomingData: EventData = {
    title: extractedData.title || '',
    startDate: inputStartDateStr,
    endDate: inputEndDateStr || inputStartDateStr,
    venue: extractedData.venue || '',
    time: extractedData.time || '',
    department: extractedData.department || '',
    organizingBody: extractedData.coordinator || '',
    collaboration: collaborationStr,
    purpose: generatedReport.objective || '',
    objectiveDescription: generatedReport.objectiveDescription || '',
    eventSummary: generatedReport.eventSummary || '',
    summaryPoints: generatedReport.detailedHighlights || generatedReport.highlights || [],
    outcomePoints: generatedReport.outcomes || [],
    attendancePercentage: generatedReport.attendancePercentage || '',
    conclusion: generatedReport.detailedConclusion || generatedReport.conclusion || '',
    participationDetails: generatedReport.participationDetails || '',
    resourcePersons: structuredResourcePersons,
    participantCount: {
      facultyCount: 0,
      studentCount: 0,
      externalCount: 0,
      total: 0
    },
    images: []
  };

  // 7. Apply directly to Zustand Store if session is still active
  if (isCancelled() || !useEditorStore.getState().isAutofillSessionActive(sessionId)) {
    throw new Error('STALE_SESSION');
  }

  useEditorStore.getState().autofillData(incomingData);

  onProgress(7, 'Auto fill complete!');

  return {
    success: true,
    sessionId,
    extractedData,
    generatedReport,
    confidenceMapping: confMapping,
    ocrMethod
  };
}
