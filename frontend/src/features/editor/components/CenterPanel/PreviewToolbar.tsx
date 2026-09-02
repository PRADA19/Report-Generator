// frontend/src/features/editor/components/CenterPanel/PreviewToolbar.tsx
import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { exportService } from '../../../../services/export/exportService';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Unlock,
  FileDown
} from 'lucide-react';

interface PreviewToolbarProps {
  zoomScale: number;
  setZoomScale: (val: number | ((prev: number) => number)) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
}

export const AutosaveIndicator: React.FC = () => {
  const state = useEditorStore();
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSaved, setLastSaved] = useState<string>('');

  useEffect(() => {
    setStatus('saving');
    const timer = setTimeout(() => {
      setStatus('saved');
      const now = new Date();
      setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
    return () => clearTimeout(timer);
  }, [state.data, state.styling, state.layoutConfig, state.sections, state.layoutLocked]);

  return (
    <div className="flex items-center space-x-1.5 text-xs text-text-secondary theme-transition">
      {status === 'saving' ? (
        <>
          <Loader2 className="w-3.5 h-3.5 text-accent-primary animate-spin" />
          <span className="hidden lg:inline text-[10px] font-bold tracking-wide uppercase text-text-muted">Saving…</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary" />
          <span className="hidden lg:inline text-[10px] font-bold tracking-wide uppercase text-text-muted">
            {lastSaved ? `Saved ${lastSaved}` : 'Saved'}
          </span>
        </>
      )}
    </div>
  );
};

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  zoomScale,
  setZoomScale,
  onFitWidth,
  onFitPage
}) => {
  const { data, resetToTemplateDefaults, toggleLayoutLock, layoutLocked } = useEditorStore();

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 1.8));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.4));
  const handleResetZoom = () => setZoomScale(1.0);

  const handlePrint = () => {
    exportService.exportToPdf({ fileName: `${(data.title || 'Event_Report').replace(/[^a-zA-Z0-9\s_-]/g, '').trim().toLowerCase().replace(/\s+/g, '_')}.pdf` });
  };

  const handleExportWord = () => {
    exportService.exportToWord(data.title || 'Event_Report');
  };

  const handleResetDocument = () => {
    const confirmReset = window.confirm("Are you sure you want to reset this document? This will clear all custom text, images, and layout reorderings.");
    if (confirmReset) {
      resetToTemplateDefaults();
    }
  };

  return (
    <div className="w-full flex justify-center p-3 select-none flex-shrink-0 z-20 no-print bg-transparent theme-transition">
      <div className="glass-panel rounded-full px-3 py-2 shadow-xl border border-surface-tertiary h-12 flex items-center justify-between max-w-2xl w-full gap-2 theme-transition">
        
        {/* LEFT: Autosave & Status */}
        <div className="flex items-center space-x-2">
          <AutosaveIndicator />
          <div className="h-4 w-px bg-surface-tertiary/40 hidden sm:block"></div>
          {/* Quick Lock Indicator */}
          <button
            onClick={toggleLayoutLock}
            className={`flex items-center space-x-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all ${
              layoutLocked 
                ? 'bg-accent-primary/20 text-accent-primary' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
            title={layoutLocked ? "Layout order locked (Click to unlock)" : "Layout order editable (Click to lock)"}
          >
            {layoutLocked ? <Lock className="w-3 h-3 text-accent-primary" /> : <Unlock className="w-3 h-3" />}
            <span className="hidden sm:inline">{layoutLocked ? 'Locked' : 'Editable'}</span>
          </button>
        </div>

        {/* CENTER: Zoom Controls */}
        <div className="flex items-center space-x-0.5 bg-bg-primary p-0.5 rounded-full border border-surface-tertiary/60">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:scale-105 active:scale-95 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          {/* Reset Scale indicator */}
          <button
            onClick={handleResetZoom}
            className="px-2.5 py-0.5 rounded-full text-[10px] text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-all font-mono font-bold"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:scale-105 active:scale-95 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          
          <div className="h-3 w-px bg-surface-tertiary/40 mx-1"></div>
          
          {/* Fit Width */}
          <button
            onClick={onFitWidth}
            className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:scale-105 active:scale-95 transition-all"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          
          {/* Fit Page */}
          <button
            onClick={onFitPage}
            className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:scale-105 active:scale-95 transition-all"
            title="Fit to Page Height"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RIGHT: Print & Reset Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1 px-3 py-1 bg-accent-primary text-white shadow-md hover:bg-accent-primary-hover active:scale-[0.98] transition-all rounded-full text-[10px] font-bold"
            title="Export to PDF / print event report"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          
          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1 px-3 py-1 bg-accent-secondary text-accent-secondary-text border border-surface-tertiary shadow-sm hover:bg-accent-secondary-hover active:scale-[0.98] transition-all rounded-full text-[10px] font-bold"
            title="Export to Microsoft Word"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Word</span>
          </button>
          
          <button
            onClick={handleResetDocument}
            className="p-1.5 text-text-muted hover:text-red-500 rounded-full hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all"
            title="Clear all fields"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
export default PreviewToolbar;
