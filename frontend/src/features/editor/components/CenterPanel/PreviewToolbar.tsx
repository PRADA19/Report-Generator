// frontend/src/features/editor/components/CenterPanel/PreviewToolbar.tsx
import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
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
    window.print();
  };

  const handleExportWord = () => {
    const rps = data.resourcePersons.map((rp, idx) => `
      <tr>
        <td style="border: 1px solid #d5d9e6; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #d5d9e6; padding: 6px; font-weight: bold;">${rp.name || '-'}</td>
        <td style="border: 1px solid #d5d9e6; padding: 6px;">${rp.designation || '-'}</td>
        <td style="border: 1px solid #d5d9e6; padding: 6px;">${rp.organization || '-'}</td>
      </tr>
    `).join('');

    const summaries = data.summaryPoints.map(pt => `<li style="margin-bottom: 6px; text-align: justify;">${pt}</li>`).join('');
    const outcomes = data.outcomePoints.map(pt => `<li style="margin-bottom: 6px; text-align: justify;">${pt}</li>`).join('');

    // Dynamic header configurations
    const institutionName = data.header?.institutionName || "KPR College of Arts and Science";
    const details = data.header?.details || "(Autonomous) | Affiliated to Bharathiar University";
    const address = data.header?.address || "Avinashi Road, Arasur, Coimbatore - 641407";
    const headerText = data.header?.text || "Internal Quality Assurance Cell (IQAC)";
    const departmentName = data.header?.department || data.department || "ACADEMIC DEPARTMENT";

    // Dynamic signature configurations
    const sigs = data.signatures || { coordinator: true, hod: true, iqac: true, principal: true };
    let sigCells = '';
    if (sigs.coordinator !== false) {
      sigCells += `<td style="border: none; text-align: center; padding-top: 40px; font-weight: bold;">Signature of Coordinator<br><span style="font-size: 8pt; font-weight: normal; color: #7a7485;">Organizing Coordinator</span></td>`;
    }
    if (sigs.hod !== false) {
      sigCells += `<td style="border: none; text-align: center; padding-top: 40px; font-weight: bold;">Signature of HOD<br><span style="font-size: 8pt; font-weight: normal; color: #7a7485;">Department of ${data.department || 'Academic Dept'}</span></td>`;
    }
    if (sigs.iqac !== false) {
      sigCells += `<td style="border: none; text-align: center; padding-top: 40px; font-weight: bold;">IQAC Coordinator<br><span style="font-size: 8pt; font-weight: normal; color: #7a7485;">KPRCAS Office</span></td>`;
    }
    if (sigs.principal !== false) {
      sigCells += `<td style="border: none; text-align: center; padding-top: 40px; font-weight: bold;">Signature of Principal<br><span style="font-size: 8pt; font-weight: normal; color: #7a7485;">KPRCAS Head Office</span></td>`;
    }

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <title>IQAC Event Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #2a2235; line-height: 1.5; font-size: 11pt; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #210635; padding-bottom: 12px; }
          .header h1 { font-size: 18pt; font-weight: bold; margin: 0; color: #7B337E; text-transform: uppercase; }
          .header p { margin: 3px 0; font-size: 9.5pt; color: #5B5566; }
          .section-title { font-size: 12pt; font-weight: bold; color: #7B337E; border-bottom: 1px solid #d5d9e6; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
          th { background-color: #f9f7fa; font-weight: bold; text-align: left; border: 1px solid #d5d9e6; padding: 8px; }
          td { border: 1px solid #d5d9e6; padding: 8px; }
          .footer { margin-top: 40px; font-size: 10pt; }
          .signature-grid { width: 100%; border: none; margin-top: 40px; }
          .signature-grid td { text-align: center; padding-top: 40px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          ${data.header?.logo ? `<div style="margin-bottom: 10px;"><img src="${data.header.logo}" height="40" /></div>` : ''}
          <h1>${institutionName}</h1>
          <p>${details}</p>
          <p>${address}</p>
          <p style="font-weight: bold; margin-top: 8px; background: #f9f7fa; padding: 4px 12px; display: inline-block; border-radius: 4px;">${headerText}</p>
          <h2 style="font-size: 13pt; margin-top: 12px; color: #7B337E;">EVENT REPORT - ${departmentName}</h2>
        </div>

        <div class="section-title">Event Identity</div>
        <table>
          <tr>
            <th style="width: 25%;">Event Title</th>
            <td colspan="3" style="font-weight: bold;">${data.title || 'Untitled Event'}</td>
          </tr>
          <tr>
            <th>Department</th>
            <td style="width: 25%;">${data.department || '-'}</td>
            <th style="width: 25%;">Organizing Body</th>
            <td style="width: 25%;">${data.organizingBody || '-'}</td>
          </tr>
          <tr>
            <th>Date</th>
            <td>${data.startDate || '-'} to ${data.endDate || '-'}</td>
            <th>Venue</th>
            <td>${data.venue || '-'}</td>
          </tr>
          <tr>
            <th>Collaboration</th>
            <td colspan="3">${data.collaboration || 'None'}</td>
          </tr>
        </table>

        <div class="section-title">Event Objectives & Purpose</div>
        <p style="text-align: justify;">${data.purpose || 'No details provided.'}</p>

        <div class="section-title">Resource Persons Profile</div>
        <table>
          <thead>
            <tr style="background: #f9f7fa;">
              <th style="width: 8%;">S.No</th>
              <th style="width: 32%;">Name</th>
              <th style="width: 30%;">Designation</th>
              <th style="width: 30%;">Organization</th>
            </tr>
          </thead>
          <tbody>
            ${rps || '<tr><td colspan="4" style="text-align: center;">No speakers listed.</td></tr>'}
          </tbody>
        </table>

        <div class="section-title">Participation Statistics</div>
        <table>
          <thead>
            <tr style="background: #f9f7fa;">
              <th>Category</th>
              <th style="text-align: center;">Faculty Count</th>
              <th style="text-align: center;">Student Count</th>
              <th style="text-align: center;">External Participants</th>
              <th style="text-align: center; background: #e8d9e8;">Total Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: bold;">Count</td>
              <td style="text-align: center;">${data.participantCount.facultyCount}</td>
              <td style="text-align: center;">${data.participantCount.studentCount}</td>
              <td style="text-align: center;">${data.participantCount.externalCount}</td>
              <td style="text-align: center; font-weight: bold; background: #f9f7fa;">${data.participantCount.total}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Detailed Event Summary</div>
        <ul>
          ${summaries || '<li>No summary details provided.</li>'}
        </ul>

        <div class="section-title">Key Program Outcomes</div>
        <ul>
          ${outcomes || '<li>No outcomes provided.</li>'}
        </ul>

        <table class="signature-grid">
          <tr>
            ${sigCells || '<td style="border: none; text-align: center;">No signatures required.</td>'}
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'event-report'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
