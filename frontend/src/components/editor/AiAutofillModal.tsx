// frontend/src/components/editor/AiAutofillModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Sparkles, CheckCircle2, Loader2, AlertCircle, X, ChevronRight, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../common/Badge';
import { useEditorStore } from '../../features/editor/store/editorStore';
import type { EventData } from '../../types/editor';
import { KprcasTemplate } from '../../features/editor/components/CenterPanel/KprcasTemplate';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { normalizeOcrText } from '../../utils/ocrNormalizer';
import { parsePosterText } from '../../utils/posterParser';
import { generateEventReport } from '../../utils/reportGenerator';
import { preprocessForOCR } from '../../utils/canvasPreprocessor';
import { calculateFieldConfidence } from '../../utils/confidenceEngine';
import { fillEmptyBlanks } from '../../utils/eventDataMerge';

// Load pdf.js worker globally using cdnjs fallback to prevent bundle pathing failures
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface AiAutofillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAutofillModal: React.FC<AiAutofillModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSessionIdRef = useRef<string>('');

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

  const [isVisionAvailable, setIsVisionAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/autofill/health')
        .then(res => res.json())
        .then(data => {
          setIsVisionAvailable(data.available === true);
        })
        .catch(() => {
          setIsVisionAvailable(false);
        });
    }
  }, [isOpen]);

  // Editable Extracted Fields state
  const [extractedData, setExtractedData] = useState({
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
  });

  // Generated Report Preview state
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Load current template layout and editor settings from Zustand store
  const { data: storeData, styling: storeStyling, layoutConfig: storeLayoutConfig, sections: storeSections } = useEditorStore();

  // Combine extracted, generated, and template-fallback states into a single preview layout
  const speakerNamePreview = extractedData.speaker ? extractedData.speaker.split('(')[0].trim() : "";
  const incomingPreviewData: EventData = {
    title: extractedData.title,
    startDate: extractedData.date,
    endDate: extractedData.date,
    venue: extractedData.venue,
    department: extractedData.department,
    organizingBody: extractedData.coordinator,
    collaboration: '',
    purpose: generatedReport?.objective || '',
    objectiveDescription: generatedReport?.objectiveDescription || '',
    eventSummary: generatedReport?.eventSummary || '',
    summaryPoints: generatedReport?.detailedHighlights || generatedReport?.highlights || [],
    outcomePoints: generatedReport?.outcomes || [],
    attendancePercentage: generatedReport?.attendancePercentage || '',
    conclusion: generatedReport?.detailedConclusion || generatedReport?.conclusion || '',
    participationDetails: generatedReport?.participationDetails || '',
    resourcePersons: speakerNamePreview ? [
      {
        name: speakerNamePreview,
        designation: extractedData.theme || "",
        organization: extractedData.coordinator || ""
      }
    ] : [],
    participantCount: {
      facultyCount: 0,
      studentCount: 0,
      externalCount: 0,
      total: 0
    },
    images: []
  };

  const previewData = fillEmptyBlanks(storeData, incomingPreviewData);

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
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterPreview(null);
    setCurrentPoster(null);
    setParserConfidence(null);
    setOcrLanguage('eng');
    uploadSessionIdRef.current = '';
    setDocumentFingerprint('');
    setPredictedData({});
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

  /**
   * Fallback route: local Tesseract OCR + posterParser heuristics
   */
  const runLocalFallbackOCR = async (
    fileBlob: Blob,
    lang: string
  ): Promise<{ text: string; confidence: number }> => {
    // Check if mock plaintext first
    try {
      if (fileBlob.type.startsWith('text/')) {
        const text = await fileBlob.text();
        return { text, confidence: 99 };
      }
    } catch (e) {}

    const result = await Tesseract.recognize(fileBlob, lang);
    return {
      text: result.data.text,
      confidence: Math.round(result.data.confidence)
    };
  };

  const processPoster = async (file: File, sessionId: string, lang: string = 'eng') => {
    setIsExtracting(true);
    setHasGenerated(false);
    setExtractionProgress(10);
    setStatus('Analyzing file contents...');

    try {
      // 1. Calculate file SHA-256 fingerprint for user learning database key
      const fingerprint = await calculateFingerprint(file);
      if (sessionId !== uploadSessionIdRef.current) return;
      setDocumentFingerprint(fingerprint);
      setExtractionProgress(20);

      // 2. If PDF, render the first page to a canvas and convert to PNG blob
      let processedFile: File | Blob = file;
      if (file.type === 'application/pdf') {
        setStatus('Rendering PDF circular to image...');
        processedFile = await renderPdfPageToBlob(file);
        setExtractionProgress(40);
      }

      if (sessionId !== uploadSessionIdRef.current) return;

      // 3. Apply canvas preprocessing filters (Grayscale + Contrast stretching + Thresholding)
      setStatus('Applying image preprocessing filters...');
      const preprocessedBlob = await preprocessForOCR(processedFile);
      setExtractionProgress(55);

      if (sessionId !== uploadSessionIdRef.current) return;

      let extractionData;
      let confMapping: Record<string, number> = {};
      let isFallback = false;
      let apiGeneratedContent: any = null;

      // 4. Try API Extraction Gateway
      try {
        setStatus('Performing layout-aware extraction...');
        const formData = new FormData();
        formData.append('file', preprocessedBlob, file.name.replace(/\.pdf$/i, '.png'));
        formData.append('fingerprint', fingerprint);

        const response = await fetch('/api/autofill/extract', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('API server unavailable or returned an error.');
        }

        const resData = await response.json();
        apiGeneratedContent = resData.generatedContent || null;
        
        extractionData = {
          title: resData.eventTitle || '',
          batch: resData.audience || 'Students & Faculty',
          date: resData.date || '',
          time: resData.time || '',
          eventType: resData.eventType || '',
          dressCode: '',
          specialNote: '',
          venue: resData.venue || '',
          department: resData.department || '',
          speaker: resData.speakers?.map((s: any) => `${s.name} (${s.designation})`).join(', ') || '',
          coordinator: resData.organizedBy || '',
          facultyInCharge: '',
          theme: resData.speakers?.[0]?.designation || '',
          description: resData.briefDescription || '',
        };

        confMapping = {
          title: Math.round((resData.confidence?.eventTitle ?? 1.0) * 100),
          batch: 90,
          date: Math.round((resData.confidence?.date ?? 1.0) * 100),
          time: 90,
          eventType: 90,
          venue: Math.round((resData.confidence?.venue ?? 1.0) * 100),
          department: Math.round((resData.confidence?.department ?? 1.0) * 100),
          speaker: Math.round((resData.confidence?.speakers ?? 1.0) * 100),
          coordinator: 90,
          theme: Math.round((resData.confidence?.speakers ?? 1.0) * 100),
        };

      } catch (apiErr) {
        console.warn('Backend autofill service failed, falling back to client-side OCR:', apiErr);
        isFallback = true;
      }

      // 5. Fallback Route: Client-side Tesseract OCR + Regex Heuristics
      if (isFallback) {
        setStatus('Tesseract OCR parsing (Local Fallback)...');
        const ocrResult = await runLocalFallbackOCR(preprocessedBlob, lang);
        
        if (sessionId !== uploadSessionIdRef.current) return;
        setExtractionProgress(75);
        setStatus('Normalizing OCR blocks...');

        const rawText = ocrResult.text;
        const cleanedText = normalizeOcrText(rawText);
        const extracted = parsePosterText(cleanedText);

        extractionData = {
          title: extracted.title || '',
          batch: extracted.audience || 'Students & Faculty',
          date: extracted.date || '',
          time: extracted.time || '',
          eventType: extracted.eventType || '',
          dressCode: '',
          specialNote: '',
          venue: extracted.venue || '',
          department: extracted.department || '',
          speaker: extracted.speaker || '',
          coordinator: extracted.organizer || '',
          facultyInCharge: '',
          theme: extracted.designation || '',
          description: extracted.description || '',
        };

        // Compute local confidence scores for visible inputs
        confMapping = {
          title: calculateFieldConfidence('eventTitle', extracted.title, cleanedText),
          batch: 90,
          date: calculateFieldConfidence('date', extracted.date, cleanedText),
          time: calculateFieldConfidence('time', extracted.time, cleanedText),
          eventType: 90,
          venue: calculateFieldConfidence('venue', extracted.venue, cleanedText),
          department: calculateFieldConfidence('department', extracted.department, cleanedText),
          speaker: calculateFieldConfidence('speaker', extracted.speaker, cleanedText),
          coordinator: calculateFieldConfidence('department', extracted.department, cleanedText),
          theme: calculateFieldConfidence('speaker', extracted.speaker, cleanedText),
        };
      }

      if (sessionId !== uploadSessionIdRef.current) return;
      
      setExtractedData(extractionData as any);
      setFieldConfidence(confMapping);
      setPredictedData(extractionData as any); // Save copy to trace future user corrections
      setExtractionProgress(90);
      setStatus('Generating report templates...');

      const avgConfidence = Object.values(confMapping).reduce((a, b) => a + b, 0) / Object.keys(confMapping).length;
      setParserConfidence(avgConfidence);

      // Trigger warning message if crucial parameters are low confidence
      const visibleFields = ['title', 'date', 'time', 'venue', 'department', 'speaker', 'coordinator'];
      const lowConfidenceCount = visibleFields.filter(f => (confMapping[f] ?? 100) < 70).length;
      if (lowConfidenceCount >= 3) {
        setErrorMsg("Multiple fields have low extraction confidence. Please check highlighted inputs manually.");
      } else {
        setErrorMsg("");
      }

      // Step 6 — Generate report switch case parameters
      setIsGenerating(true);
      setGenerationProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));
      if (sessionId !== uploadSessionIdRef.current) return;
      setGenerationProgress(60);

      const parsedForReport = {
        title: extractionData.title,
        department: extractionData.department,
        organizer: extractionData.coordinator,
        eventType: extractionData.eventType,
        speaker: extractionData.speaker,
        designation: extractionData.theme,
        date: extractionData.date,
        time: extractionData.time,
        venue: extractionData.venue,
        audience: extractionData.batch,
        description: extractionData.description,
        confidence: avgConfidence,
      };

      let report;
      if (apiGeneratedContent && Object.keys(apiGeneratedContent).length > 0) {
        report = {
          title: extractionData.title,
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
        report = generateEventReport(parsedForReport);
      }

      if (sessionId !== uploadSessionIdRef.current) return;
      setGeneratedReport(report);
      setHasGenerated(true);
      setGenerationProgress(100);
      setIsGenerating(false);
      setIsExtracting(false);
      setExtractionProgress(100);
      setStatus('Report generated successfully.');
    } catch (err) {
      if (sessionId === uploadSessionIdRef.current) {
        setIsExtracting(false);
        setIsGenerating(false);
        setErrorMsg("Unable to process the document. Please verify the file and try again.");
      }
    }
  };

  const handlePosterUpload = async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Only JPG, PNG, JPEG, and PDF files are supported.");
      return;
    }
    setErrorMsg("");
    setFileName(file.name);

    try {
      const sessionId = crypto.randomUUID();
      uploadSessionIdRef.current = sessionId;

      if (posterPreview) {
        URL.revokeObjectURL(posterPreview);
      }
      setPosterPreview(null);
      setGeneratedReport(null);
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

      await processPoster(file, sessionId, ocrLanguage);
    } catch (error) {
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

    const speakerName = extractedData.speaker ? extractedData.speaker.split('(')[0].trim() : "";
    const incomingData: EventData = {
      title: extractedData.title,
      startDate: extractedData.date,
      endDate: extractedData.date,
      venue: extractedData.venue,
      department: extractedData.department,
      organizingBody: extractedData.coordinator,
      collaboration: '',
      purpose: generatedReport.objective,
      objectiveDescription: generatedReport.objectiveDescription,
      eventSummary: generatedReport.eventSummary,
      summaryPoints: generatedReport.detailedHighlights || generatedReport.highlights || [],
      outcomePoints: generatedReport.outcomes || [],
      attendancePercentage: generatedReport.attendancePercentage || '',
      conclusion: generatedReport.detailedConclusion || generatedReport.conclusion || '',
      participationDetails: generatedReport.participationDetails || '',
      resourcePersons: speakerName ? [
        {
          name: speakerName,
          designation: extractedData.theme || "",
          organization: extractedData.coordinator || ""
        }
      ] : [],
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
          await fetch('/api/autofill/feedback', {
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
              <span>Offline Auto Fill Workspace</span>
              {isVisionAvailable ? (
                <Badge variant="success" className="text-[10px] ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold">
                  AI Vision: Ready
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold animate-pulse">
                  AI Vision: Offline (Using OCR fallback)
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
                        className="w-full h-full object-cover"
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
                        processPoster(currentPoster, sessionId, newLang);
                      }
                    }}
                    className="w-full bg-surface-secondary border border-surface-tertiary rounded-xl p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="eng">English Only</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Document recognized</span>
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

                {/* Scrollable editable extraction fields */}
                <div className="space-y-3.5 max-h-[50vh] lg:max-h-none overflow-y-visible">
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Event Title</label>
                    <input
                      type="text"
                      value={extractedData.title}
                      onChange={(e) => setExtractedData(prev => ({ ...prev, title: e.target.value }))}
                      className={getInputClass('title', extractedData.title)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Audience</label>
                      <input
                        type="text"
                        value={extractedData.batch}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, batch: e.target.value }))}
                        className={getInputClass('batch', extractedData.batch)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Event Type</label>
                      <input
                        type="text"
                        value={extractedData.eventType}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, eventType: e.target.value }))}
                        className={getInputClass('eventType', extractedData.eventType)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Date</label>
                      <input
                        type="text"
                        value={extractedData.date}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, date: e.target.value }))}
                        className={getInputClass('date', extractedData.date)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Time</label>
                      <input
                        type="text"
                        value={extractedData.time}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, time: e.target.value }))}
                        className={getInputClass('time', extractedData.time)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Department</label>
                      <input
                        type="text"
                        value={extractedData.department}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, department: e.target.value }))}
                        className={getInputClass('department', extractedData.department)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Venue</label>
                      <input
                        type="text"
                        value={extractedData.venue}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, venue: e.target.value }))}
                        className={getInputClass('venue', extractedData.venue)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Speaker / Guest</label>
                      <input
                        type="text"
                        value={extractedData.speaker}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, speaker: e.target.value }))}
                        className={getInputClass('speaker', extractedData.speaker)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Designation</label>
                      <input
                        type="text"
                        value={extractedData.theme}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, theme: e.target.value }))}
                        className={getInputClass('theme', extractedData.theme)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Organizer / Body</label>
                    <input
                      type="text"
                      value={extractedData.coordinator}
                      onChange={(e) => setExtractedData(prev => ({ ...prev, coordinator: e.target.value }))}
                      className={getInputClass('coordinator', extractedData.coordinator)}
                    />
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

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-accent-secondary animate-spin" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-text-primary">{status}</h5>
                  <p className="text-[10px] text-text-muted">Structuring document text...</p>
                </div>
                <div className="w-full max-w-[200px] h-1 bg-surface-tertiary rounded-full overflow-hidden">
                  <div className="bg-accent-secondary h-full transition-all duration-300" style={{ width: `${generationProgress}%` }} />
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
                  data={previewData}
                  styling={storeStyling}
                  layoutConfig={storeLayoutConfig}
                  sections={storeSections}
                  zoomScale={0.46}
                />
              </div>
            )}
          </div>

        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 border-t border-surface-tertiary/60 bg-surface-secondary flex items-center justify-end space-x-3 flex-shrink-0">
          <Button onClick={handleClose} variant="secondary" size="sm" className="px-4 py-2 text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleApplyDetails} 
            disabled={!hasGenerated}
            variant="primary" 
            size="sm" 
            className="px-6 py-2 text-xs font-extrabold shadow-md shadow-accent-primary/20 flex items-center space-x-1.5"
          >
            <span>Apply to Editor</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AiAutofillModal;
