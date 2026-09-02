// frontend/src/features/editor/components/LeftPanel/EventForm.tsx
import React, { useState, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Plus, Trash, Users, Calendar, Award, BookOpen, ListOrdered, Sparkles, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { Button } from '../../../../components/ui/Button';
import { executePosterAutofill } from '../../../../utils/autofillPipeline';

export const EventForm: React.FC = () => {
  const {
    data,
    updateDataField,
    addResourcePerson,
    removeResourcePerson,
    updateResourcePerson,
    addSummaryPoint,
    removeSummaryPoint,
    updateSummaryPoint
  } = useEditorStore();

  // AI Autofill States
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const uploadSessionIdRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      setAnalysisStep(0);

      // Reset previous event/report data completely before starting the new extraction
      const store = useEditorStore.getState();
      store.clearReportData();

      // Trigger extraction immediately
      await triggerRealPosterAutofill(file);
    }
  };

  const triggerRealPosterAutofill = async (file: File) => {
    const store = useEditorStore.getState();
    const sessionId = store.startAutofillSession();
    uploadSessionIdRef.current = sessionId;
    
    setIsAnalyzing(true);
    setAnalysisStep(1);

    try {
      await executePosterAutofill(file, {
        sessionId,
        onProgress: (step) => {
          if (store.isAutofillSessionActive(sessionId)) {
            setAnalysisStep(step);
          }
        },
        isCancelled: () => !store.isAutofillSessionActive(sessionId)
      });

      if (store.isAutofillSessionActive(sessionId)) {
        setAnalysisStep(7);
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      if (err.message === 'STALE_SESSION' || err.name === 'AbortError') {
        return;
      }
      if (store.isAutofillSessionActive(sessionId)) {
        setIsAnalyzing(false);
        setAnalysisStep(0);
        
        store.clearReportData();

        if (err.message === 'QUOTA_EXCEEDED') {
          alert("Today's AI limit has been reached. Gemini Auto Fill is temporarily unavailable. Please try again later.");
        } else if (err.message === 'OFFLINE') {
          alert("AI Auto Fill is temporarily unavailable. Please check your connection or try again later.");
        } else {
          alert("Autofill failed: " + err.message);
        }
      }
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
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-surface-tertiary hover:border-accent-primary/60 bg-surface-primary rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150"
            >
              <Upload className="w-5 h-5 text-text-muted mb-1.5" />
              <span className="text-[11px] font-bold text-text-secondary">Upload Flyer Poster (PNG, PDF)</span>
              <span className="text-[9px] text-text-muted mt-0.5">Let AI read poster details & auto-fill</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {analysisStep < 7 ? (
              <div className="bg-surface-primary p-4 rounded-xl border border-surface-tertiary text-center space-y-2">
                <div className="flex items-center justify-center space-x-2 text-xs font-bold text-accent-primary animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing poster…</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  Extracting event details from <span className="font-semibold">{fileName}</span> and generating report content.
                </p>
              </div>
            ) : (
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

    </div>
  );
};
export default EventForm;
