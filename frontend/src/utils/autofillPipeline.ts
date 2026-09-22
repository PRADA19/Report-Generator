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

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '' && !envUrl.includes('vercel.app')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://report-generator-lok5.onrender.com';
};
const API_URL = getApiUrl();

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
  quotaWarning?: boolean;
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

export function sanitizeQualificationFrontend(val: any): string {
  if (!val) return '';
  let cleaned = String(val).trim();
  cleaned = cleaned.replace(/[^\x00-\x7F]+/g, '').trim();
  cleaned = cleaned.replace(/^(?:[\d\s\/]*qualification\s*string\s*:?|qualification\s*:?)\s*/i, '').trim();
  if (/\bor\b/i.test(cleaned)) {
    cleaned = cleaned.split(/\s+\bor\b\s+/i)[0].trim();
  }
  cleaned = cleaned.replace(/^[\d\s\/]+/, '').trim();
  return cleaned;
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
  let rawApiResponse: any = null;

  // 3. Send poster to backend API
  try {
    const formData = new FormData();
    formData.append('poster', processedBlob, file.name.replace(/\.pdf$/i, '.png'));
    formData.append('file', processedBlob, file.name.replace(/\.pdf$/i, '.png'));
    formData.append('sessionId', sessionId);

    let response: Response | null = null;
    let lastFetchErr: any = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          onProgress(3, `Server starting... Retrying extraction (${attempt}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 3000));
        }

        if (isCancelled()) {
          throw new Error('STALE_SESSION');
        }

        const userApiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
        const headers: Record<string, string> = {};
        if (userApiKey && userApiKey.trim()) {
          headers['x-gemini-api-key'] = userApiKey.trim();
        }

        response = await fetch(`${API_URL}/api/autofill/extract`, {
          method: 'POST',
          headers,
          body: formData,
          signal
        });

        if (response.ok || response.status === 429) {
          break;
        }
      } catch (err: any) {
        lastFetchErr = err;
        if (err.message === 'STALE_SESSION' || err.name === 'AbortError') {
          throw err;
        }
      }
    }

    if (!response) {
      throw lastFetchErr || new Error('OFFLINE');
    }

    if (isCancelled()) {
      throw new Error('STALE_SESSION');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (errData.status === 'QUOTA_EXCEEDED' || response.status === 429) {
        const error: any = new Error('QUOTA_EXCEEDED');
        error.retryAfter = errData.retryAfter || 60;
        throw error;
      }
      if (errData.status === 'OFFLINE' || response.status === 403 || response.status === 503) {
        throw new Error('OFFLINE');
      }
      throw new Error(errData.error || 'API server unavailable.');
    }

    const resData = await response.json();
    rawApiResponse = resData;
    console.log('[AUTO FILL 07] Frontend received data:', resData);
    if (isCancelled()) {
      throw new Error('Autofill session cancelled.');
    }

    const payload = resData.data || resData;

    apiGeneratedContent = payload;
    ocrMethod = resData.ocrMethod || 'Gemini Vision';

    extractedData = {
      title: payload.eventTitle || payload.title || '',
      batch: '',
      date: payload.eventStartDate || payload.date || '',
      time: payload.eventStartTime || payload.time || '',
      eventType: payload.eventType || '',
      dressCode: '',
      specialNote: '',
      venue: payload.venue || '',
      department: payload.organizingDepartment || payload.department || '',
      speaker: (payload.resourcePersons || payload.speakers)?.map((s: any) => {
        const name = s.name ? String(s.name).trim() : '';
        if (!name) return '';
        const designation = s.designation ? String(s.designation).trim() : '';
        if (designation && !name.toLowerCase().includes(designation.toLowerCase())) {
          return `${name} (${designation})`;
        }
        return name;
      }).filter(Boolean).join(', ') || '',
      coordinator: payload.organizingBody || payload.organizedBy || '',
      facultyInCharge: '',
      theme: (payload.resourcePersons || payload.speakers)?.[0]?.designation || '',
      description: payload.objectiveDescription || payload.eventSummary || payload.briefDescription || '',
      eventStartDate: payload.eventStartDate || payload.date || '',
      eventEndDate: payload.eventEndDate || '',
      registrationDeadline: payload.registrationDeadline || '',
      eventStartTime: payload.eventStartTime || payload.time || '',
      eventEndTime: payload.eventEndTime || '',
      registrationStartTime: payload.registrationStartTime || '',
      collaborators: Array.isArray(payload.collaborators) ? payload.collaborators : [],
      resourcePersons: Array.isArray(payload.resourcePersons || payload.speakers) ? (payload.resourcePersons || payload.speakers) : []
    };

    confMapping = {
      title: extractedData.title ? Math.round((payload.confidence?.eventTitle ?? 0.96) * 100) : 50,
      batch: 90,
      date: extractedData.date ? Math.round((payload.confidence?.eventStartDate ?? payload.confidence?.date ?? 0.96) * 100) : 50,
      time: extractedData.time ? 92 : 80,
      eventType: extractedData.eventType ? 95 : 80,
      venue: extractedData.venue ? Math.round((payload.confidence?.venue ?? 0.92) * 100) : 85,
      department: extractedData.department ? Math.round((payload.confidence?.organizingDepartment ?? payload.confidence?.department ?? 0.94) * 100) : 85,
      speaker: extractedData.speaker ? Math.round((payload.confidence?.resourcePersons ?? payload.confidence?.speakers ?? 0.96) * 100) : 85,
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
  if (apiGeneratedContent && (apiGeneratedContent.objectiveDescription || apiGeneratedContent.eventSummary || (apiGeneratedContent.keyProgramOutcomes && apiGeneratedContent.keyProgramOutcomes.length > 0))) {
    generatedReport = {
      title: extractedData.title,
      objective: apiGeneratedContent.objectiveDescription || '',
      objectiveDescription: apiGeneratedContent.objectiveDescription || '',
      eventSummary: apiGeneratedContent.eventSummary || '',
      highlights: apiGeneratedContent.summaryPoints || [],
      detailedHighlights: apiGeneratedContent.summaryPoints || [],
      outcomes: apiGeneratedContent.keyProgramOutcomes || [],
      attendancePercentage: '',
      conclusion: apiGeneratedContent.conclusion || '',
      detailedConclusion: apiGeneratedContent.conclusion || '',
      participationDetails: apiGeneratedContent.participationDetails || ''
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

  const formattedTime = (extractedData.eventStartTime && extractedData.eventEndTime && extractedData.eventStartTime !== extractedData.eventEndTime)
    ? `${extractedData.eventStartTime} to ${extractedData.eventEndTime}`
    : (extractedData.eventStartTime || extractedData.time || '');

  const structuredResourcePersons = (extractedData.resourcePersons && extractedData.resourcePersons.length > 0)
    ? extractedData.resourcePersons.map((rp: any) => ({
        name: rp.name ? String(rp.name).trim() : '',
        qualification: sanitizeQualificationFrontend(rp.qualification),
        designation: rp.designation ? String(rp.designation).trim() : '',
        organization: rp.organization ? String(rp.organization).trim() : ''
      })).filter((rp: any) => rp.name)
    : (extractedData.speaker ? [{
        name: extractedData.speaker.trim(),
        designation: extractedData.theme ? extractedData.theme.trim() : '',
        organization: extractedData.coordinator || ''
      }] : []);

  const collaborationStr = (extractedData.collaborators || []).join(', ');

  const mainPurpose = generatedReport.objective || generatedReport.objectiveDescription || '';
  const objDesc = (generatedReport.objectiveDescription && generatedReport.objectiveDescription !== mainPurpose)
    ? generatedReport.objectiveDescription
    : '';

  const incomingData: EventData = {
    title: extractedData.title || '',
    startDate: inputStartDateStr,
    endDate: inputEndDateStr || inputStartDateStr,
    venue: extractedData.venue || '',
    time: formattedTime,
    department: extractedData.department || '',
    organizingBody: extractedData.coordinator || extractedData.department || '',
    collaboration: collaborationStr,
    purpose: mainPurpose,
    objectiveDescription: objDesc,
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
    ocrMethod,
    quotaWarning: rawApiResponse?.quotaWarning || false,
    rawResponse: rawApiResponse
  };
}
