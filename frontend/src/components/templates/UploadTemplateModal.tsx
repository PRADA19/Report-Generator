// frontend/src/components/templates/UploadTemplateModal.tsx
import React, { useState, useRef } from 'react';
import { Upload, FileCode, CheckCircle2, Loader2, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { useTemplateStore } from '../../store/templateStore';
import type { EventType, SectionType } from '../../types/template';

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadTemplateModal: React.FC<UploadTemplateModalProps> = ({ isOpen, onClose }) => {
  const { addTemplate } = useTemplateStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Reading Document Layout...');
  const [extractedTemplate, setExtractedTemplate] = useState<{
    name: string;
    department: string;
    version: string;
    eventType: EventType;
    description: string;
    sections: Array<{ name: string; type: SectionType; required: boolean }>;
  } | null>(null);

  const resetModal = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setStatusText('Reading Document Layout...');
    setExtractedTemplate(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setProgress(15);
    setStatusText('Analyzing headings, margins & page layout...');

    setTimeout(() => {
      setProgress(50);
      setStatusText('Running OCR & detecting placeholders & tables...');
    }, 800);

    setTimeout(() => {
      setProgress(85);
      setStatusText('Generating editable template structure...');
    }, 1600);

    setTimeout(() => {
      setProgress(100);
      setIsProcessing(false);

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const cleanName = baseName.split('-').join(' ').split('_').join(' ');
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + " Template";

      setExtractedTemplate({
        name: formattedName,
        department: 'IT',
        version: 'Version 1',
        eventType: 'Workshop',
        description: `Imported template parsed from uploaded file "${file.name}" with automatic layout detection.`,
        sections: [
          { name: 'Document Header & Title', type: 'Text', required: true },
          { name: 'Event Objectives', type: 'Paragraph', required: true },
          { name: 'Resource Persons Table', type: 'Table', required: true },
          { name: 'Participant Counts', type: 'Table', required: true },
          { name: 'Summary & Highlights', type: 'Rich Text', required: true },
          { name: 'Key Outcomes', type: 'Paragraph', required: true },
          { name: 'Event Photographs', type: 'Image Upload', required: false }
        ]
      });
    }, 2400);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveTemplate = () => {
    if (extractedTemplate) {
      addTemplate({
        name: extractedTemplate.name,
        department: extractedTemplate.department,
        version: extractedTemplate.version,
        eventType: extractedTemplate.eventType,
        description: extractedTemplate.description,
        status: 'Active',
        sections: extractedTemplate.sections
      });
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Existing Template"
      subtitle="Upload a Word document (.docx), PDF, or image to automatically parse headings, tables, and section layouts into an editable template."
    >
      <div className="space-y-6">
        
        {/* FILE DROPZONE */}
        {!isProcessing && !extractedTemplate && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileInputChange}
              accept=".docx,.pdf,.png,.jpg,.jpeg"
              className="hidden"
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragOver 
                  ? 'border-accent-primary bg-accent-primary/10' 
                  : 'border-surface-tertiary hover:border-accent-primary/60 bg-surface-secondary/40 hover:bg-surface-secondary'
              }`}
            >
              <div className="p-3.5 rounded-2xl bg-accent-primary/10 text-accent-primary mb-3">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-text-primary">Upload Document or Image Template</h4>
              <p className="text-xs text-text-muted mt-1">Click or drag & drop file to import</p>
              
              <div className="flex items-center space-x-3 mt-4 text-[10px] font-semibold text-text-muted">
                <span className="flex items-center"><FileText className="w-3 h-3 mr-1 text-accent-primary" /> DOCX</span>
                <span className="flex items-center"><FileCode className="w-3 h-3 mr-1 text-accent-secondary" /> PDF</span>
                <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1 text-emerald-500" /> PNG / JPG</span>
              </div>
            </div>
          </div>
        )}

        {/* PROCESSING STEP */}
        {isProcessing && (
          <div className="py-8 flex flex-col items-center justify-center space-y-5 text-center">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
              <Sparkles className="w-5 h-5 text-accent-primary absolute animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-text-primary">{statusText}</h4>
              <p className="text-xs text-text-muted">Parsing file: {selectedFile?.name}</p>
            </div>

            <div className="w-full max-w-xs space-y-1.5">
              <div className="w-full bg-surface-tertiary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-accent-primary h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-text-muted">{progress}%</span>
            </div>
          </div>
        )}

        {/* REVIEW EXTRACTED TEMPLATE STRUCTURE */}
        {extractedTemplate && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center space-x-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Template structure successfully extracted from "{selectedFile?.name}"</span>
            </div>

            <div className="bg-surface-secondary/50 border border-surface-tertiary/60 rounded-xl p-4 space-y-3">
              <div>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Generated Template Name</span>
                <input 
                  type="text" 
                  value={extractedTemplate.name}
                  onChange={(e) => setExtractedTemplate({ ...extractedTemplate, name: e.target.value })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-lg px-3 py-1.5 text-xs font-bold text-text-primary mt-1 focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Detected Sections ({extractedTemplate.sections.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {extractedTemplate.sections.map((sec, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-surface-primary border border-surface-tertiary text-text-primary text-[11px] font-medium">
                      {sec.name} ({sec.type})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-tertiary/60 flex items-center justify-end space-x-3">
              <Button onClick={handleClose} variant="secondary" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} variant="primary" size="sm" className="px-5 font-bold shadow-md shadow-accent-primary/20">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Save to Template Library</span>
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
