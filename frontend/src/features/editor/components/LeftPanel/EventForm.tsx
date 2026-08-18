// frontend/src/features/editor/components/LeftPanel/EventForm.tsx
import React, { useState, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Plus, Trash, Users, Calendar, Award, BookOpen, ListOrdered, Sparkles, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { Button } from '../../../../components/ui/Button';
import Tesseract from 'tesseract.js';
import { normalizeOcrText } from '../../../../utils/ocrNormalizer';
import { parsePosterText } from '../../../../utils/posterParser';
import { generateEventReport } from '../../../../utils/reportGenerator';

export const EventForm: React.FC = () => {
  const {
    data,
    updateDataField,
    addResourcePerson,
    removeResourcePerson,
    updateResourcePerson,
    addSummaryPoint,
    removeSummaryPoint,
    updateSummaryPoint,
    addOutcomePoint,
    removeOutcomePoint,
    updateOutcomePoint,
    autofillData
  } = useEditorStore();

  // AI Autofill States
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisStepsText = [
    "Uploading poster...",
    "Extracting text...",
    "Analyzing content...",
    "Identifying event details...",
    "Generating report...",
    "Finalizing auto-fill..."
  ];

  const formatToInputDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
    return '2026-09-18';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      setAnalysisStep(0);
    }
  };

  const triggerRealPosterAutofill = async () => {
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) return;
    const file = fileInputRef.current.files[0];
    
    setIsAnalyzing(true);
    setAnalysisStep(1); // 1 = Uploading poster

    try {
      // Stage 1: Uploading poster...
      setAnalysisStep(1);
      await new Promise(r => setTimeout(r, 400));

      // Stage 2: Extracting text...
      setAnalysisStep(2);
      let extractionData: any;
      let apiGeneratedContent: any = null;
      let isFallback = false;

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/autofill/extract', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('API server unavailable');
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
      } catch (err) {
        console.warn("Backend extraction failed, falling back to local Tesseract OCR:", err);
        isFallback = true;
      }

      if (isFallback) {
        let text = '';
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (extension === '.txt' || file.type.startsWith('text/')) {
          text = await file.text();
        } else {
          const result = await Tesseract.recognize(file, 'eng');
          text = result.data.text;
        }

        // Stage 3: Analyzing content...
        setAnalysisStep(3);
        await new Promise(r => setTimeout(r, 400));
        const cleanedText = normalizeOcrText(text);

        // Stage 4: Identifying event details...
        setAnalysisStep(4);
        await new Promise(r => setTimeout(r, 400));
        const parsedData = parsePosterText(cleanedText);

        extractionData = {
          title: parsedData.title || '',
          batch: parsedData.batch || 'Students & Faculty',
          date: parsedData.date || '',
          time: parsedData.time || '',
          eventType: parsedData.eventType || '',
          dressCode: '',
          specialNote: '',
          venue: parsedData.venue || '',
          department: parsedData.department || '',
          speaker: parsedData.speaker || '',
          coordinator: parsedData.coordinator || '',
          facultyInCharge: '',
          theme: parsedData.theme || '',
          description: parsedData.description || '',
        };
      }

      // Stage 5: Generating report...
      setAnalysisStep(5);
      await new Promise(r => setTimeout(r, 400));
      
      let report: any;
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
        };
        report = generateEventReport(parsedForReport);
      }

      // Stage 6: Finalizing auto-fill...
      setAnalysisStep(6);
      await new Promise(r => setTimeout(r, 450));

      // Format date correctly
      const inputDateStr = formatToInputDate(extractionData.date);
      const speakerName = extractionData.speaker ? extractionData.speaker.split('(')[0].trim() : "";
      
      autofillData({
        title: report.title,
        department: extractionData.department,
        organizingBody: extractionData.coordinator || (extractionData.department ? `Department of ${extractionData.department}` : ""),
        collaboration: '',
        startDate: inputDateStr,
        endDate: inputDateStr,
        venue: extractionData.venue,
        purpose: report.objective,
        objectiveDescription: report.objectiveDescription,
        eventSummary: report.eventSummary,
        resourcePersons: speakerName ? [
          {
            name: speakerName,
            designation: extractionData.theme || '',
            organization: extractionData.coordinator || ''
          }
        ] : [],
        participantCount: {
          facultyCount: 0,
          studentCount: 0,
          externalCount: 0,
          total: 0
        },
        summaryPoints: report.detailedHighlights || report.highlights || [],
        outcomePoints: report.outcomes || [],
        attendancePercentage: report.attendancePercentage || '',
        conclusion: report.detailedConclusion || report.conclusion || '',
        participationDetails: report.participationDetails || '',
        images: []
      });

      setAnalysisStep(7); // All complete
      setIsAnalyzing(false);
    } catch (err) {
      console.error(err);
      alert("Autofill failed: " + (err as Error).message);
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleParticipantChange = (field: 'facultyCount' | 'studentCount' | 'externalCount', val: number) => {
    const currentCounts = { ...data.participantCount, [field]: val };
    const total = currentCounts.facultyCount + currentCounts.studentCount + currentCounts.externalCount;
    updateDataField('participantCount', { ...currentCounts, total });
  };

  const inlineInputClasses = "w-full bg-surface-primary border border-surface-tertiary rounded-[12px] p-1.5 text-center text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all font-semibold";

  return (
    <div className="flex flex-col space-y-6 p-4">
      
      {/* ✨ Auto-fill from Event Poster */}
      <div className="smart-card bg-gradient-to-br from-accent-secondary/10 to-transparent border border-accent-primary/20">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
            Auto-fill from Event Poster
          </h4>
        </div>
        
        {analysisStep === 0 && !isAnalyzing ? (
          <div className="space-y-3">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />
            
            {!fileName ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-surface-tertiary hover:border-accent-primary/60 bg-surface-primary rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150"
              >
                <Upload className="w-5 h-5 text-text-muted mb-1.5" />
                <span className="text-[11px] font-bold text-text-secondary">Upload Flyer Poster (PNG, PDF)</span>
                <span className="text-[9px] text-text-muted mt-0.5">Let AI read poster details & auto-fill</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="bg-surface-primary p-2.5 rounded-xl border border-surface-tertiary flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-secondary truncate max-w-[150px]" title={fileName}>
                    {fileName}
                  </span>
                  <button 
                    onClick={() => { setFileName(''); setAnalysisStep(0); }}
                    className="text-[9px] text-red-500 hover:underline font-bold"
                  >
                    Clear
                  </button>
                </div>
                <Button 
                  onClick={triggerRealPosterAutofill}
                  variant="primary"
                  className="w-full text-[11px] py-2 rounded-xl"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Analyze with AI
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {/* Animated stepper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
                <span>AI Processing Stage</span>
                <span>{analysisStep < 7 ? `${Math.round((Math.min(analysisStep, 6) / 6) * 100)}%` : '100%'}</span>
              </div>
              
              <div className="w-full bg-surface-tertiary h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-accent-primary h-full transition-all duration-300 ease-out" 
                  style={{ width: `${(Math.min(analysisStep, 6) / 6) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-surface-primary p-3 rounded-xl border border-surface-tertiary space-y-2">
              {analysisStepsText.map((text, idx) => {
                const stepNum = idx + 1;
                const isDone = analysisStep > stepNum;
                const isActive = analysisStep === stepNum;

                return (
                  <div key={idx} className="flex items-center space-x-2 text-[10px]">
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-accent-primary animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-surface-tertiary flex-shrink-0" />
                    )}
                    <span className={`font-medium ${isDone ? 'text-text-secondary line-through opacity-60' : isActive ? 'text-accent-primary font-bold' : 'text-text-muted'}`}>
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>

            {analysisStep === 7 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-green-600 dark:text-green-400 font-extrabold flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />
                  Auto-fill Complete!
                </span>
                <button 
                  onClick={() => { setFileName(''); setAnalysisStep(0); }}
                  className="text-[9px] text-accent-secondary-text hover:underline font-bold"
                >
                  Reset Autofill
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* SECTION 1: Event Identity */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-2">
          <Award className="w-4.5 h-4.5 text-accent-primary" />
          <span>Event Identity</span>
        </h3>
        
        {/* Title */}
        <Textarea
          label="Event Title"
          value={data.title}
          onChange={(e) => updateDataField('title', e.target.value)}
          className="resize-y min-h-[72px]"
          placeholder="e.g. Guest Lecture on Cloud Infrastructure Security"
        />

        {/* Dept & Organizing body */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Department"
            type="text"
            value={data.department}
            onChange={(e) => updateDataField('department', e.target.value)}
            placeholder="e.g. CSE"
          />
          <Input
            label="Organizing Body"
            type="text"
            value={data.organizingBody}
            onChange={(e) => updateDataField('organizingBody', e.target.value)}
            placeholder="e.g. Association of CSE"
          />
        </div>

        {/* Collaboration */}
        <Input
          label="Collaboration / Sponsors"
          type="text"
          value={data.collaboration}
          onChange={(e) => updateDataField('collaboration', e.target.value)}
          placeholder="e.g. AWS Academy / ICT Academy"
        />
      </div>

      {/* SECTION 2: Schedule & Venue */}
      <div className="space-y-4 pt-4 border-t border-surface-tertiary">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-2">
          <Calendar className="w-4.5 h-4.5 text-accent-primary" />
          <span>Date & Venue</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={data.startDate}
            onChange={(e) => updateDataField('startDate', e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={data.endDate}
            onChange={(e) => updateDataField('endDate', e.target.value)}
          />
        </div>

        <Input
          label="Venue"
          type="text"
          value={data.venue}
          onChange={(e) => updateDataField('venue', e.target.value)}
          placeholder="e.g. Seminar Hall, CSE Block"
        />
      </div>

      {/* SECTION 3: Resource Persons */}
      <div className="space-y-4 pt-4 border-t border-surface-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4.5 h-4.5 text-accent-primary" />
            <span>Resource Persons</span>
          </h3>
          <Button
            onClick={addResourcePerson}
            size="sm"
            variant="secondary"
            className="p-1.5 rounded-xl text-text-primary"
            title="Add speaker"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-4">
          {data.resourcePersons.map((rp, idx) => (
            <div key={idx} className="bg-surface-primary border border-surface-tertiary rounded-3xl p-4 relative group hover:shadow-sm transition-all duration-200 theme-transition">
              <Button
                onClick={() => removeResourcePerson(idx)}
                variant="danger"
                className="absolute top-2.5 right-2.5 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>

              <div className="space-y-3">
                <span className="text-[10px] text-text-muted font-bold tracking-wide uppercase block">Speaker #{idx + 1}</span>
                <Input
                  value={rp.name}
                  onChange={(e) => updateResourcePerson(idx, { name: e.target.value })}
                  placeholder="Full Name"
                />
                <Input
                  value={rp.designation}
                  onChange={(e) => updateResourcePerson(idx, { designation: e.target.value })}
                  placeholder="Designation"
                />
                <Input
                  value={rp.organization}
                  onChange={(e) => updateResourcePerson(idx, { organization: e.target.value })}
                  placeholder="Organization"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Participation Metrics */}
      <div className="space-y-4 pt-4 border-t border-surface-tertiary">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-2">
          <Users className="w-4.5 h-4.5 text-accent-primary" />
          <span>Participation Stats</span>
        </h3>
        
        <div className="grid grid-cols-3 gap-3 bg-surface-primary border border-surface-tertiary p-4 rounded-3xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary block text-center uppercase tracking-wide">Faculty</span>
            <input
              type="number"
              value={data.participantCount.facultyCount}
              onChange={(e) => handleParticipantChange('facultyCount', parseInt(e.target.value) || 0)}
              className={inlineInputClasses}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary block text-center uppercase tracking-wide">Students</span>
            <input
              type="number"
              value={data.participantCount.studentCount}
              onChange={(e) => handleParticipantChange('studentCount', parseInt(e.target.value) || 0)}
              className={inlineInputClasses}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary block text-center uppercase tracking-wide">External</span>
            <input
              type="number"
              value={data.participantCount.externalCount}
              onChange={(e) => handleParticipantChange('externalCount', parseInt(e.target.value) || 0)}
              className={inlineInputClasses}
            />
          </div>
          <div className="col-span-3 border-t border-surface-tertiary pt-3 flex items-center justify-between text-xs text-text-secondary">
            <span>Aggregated Total:</span>
            <span className="font-extrabold text-text-primary bg-surface-primary border border-surface-tertiary px-2.5 py-0.5 rounded-lg">{data.participantCount.total}</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: Objectives */}
      <div className="space-y-4 pt-4 border-t border-surface-tertiary">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-2">
          <BookOpen className="w-4.5 h-4.5 text-accent-primary" />
          <span>Objectives</span>
        </h3>
        <Textarea
          label="Purpose of Event"
          value={data.purpose}
          onChange={(e) => updateDataField('purpose', e.target.value)}
          className="resize-y min-h-[90px]"
          placeholder="State the background purpose and targeted IQAC guidelines..."
        />
      </div>

      {/* SECTION 6: Summary Points */}
      <div className="space-y-4 pt-4 border-t border-surface-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-2">
            <ListOrdered className="w-4.5 h-4.5 text-accent-primary" />
            <span>Summary Bullet Points</span>
          </h3>
          <Button
            onClick={addSummaryPoint}
            size="sm"
            className="p-1.5 rounded-xl text-text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-3.5">
          {data.summaryPoints.map((pt, idx) => (
            <div key={idx} className="flex items-start space-x-2 bg-surface-primary border border-surface-tertiary p-2 rounded-3xl relative group hover:shadow-sm transition-all duration-200 theme-transition">
              <span className="text-[10px] text-text-muted font-mono mt-3.5 ml-1.5 flex-shrink-0">#{idx + 1}</span>
              <Textarea
                value={pt}
                onChange={(e) => updateSummaryPoint(idx, e.target.value)}
                placeholder="Detail bullet point..."
                className="flex-1 bg-surface-primary min-h-[50px]"
              />
              <Button
                onClick={() => removeSummaryPoint(idx)}
                variant="danger"
                className="p-2 rounded-xl mt-1.5"
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: Outcome Points */}
      <div className="space-y-4 pt-4 border-t border-surface-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-2">
            <ListOrdered className="w-4.5 h-4.5 text-accent-primary" />
            <span>Event Outcomes</span>
          </h3>
          <Button
            onClick={addOutcomePoint}
            size="sm"
            className="p-1.5 rounded-xl text-text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-3.5">
          {data.outcomePoints.map((pt, idx) => (
            <div key={idx} className="flex items-start space-x-2 bg-surface-primary border border-surface-tertiary p-2 rounded-3xl relative group hover:shadow-sm transition-all duration-200 theme-transition">
              <span className="text-[10px] text-text-muted font-mono mt-3.5 ml-1.5 flex-shrink-0">#{idx + 1}</span>
              <Textarea
                value={pt}
                onChange={(e) => updateOutcomePoint(idx, e.target.value)}
                placeholder="Key outcome bullet..."
                className="flex-1 bg-surface-primary min-h-[50px]"
              />
              <Button
                onClick={() => removeOutcomePoint(idx)}
                variant="danger"
                className="p-2 rounded-xl mt-1.5"
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
export default EventForm;
