// frontend/src/components/editor/AiAutofillModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Sparkles, CheckCircle2, Loader2, AlertCircle, X, ChevronRight, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../common/Badge';
import { useEditorStore } from '../../features/editor/store/editorStore';
import type { EventData } from '../../types/editor';
import { KprcasTemplate } from '../../features/editor/components/CenterPanel/KprcasTemplate';
import * as pdfjsLib from 'pdfjs-dist';
import { generateEventReport } from '../../utils/reportGenerator';
import { executePosterAutofill, formatToInputDate, type ExtractedPosterFields } from '../../utils/autofillPipeline';

// Load pdf.js worker globally using cdnjs fallback to prevent bundle pathing failures
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return 'https://report-generator-lok5.onrender.com';
};
const API_URL = getApiUrl();

interface AiAutofillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAutofillModal: React.FC<AiAutofillModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSessionIdRef = useRef<string>('');

  // Editable Extracted Fields state
  const [extractedData, setExtractedData] = useState<ExtractedPosterFields>({
    title: '',
    batch: '', // audience
    date: '',
    time: '',
    eventType: '',
    dressCode: '',
    specialNote: '',
    venue: '',
    department: '',
    speaker: '',
    coordinator: '', // organizer
    facultyInCharge: '',
    theme: '', // speaker designation
    description: '',
    resourcePersons: []
  });

  // Generated Report Preview state
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Modal local states
  const [fileName, setFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [status, setStatus] = useState<string>('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [currentPoster, setCurrentPoster] = useState<File | null>(null);
  const [parserConfidence, setParserConfidence] = useState<number | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<string>('eng');

  // New self-learning metadata states
  const [documentFingerprint, setDocumentFingerprint] = useState<string>('');
  const [predictedData, setPredictedData] = useState<Record<string, string>>({});
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, number>>({
    title: 100,
    batch: 100,
    date: 100,
    time: 100,
    eventType: 100,
    venue: 100,
    department: 100,
    speaker: 100,
    coordinator: 100,
    theme: 100,
  });

  const [visionStatus, setVisionStatus] = useState<'ONLINE' | 'PROCESSING' | 'QUOTA_WARNING' | 'QUOTA_EXCEEDED' | 'OFFLINE' | 'ERROR' | 'loading'>('loading');
  const [connectingMessage, setConnectingMessage] = useState<string>('Connecting to Gemini AI...');
  const [quotaCountdown, setQuotaCountdown] = useState<number | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<string>('');

  const checkHealth = async (retryCount = 0, maxRetries = 5) => {
    setVisionStatus('loading');
    if (retryCount > 0) {
      setConnectingMessage(`Waking up Gemini AI (Server starting... Attempt ${retryCount}/${maxRetries})`);
    } else {
      setConnectingMessage('Connecting to Gemini AI...');
    }

    const coldStartTimer = setTimeout(() => {
      setConnectingMessage(`Waking up AI backend (Cold Start attempt ${retryCount + 1}/${maxRetries})...`);
    }, 2500);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${API_URL}/api/autofill/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      clearTimeout(coldStartTimer);

      const data = await res.json().catch(() => ({}));
      
      if (res.status === 429 || data.status === 'QUOTA_EXCEEDED') {
        setVisionStatus('QUOTA_EXCEEDED');
        setQuotaCountdown(data.retryAfter || 60);
      } else if (data && data.status === 'QUOTA_WARNING') {
        setVisionStatus('QUOTA_WARNING');
      } else if (data && data.status === 'OFFLINE') {
        if (retryCount < maxRetries) {
          setTimeout(() => checkHealth(retryCount + 1, maxRetries), 3500);
        } else {
          setVisionStatus('OFFLINE');
        }
      } else if (!res.ok) {
        if (retryCount < maxRetries) {
          setTimeout(() => checkHealth(retryCount + 1, maxRetries), 3500);
        } else {
          setVisionStatus('OFFLINE');
        }
      } else {
        setVisionStatus('ONLINE');
        setQuotaCountdown(null);
      }
    } catch (error: any) {
      clearTimeout(coldStartTimer);
      console.warn(`Health check attempt ${retryCount + 1} failed:`, error.message || error);
      if (retryCount < maxRetries) {
        setConnectingMessage(`Server waking up... retrying (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => checkHealth(retryCount + 1, maxRetries), 3500);
      } else {
        setVisionStatus('OFFLINE');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  // Quota Countdown ticker
  useEffect(() => {
    if (quotaCountdown === null || quotaCountdown <= 0) return;

    const timer = setInterval(() => {
      setQuotaCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          checkHealth();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quotaCountdown]);

  // Initialize modal state from Zustand store if the editor already contains data when opened
  useEffect(() => {
    if (isOpen) {
      const store = useEditorStore.getState();
      const titleVal = store.data.title;
      if (titleVal) {
        setExtractedData({
          title: titleVal,
          batch: store.data.participationDetails ? 'Students' : '',
          date: store.data.startDate || '',
          time: '',
          eventType: '',
          dressCode: '',
          specialNote: '',
          venue: store.data.venue || '',
          department: store.data.department || '',
          speaker: store.data.resourcePersons?.[0]?.name || '',
          coordinator: store.data.organizingBody || '',
          facultyInCharge: '',
          theme: store.data.resourcePersons?.[0]?.designation || '',
          description: store.data.purpose || '',
        });
        setGeneratedReport({
          objective: store.data.purpose || '',
          objectiveDescription: store.data.objectiveDescription || '',
          eventSummary: store.data.eventSummary || '',
          detailedHighlights: store.data.summaryPoints || [],
          outcomes: store.data.outcomePoints || [],
          attendancePercentage: store.data.attendancePercentage || '',
          participationDetails: store.data.participationDetails || ''
        });
        setHasGenerated(true);
      }
    }
  }, [isOpen]);

  // Real-time synchronization of modal state fields to editor store
  useEffect(() => {
    if (!isOpen || !hasGenerated || !generatedReport) return;

    const modalResourcePersons = (extractedData.resourcePersons && extractedData.resourcePersons.length > 0)
      ? extractedData.resourcePersons
      : (extractedData.speaker ? [{
          name: extractedData.speaker.trim(),
          designation: extractedData.theme || "",
          organization: extractedData.coordinator || ""
        }] : []);

    const inputStartDateStr = formatToInputDate(extractedData.eventStartDate || extractedData.date);
    const inputEndDateStr = formatToInputDate(extractedData.eventEndDate || extractedData.eventStartDate || extractedData.date);
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
      participationDetails: generatedReport.participationDetails || '',
      resourcePersons: modalResourcePersons,
      participantCount: {
        facultyCount: 0,
        studentCount: 0,
        externalCount: 0,
        total: 0
      },
      images: []
    };

    const store = useEditorStore.getState();
    const isDifferent = 
      store.data.title !== incomingData.title ||
      store.data.startDate !== incomingData.startDate ||
      store.data.venue !== incomingData.venue ||
      store.data.time !== incomingData.time ||
      store.data.department !== incomingData.department ||
      store.data.organizingBody !== incomingData.organizingBody ||
      store.data.purpose !== incomingData.purpose ||
      JSON.stringify(store.data.resourcePersons) !== JSON.stringify(incomingData.resourcePersons);

    if (isDifferent) {
      store.autofillData(incomingData);
    }
  }, [extractedData, generatedReport, isOpen, hasGenerated]);


  // Load current template layout and editor settings from Zustand store
  const { data: storeData, styling: storeStyling, layoutConfig: storeLayoutConfig, sections: storeSections } = useEditorStore();

  // Prevent browser memory leaks by revoking old preview URLs
  useEffect(() => {
    return () => {
      if (posterPreview) {
        URL.revokeObjectURL(posterPreview);
      }
    };
  }, [posterPreview]);

  const resetModalState = () => {
    setFileName('');
    setIsExtracting(false);
    setIsGenerating(false);
    setExtractionProgress(0);
    setGenerationProgress(0);
    setStatus('');
    setHasGenerated(false);
    setErrorMsg('');
    setExtractedData({
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
    });
    setGeneratedReport(null);
    setExtractionMethod('');
    setDocumentFingerprint('');
    setPredictedData({});
    setParserConfidence(null);
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterPreview(null);
    setCurrentPoster(null);
    setOcrLanguage('eng');
    uploadSessionIdRef.current = '';
    setFieldConfidence({
      title: 100,
      batch: 100,
      date: 100,
      time: 100,
      eventType: 100,
      venue: 100,
      department: 100,
      speaker: 100,
      coordinator: 100,
      theme: 100,
    });
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  /**
   * Helper: Calculates a unique client-side SHA-256 fingerprint for database correlation.
   */
  const calculateFingerprint = async (file: File | Blob): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Return pseudo-hash based on filename + size if crypto API fails
      if ('name' in file) {
        return `pseudo_${file.name}_${file.size}`;
      }
      return `pseudo_${Date.now()}`;
    }
  };

  /**
   * Helper: Uses pdfjs-dist to render the first page of a PDF to a canvas and returns a PNG Blob.
   */
  const renderPdfPageToBlob = async (pdfFile: File): Promise<Blob> => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    // Render at 2x resolution scale for clean OCR
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context for PDF page rendering.');
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas conversion to blob failed.'));
      }, 'image/png');
    });
  };

  const processPoster = async (file: File, sessionId: string) => {
    const store = useEditorStore.getState();
    setIsExtracting(true);
    setHasGenerated(false);
    setExtractionProgress(10);
    setStatus('Analyzing file contents...');

    try {
      const fingerprint = await calculateFingerprint(file);
      if (!store.isAutofillSessionActive(sessionId)) return;
      setDocumentFingerprint(fingerprint);

      const result = await executePosterAutofill(file, {
        sessionId,
        onProgress: (step, msg) => {
          if (store.isAutofillSessionActive(sessionId)) {
            setExtractionProgress(Math.min(90, step * 15));
            setStatus(msg);
          }
        },
        isCancelled: () => !store.isAutofillSessionActive(sessionId)
      });

      if (!store.isAutofillSessionActive(sessionId)) return;

      if (result.quotaWarning) {
        setVisionStatus('QUOTA_WARNING');
      } else {
        setVisionStatus('ONLINE');
      }

      setExtractionMethod(result.ocrMethod);
      setExtractedData(result.extractedData as any);
      setFieldConfidence(result.confidenceMapping);
      setPredictedData(result.extractedData as any);
      setGeneratedReport(result.generatedReport);
      setHasGenerated(true);

      const confValues = Object.values(result.confidenceMapping).filter((val) => val > 0);
      const avgConf = confValues.length > 0
        ? confValues.reduce((a, b) => a + b, 0) / confValues.length
        : 90;
      setParserConfidence(avgConf);

      setExtractionProgress(100);
      setGenerationProgress(100);
      setIsExtracting(false);
      setIsGenerating(false);
      setStatus('Report generated successfully.');
    } catch (err: any) {
      if (err.message === 'STALE_SESSION' || err.name === 'AbortError') {
        return;
      }
      if (store.isAutofillSessionActive(sessionId)) {
        setIsExtracting(false);
        setIsGenerating(false);
        setExtractionProgress(0);
        setGenerationProgress(0);

        store.clearReportData();

        if (err.message === 'QUOTA_EXCEEDED') {
          setVisionStatus('QUOTA_EXCEEDED');
          setQuotaCountdown(err.retryAfter || 60);
          setErrorMsg("⚠️ AI request quota limit reached. Cooldown is active. Auto Fill will resume shortly.");
        } else if (err.message === 'OFFLINE') {
          setVisionStatus('OFFLINE');
          setErrorMsg("⚠️ AI Auto Fill is currently offline. Please check the backend service or GEMINI_API_KEY.");
        } else {
          setVisionStatus('ERROR');
          setErrorMsg(err.message || "Unable to process the document. Please verify the file and try again.");
        }
      }
    }
  };

  const handlePosterUpload = async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Only JPG, PNG, JPEG, WebP, and PDF files are supported.");
      return;
    }
    
    resetModalState();
    const store = useEditorStore.getState();
    const sessionId = store.startAutofillSession();
    uploadSessionIdRef.current = sessionId;

    setErrorMsg("");
    setFileName(file.name);

    try {
      setCurrentPoster(file);

      // Create preview (render first page to canvas if PDF)
      if (file.type === 'application/pdf') {
        const renderedBlob = await renderPdfPageToBlob(file);
        const previewUrl = URL.createObjectURL(renderedBlob);
        setPosterPreview(previewUrl);
      } else {
        const previewUrl = URL.createObjectURL(file);
        setPosterPreview(previewUrl);
      }

      await processPoster(file, sessionId);
    } catch (error) {
      if (!store.isAutofillSessionActive(uploadSessionIdRef.current)) return;
      console.error('Poster upload failed:', error);
      setErrorMsg('Unable to parse the uploaded file. Please try again.');
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePosterUpload(e.target.files[0]);
    }
  };

  const triggerGeneration = async () => {
    if (!extractedData.title) {
      setErrorMsg('Please enter an event title first.');
      return;
    }

    setIsGenerating(true);
    setHasGenerated(false);
    setGenerationProgress(20);
    setStatus('Generating report from fields...');

    await new Promise(resolve => setTimeout(resolve, 300));
    setGenerationProgress(60);

    const dataToParse = {
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
      outcomes: generatedReport?.outcomes
    };

    const report = generateEventReport(dataToParse);

    setGenerationProgress(100);
    setIsGenerating(false);
    setHasGenerated(true);
    setGeneratedReport(report);
    setStatus('Report generated successfully.');
    setErrorMsg('');
  };

  const handleApplyDetails = async () => {
    if (!generatedReport) return;

    const modalResourcePersons = (extractedData.resourcePersons && extractedData.resourcePersons.length > 0)
      ? extractedData.resourcePersons
      : (extractedData.speaker ? [{
          name: extractedData.speaker.trim(),
          designation: extractedData.theme || "",
          organization: extractedData.coordinator || ""
        }] : []);

    const inputStartDateStr = formatToInputDate(extractedData.eventStartDate || extractedData.date);
    const inputEndDateStr = formatToInputDate(extractedData.eventEndDate || extractedData.eventStartDate || extractedData.date);
    const collaborationStr = (extractedData.collaborators || []).join(', ');

    const incomingData: EventData = {
      title: extractedData.title,
      startDate: inputStartDateStr,
      endDate: inputEndDateStr || inputStartDateStr,
      venue: extractedData.venue,
      time: extractedData.time,
      department: extractedData.department,
      organizingBody: extractedData.coordinator,
      collaboration: collaborationStr,
      purpose: generatedReport.objective,
      objectiveDescription: generatedReport.objectiveDescription,
      eventSummary: generatedReport.eventSummary,
      summaryPoints: generatedReport.detailedHighlights || generatedReport.highlights || [],
      outcomePoints: generatedReport.outcomes || [],
      attendancePercentage: generatedReport.attendancePercentage || '',
      participationDetails: generatedReport.participationDetails || '',
      resourcePersons: modalResourcePersons,
      participantCount: {
        facultyCount: 0,
        studentCount: 0,
        externalCount: 0,
        total: 0
      },
      images: []
    };

    // Apply values using the Zustand editorStore's autofillData (which calls fillEmptyBlanks)
    const store = useEditorStore.getState();
    store.autofillData(incomingData);

    // Async POST feedback submission for changed fields
    const feedbackMappings = [
      { key: 'title', field: 'eventTitle' },
      { key: 'department', field: 'department' },
      { key: 'coordinator', field: 'organizedBy' },
      { key: 'venue', field: 'venue' },
      { key: 'date', field: 'date' }
    ];

    feedbackMappings.forEach(async ({ key, field }) => {
      const predictedVal = predictedData[key] || '';
      const currentVal = (extractedData as any)[key] || '';

      if (predictedVal.trim() && predictedVal.trim().toLowerCase() !== currentVal.trim().toLowerCase()) {
        try {
          await fetch(`${API_URL}/api/autofill/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fingerprint: documentFingerprint,
              field,
              predicted: predictedVal,
              corrected: currentVal
            })
          });
        } catch (e) {
          console.error(`Failed to submit feedback for ${field}:`, e);
        }
      }
    });

    handleClose();
  };

  const getConfidenceRating = (score: number | null): 'High' | 'Medium' | 'Low' => {
    if (score === null) return 'Low';
    if (score >= 80) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (rating: 'High' | 'Medium' | 'Low'): string => {
    if (rating === 'High') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (rating === 'Medium') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  // Color-coded borders based on confidence levels
  const getInputClass = (fieldName: string, val: string) => {
    const base = "w-full bg-surface-secondary border rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-all";
    if (!val) {
      return `${base} border-rose-500/50 bg-rose-500/5 focus:ring-1 focus:ring-rose-500/30`;
    }
    
    const conf = fieldConfidence[fieldName] ?? 100;
    if (conf >= 80) {
      return `${base} border-surface-tertiary focus:ring-1 focus:ring-accent-primary/20`;
    }
    if (conf >= 50) {
      return `${base} border-amber-500/50 bg-amber-500/5 focus:ring-1 focus:ring-amber-500/30`;
    }
    return `${base} border-rose-500/50 bg-rose-500/5 focus:ring-1 focus:ring-rose-500/30`;
  };

  if (!isOpen) return null;

  const confidenceRating = getConfidenceRating(parserConfidence);

  // Compute number of low confidence items
  const visibleFields = ['title', 'date', 'time', 'venue', 'department', 'speaker', 'coordinator'];
  const lowConfidenceCount = visibleFields.filter(f => (fieldConfidence[f] ?? 100) < 70).length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md transition-opacity duration-300">
      
      {/* Centered Large Dialog Container */}
      <div className="relative bg-surface-primary border border-surface-tertiary shadow-2xl rounded-[20px] overflow-hidden z-10 flex flex-col w-[95vw] h-[95vh] lg:w-[90vw] lg:max-w-[1200px] lg:h-[90vh] theme-transition animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-tertiary/60 bg-surface-secondary flex-shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-text-primary leading-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-accent-primary animate-pulse" />
              <span>Online Auto Fill Workspace</span>
              {visionStatus === 'ONLINE' && (
                <Badge variant="success" className="text-[10px] ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold animate-none" title="Gemini AI (gemini-3.6-flash) is connected and available for Auto Fill.">
                  ● Gemini AI Online
                </Badge>
              )}
              {visionStatus === 'QUOTA_WARNING' && (
                <Badge variant="warning" className="text-[10px] ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold animate-pulse" title="AI usage limit may be approaching.">
                  ⚠️ AI Limit Approaching
                </Badge>
              )}
              {visionStatus === 'QUOTA_EXCEEDED' && (
                <Badge variant="danger" className="text-[10px] ml-2 bg-rose-500/10 text-rose-500 border-rose-500/20 font-semibold animate-pulse" title="AI request quota reached. Auto-resuming shortly.">
                  ⚠️ AI Quota Reached {quotaCountdown ? `(${quotaCountdown}s)` : ''}
                </Badge>
              )}
              {visionStatus === 'PROCESSING' && (
                <Badge variant="info" className="text-[10px] ml-2 bg-sky-500/10 text-sky-500 border-sky-500/20 font-semibold animate-pulse" title="Extracting poster details and generating report content.">
                  ◌ Gemini AI Processing…
                </Badge>
              )}
              {visionStatus === 'OFFLINE' && (
                <Badge variant="outline" className="text-[10px] ml-2 bg-rose-500/10 text-rose-500 border-rose-500/20 font-semibold animate-pulse" title="AI Auto Fill is temporarily unavailable. Please check the backend connection or API key.">
                  ● Gemini AI Offline
                </Badge>
              )}
              {visionStatus === 'ERROR' && (
                <Badge variant="outline" className="text-[10px] ml-2 bg-rose-500/10 text-rose-500 border-rose-500/20 font-semibold animate-pulse" title="An extraction error occurred.">
                  ● Gemini AI Error
                </Badge>
              )}
              {visionStatus === 'loading' && (
                <Badge variant="outline" className="text-[10px] ml-2 bg-sky-500/10 text-sky-500 border-sky-500/20 font-semibold animate-pulse flex items-center">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  <span>{connectingMessage}</span>
                </Badge>
              )}
            </h3>
            <p className="text-xs text-text-muted mt-1">Upload a PDF circular or flyer image to extract details, check confidence ratings, and generate institutional sheets.</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Panel Content Wrapper */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* PANEL 1: POSTER UPLOAD (Left - 25%) */}
          <div className="w-full lg:w-[25%] p-5 border-b lg:border-b-0 lg:border-r border-surface-tertiary flex flex-col space-y-4 overflow-y-auto min-h-0 flex-shrink-0 bg-surface-primary">
            <h4 className="text-xs font-black uppercase tracking-wider text-text-primary">1. Document Upload</h4>

            {/* Offline Status Alert Card */}
            {visionStatus === 'OFFLINE' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <div className="font-bold text-[11px]">Gemini AI is Offline</div>
                  <div className="text-[10px] text-text-muted mt-0.5 leading-normal">
                    Cannot reach AI backend. Please verify backend URL and <code className="font-mono text-[9px] bg-surface-secondary px-1 py-0.5 rounded">GEMINI_API_KEY</code>.
                  </div>
                </div>
              </div>
            )}

            {/* Quota Warning Alert Card */}
            {visionStatus === 'QUOTA_WARNING' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <div className="font-bold text-[11px]">AI Limit Approaching</div>
                  <div className="text-[10px] text-text-muted mt-0.5 leading-normal">
                    High request frequency detected. Please space out consecutive poster uploads.
                  </div>
                </div>
              </div>
            )}

            {/* Quota Exceeded Alert Card */}
            {visionStatus === 'QUOTA_EXCEEDED' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <div className="font-bold text-[11px]">AI Quota Limit Reached</div>
                  <div className="text-[10px] text-text-muted mt-0.5 leading-normal">
                    Rate limit cooldown active. Auto-resuming in {quotaCountdown ?? 60}s...
                  </div>
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileInputChange} 
              accept="image/png,image/jpeg,image/jpg,application/pdf" 
              className="hidden" 
            />

            {!fileName ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handlePosterUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragOver 
                    ? 'border-accent-primary bg-accent-primary/5' 
                    : 'border-surface-tertiary hover:border-accent-primary/60 bg-surface-secondary/40 hover:bg-surface-secondary/70'
                }`}
              >
                <div className="p-3 rounded-xl bg-accent-primary/10 text-accent-primary mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h5 className="text-xs font-bold text-text-primary text-center">Drag & Drop File</h5>
                <p className="text-[10px] text-text-muted text-center mt-1">or click to browse from device</p>
                <div className="mt-4 px-2.5 py-0.5 rounded-full bg-surface-tertiary/60 text-text-secondary text-[9px] font-semibold">
                  PNG • JPG • JPEG • PDF
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-surface-secondary border border-surface-tertiary rounded-2xl p-4 flex flex-col items-center relative group">
                  <div className="w-full aspect-[3/4] bg-surface-tertiary/20 rounded-lg overflow-hidden border border-surface-tertiary relative">
                    {posterPreview && (
                      <img 
                        src={posterPreview} 
                        alt="Uploaded Flyer" 
                        className="w-full h-full object-contain bg-slate-900/40"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="secondary" className="scale-90">
                        Change File
                      </Button>
                    </div>
                  </div>
                  <div className="w-full mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-secondary truncate max-w-[150px]" title={fileName}>
                      {fileName}
                    </span>
                    <button 
                      onClick={resetModalState}
                      className="text-[9px] text-red-400 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">OCR Language</label>
                  <select
                    value={ocrLanguage}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setOcrLanguage(newLang);
                      if (currentPoster) {
                        const sessionId = crypto.randomUUID();
                        uploadSessionIdRef.current = sessionId;
                        processPoster(currentPoster, sessionId);
                      }
                    }}
                    className="w-full bg-surface-secondary border border-surface-tertiary rounded-xl p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="eng">English Only</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center space-x-2 text-[10px] text-emerald-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Document recognized</span>
                  </div>
                  {extractionMethod && (
                    <span className="text-[9px] text-emerald-500/80 font-mono pl-6">
                      Method: {extractionMethod}
                    </span>
                  )}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-red-400" />
                <span className="font-semibold leading-normal">{errorMsg}</span>
              </div>
            )}
          </div>

          {/* PANEL 2: EXTRACTED POSTER DATA (Center - 35%) */}
          <div className="w-full lg:w-[35%] p-5 border-b lg:border-b-0 lg:border-r border-surface-tertiary flex flex-col space-y-4 overflow-y-auto min-h-0 flex-shrink-0 bg-surface-primary">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-primary">2. Extracted Details</h4>
              {parserConfidence !== null && (
                <Badge variant={confidenceRating === 'High' ? 'success' : confidenceRating === 'Medium' ? 'warning' : 'outline'} className={`font-semibold border ${getConfidenceColor(confidenceRating)}`}>
                  Avg Confidence: {confidenceRating}
                </Badge>
              )}
            </div>
            
            {isExtracting ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-text-primary">{status}</h5>
                  <p className="text-[10px] text-text-muted">Resolving multi-column grids & layout structures...</p>
                </div>
                <div className="w-full max-w-[200px] h-1 bg-surface-tertiary rounded-full overflow-hidden">
                  <div className="bg-accent-primary h-full transition-all duration-300" style={{ width: `${extractionProgress}%` }} />
                </div>
              </div>
            ) : !fileName ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-surface-tertiary rounded-2xl bg-surface-secondary/10 text-center">
                <AlertCircle className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-xs text-text-muted leading-relaxed">Please upload a document to proceed.</p>
              </div>
            ) : (
              <div className="space-y-4 pr-1">
                {/* Low Confidence Warning Banner */}
                {lowConfidenceCount >= 3 && (
                  <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] font-bold leading-normal">
                      Some details may be inaccurate. Please review and correct highlighted fields before applying.
                    </div>
                  </div>
                )}

                {/* Scrollable editable extraction fields directly matching KPRCAS Report fields */}
                <div className="space-y-3.5 max-h-[50vh] lg:max-h-none overflow-y-visible">
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Event Title</label>
                    <input
                      type="text"
                      value={extractedData.title || ''}
                      onChange={(e) => setExtractedData(prev => ({ ...prev, title: e.target.value }))}
                      className={getInputClass('title', extractedData.title)}
                      placeholder="e.g. HACK TO PATENT: TRANSFORMING IDEAS INTO IP"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Organizing Body</label>
                      <input
                        type="text"
                        value={extractedData.coordinator || ''}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, coordinator: e.target.value }))}
                        className={getInputClass('coordinator', extractedData.coordinator)}
                        placeholder="e.g. School of Computing Science"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Organizing Department</label>
                      <input
                        type="text"
                        value={extractedData.department || ''}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, department: e.target.value }))}
                        className={getInputClass('department', extractedData.department)}
                        placeholder="e.g. Department of Information Technology"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Collaborations (If any)</label>
                      <input
                        type="text"
                        value={Array.isArray(extractedData.collaborators) ? extractedData.collaborators.join(', ') : ''}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, collaborators: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] }))}
                        className="w-full bg-surface-secondary border border-surface-tertiary rounded-xl p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                        placeholder="Leave empty if none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Total Students Participated</label>
                      <input
                        type="text"
                        value=""
                        disabled
                        className="w-full bg-surface-secondary/50 border border-surface-tertiary rounded-xl p-2 text-xs text-text-muted cursor-not-allowed"
                        placeholder="Leave empty (Fill after event)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Details of Resource Person</label>
                    <input
                      type="text"
                      value={extractedData.speaker || ''}
                      onChange={(e) => setExtractedData(prev => ({ ...prev, speaker: e.target.value }))}
                      className={getInputClass('speaker', extractedData.speaker)}
                      placeholder="e.g. Mr. N. Mathimurugan, M.E., Ph.D., Co-founder & CEO, SM AI Mojo Tech, Coimbatore"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Event Date</label>
                      <input
                        type="text"
                        value={extractedData.eventStartDate || extractedData.date || ''}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, date: e.target.value, eventStartDate: e.target.value }))}
                        className={getInputClass('date', extractedData.date)}
                        placeholder="DD-MM-YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Time</label>
                      <input
                        type="text"
                        value={extractedData.eventStartTime || extractedData.time || ''}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, time: e.target.value, eventStartTime: e.target.value }))}
                        className={getInputClass('time', extractedData.time)}
                        placeholder="11:00 a.m."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Venue</label>
                      <input
                        type="text"
                        value={extractedData.venue || ''}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, venue: e.target.value }))}
                        className={getInputClass('venue', extractedData.venue)}
                        placeholder="Lecture Hall"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Agenda / Description</label>
                    <textarea
                      value={extractedData.description}
                      onChange={(e) => setExtractedData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full bg-surface-secondary border border-surface-tertiary rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary resize-y"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-tertiary/60 flex-shrink-0">
                  <Button 
                    onClick={triggerGeneration} 
                    disabled={isGenerating}
                    variant="primary" 
                    className="w-full py-2.5 rounded-xl font-bold shadow-md shadow-accent-primary/20 flex items-center justify-center space-x-2 text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Update Preview</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* PANEL 3: A4 SHEET LIVE PREVIEW (Right - 40%) */}
          <div className="w-full lg:w-[40%] p-5 bg-surface-secondary/40 flex flex-col overflow-y-auto min-h-0 items-center justify-start">
            <div className="w-full max-w-[500px] flex items-center justify-between pb-3 flex-shrink-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-primary">3. Live A4 Sheet Preview</h4>
              <Badge variant="purple">Report Sheet</Badge>
            </div>

            {isExtracting || isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-text-primary">{status || 'Analyzing document details...'}</h5>
                  <p className="text-[10px] text-text-muted">Extracting fields & structuring document layout...</p>
                </div>
                <div className="w-full max-w-[200px] h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div className="bg-accent-primary h-full transition-all duration-300" style={{ width: `${Math.max(15, extractionProgress || generationProgress)}%` }} />
                </div>
              </div>
            ) : !generatedReport ? (
              <div className="flex-1 w-full max-w-[450px] aspect-[1/1.414] border border-dashed border-surface-tertiary rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-surface-primary/40 my-2">
                <FileText className="w-10 h-10 text-slate-600 mb-3" />
                <h5 className="text-xs font-bold text-text-secondary">A4 Layout Template Canvas</h5>
                <p className="text-[10px] text-text-muted mt-2 leading-relaxed max-w-[280px]">
                  Upload a document to compile report layouts instantly.
                </p>
              </div>
            ) : (
              /* Actual Dynamic KprcasTemplate Container scaled down to fit the preview panel */
              <div className="w-full overflow-y-auto flex-1 flex flex-col items-center py-2 select-text">
                <KprcasTemplate 
                  data={storeData}
                  styling={storeStyling}
                  layoutConfig={storeLayoutConfig}
                  sections={storeSections}
                  zoomScale={0.42}
                />
              </div>
            )}
          </div>

        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 border-t border-surface-tertiary/60 bg-surface-secondary flex items-center justify-end space-x-3 flex-shrink-0">
          <Button 
            onClick={handleApplyDetails} 
            disabled={!hasGenerated}
            variant="primary" 
            size="sm" 
            className="px-6 py-2 text-xs font-extrabold shadow-md shadow-accent-primary/20 flex items-center space-x-1.5"
          >
            <span>Done</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AiAutofillModal;
