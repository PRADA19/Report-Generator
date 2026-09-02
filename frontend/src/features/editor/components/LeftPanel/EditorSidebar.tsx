import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { 
  Award, 
  Calendar, 
  Users, 
  BookOpen, 
  ListOrdered, 
  Camera, 
  FileText, 
  Plus, 
  Trash, 
  Trash2,
  Upload, 
  Sliders, 
  Type, 
  Sparkles, 
  RotateCcw,
  RefreshCw,
  Space,
  Maximize,
  Palette,
  LayoutList
} from 'lucide-react';
import { AiAutofillModal } from '../../../../components/editor/AiAutofillModal';
import type { HeaderConfig } from '../../../../types/editor';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { Button } from '../../../../components/ui/Button';
import { Select } from '../../../../components/ui/Select';
import { EditorAccordionSection } from './EditorAccordionSection';
import { SectionList } from './SectionList';
import { PhotoLayoutModal } from './PhotoLayoutModal';

export const EditorSidebar: React.FC = () => {
  const {
    data,
    styling,
    updateDataField,
    updateStyling,
    updateMargins,
    templateId,
    resetToTemplateDefaults,
    addResourcePerson,
    removeResourcePerson,
    updateResourcePerson,
    addSummaryPoint,
    removeSummaryPoint,
    updateSummaryPoint,
    addImage,
    updateImage,
    removeImage,
    layoutLocked,
    layoutConfig,
    loadSavedState
  } = useEditorStore();

  // Accordion State: Default 'identity' is open, all others collapsed
  const [openSection, setOpenSection] = useState<string>('identity');

  // Signatures configuration mapped from the store state
  const sigs = data.signatures || { coordinator: true, hod: true, iqac: true, principal: true };
  const updateSignature = (field: 'hod' | 'iqac' | 'principal' | 'coordinator', checked: boolean) => {
    updateDataField('signatures', {
      ...sigs,
      [field]: checked
    });
  };

  // Header configuration mapped from the store state
  const headerConfig = data.header || {
    institutionName: "KPR College of Arts Science and Research",
    department: data.department || "",
    logo: "",
    details: "(Affiliated to Bharathiar University, Coimbatore)",
    address: "Avinashi Road, Arasur, Coimbatore – 641 407",
    text: "Quality System Document"
  };
  const updateHeaderField = (field: string, val: string) => {
    updateDataField('header', {
      ...headerConfig,
      [field]: val
    });
  };

  // Footer configuration mapped from the store state
  const footerConfig = data.footer || {
    pageNumber: true,
    contact: "KPRCAS Head Office",
    text: "IQAC Accredited Report"
  };
  const updateFooterField = (field: string, val: any) => {
    updateDataField('footer', {
      ...footerConfig,
      [field]: val
    });
  };

  // AI Autofill State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const handleResetOrder = () => {
    if (layoutLocked) return;
    loadSavedState({
      templateId,
      data,
      styling,
      layoutConfig,
      sections: [
        { id: 'header', title: 'Header Information', visible: true, order: 0 },
        { id: 'purpose', title: 'Event Objective & Purpose', visible: true, order: 1 },
        { id: 'resource_persons', title: 'Resource Persons Profile', visible: true, order: 2 },
        { id: 'participants', title: 'Participation Statistics', visible: true, order: 3 },
        { id: 'summary', title: 'Detailed Event Summary', visible: true, order: 4 },
        { id: 'outcomes', title: 'Key Program Outcomes', visible: true, order: 5 },
        { id: 'images', title: 'Geo-tagged Event Photographs', visible: true, order: 6 }
      ],
      layoutLocked: false
    });
  };

  const layoutTitle = (
    <span className="text-[10px] font-black uppercase tracking-wider text-text-primary whitespace-nowrap">Structure & Layout</span>
  );

  // Mock Event type state
  const [eventType, setEventType] = useState<string>('Workshop');

  const handleToggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? '' : section);
  };

  // Auto-pop layout selection modal when photograph count increases to 2 or more
  const prevPhotoCountRef = useRef(data.images.length);
  useEffect(() => {
    if (data.images.length >= 2 && data.images.length !== prevPhotoCountRef.current) {
      setIsPhotoModalOpen(true);
    }
    prevPhotoCountRef.current = data.images.length;
  }, [data.images.length]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      const readPromises = fileList.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            }
          };
          reader.readAsDataURL(file);
        });
      });

      const urls = await Promise.all(readPromises);
      urls.forEach(url => addImage(url));

      const updatedTotal = data.images.length + urls.length;
      if (updatedTotal >= 2) {
        setIsPhotoModalOpen(true);
      }
    }
    e.target.value = '';
  };

  const handleParticipantChange = (field: 'facultyCount' | 'studentCount' | 'externalCount', val: number) => {
    const currentCounts = { ...data.participantCount, [field]: val };
    const total = currentCounts.facultyCount + currentCounts.studentCount + currentCounts.externalCount;
    updateDataField('participantCount', { ...currentCounts, total });
  };

  const fontOptions = [
    'Times New Roman',
    'Georgia',
    'Cambria',
    'Garamond',
    'Baskerville',
    'Inter',
    'Poppins',
    'Roboto',
    'Open Sans',
    'Source Sans Pro',
    'Book Antiqua',
    'Palatino Linotype',
    'Century Schoolbook',
    'Constantia'
  ];
  const labelClasses = "text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block mb-1.5";


  const handleResetStylingDefaults = () => {
    updateStyling({
      fontFamily: 'Inter',
      fontSizeBase: 10.5,
      primaryColor: '#1e1b4b',
      textColor: '#1e293b',
      lineHeight: 1.5,
      paragraphSpacing: 8,
      sectionSpacing: 18,
      pageLayout: {
        pageSize: 'A4',
        margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
        orientation: 'portrait'
      }
    });
  };

  const handleFullDraftReset = () => {
    const confirmReset = window.confirm("Are you sure you want to reset all data, layout, and styling to template defaults?");
    if (confirmReset) {
      resetToTemplateDefaults();
    }
  };

  const inlineInputClasses = "w-full bg-surface-primary border border-surface-tertiary rounded-[12px] p-2 text-center text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all font-semibold";

  return (
    <div className="flex flex-col space-y-5 p-4 bg-surface-primary min-h-screen theme-transition">
      
      {/* ✨ Auto Fill Panel */}
      <div className="smart-card bg-gradient-to-br from-accent-secondary/10 to-transparent border border-accent-primary/20 mb-2">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
            Auto Fill from Event Poster
          </h4>
        </div>

        <div 
          onClick={() => setIsAiModalOpen(true)}
          className="border border-dashed border-surface-tertiary hover:border-accent-primary/60 bg-surface-primary rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 group"
        >
          <Upload className="w-5 h-5 text-accent-primary mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold text-text-secondary">Upload Flyer Poster (PNG, JPG, PDF)</span>
          <span className="text-[9px] text-text-muted mt-0.5">Let Auto Fill read poster details</span>
        </div>

        <AiAutofillModal 
          isOpen={isAiModalOpen} 
          onClose={() => setIsAiModalOpen(false)} 
        />
      </div>

      {/* Accordion Form Sections Container */}
      <div className="flex flex-col">

        {/* 1. EVENT IDENTITY */}
        <EditorAccordionSection 
          id="identity"
          title="Event Identity"
          icon={Award}
          isOpen={openSection === 'identity'}
          onToggle={() => handleToggleSection('identity')}
        >
          <Textarea
            label="Event Title"
            value={data.title}
            onChange={(e) => updateDataField('title', e.target.value)}
            className="resize-y min-h-[72px]"
            placeholder="e.g. Guest Lecture on Cloud Infrastructure Security"
          />

          {/* Institution Logo Image Upload */}
          <div className="space-y-1 pt-2 border-t border-surface-tertiary/40 mt-3">
            <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block mb-1">
              Top Institution Logo
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const url = URL.createObjectURL(file);
                    updateDataField('header', {
                      institutionName: data.header?.institutionName || "KPR College of Arts Science and Research",
                      department: data.header?.department || data.department || "",
                      details: data.header?.details || "",
                      address: data.header?.address || "",
                      text: data.header?.text || "",
                      logo: url
                    });
                  }
                }}
                className="text-xs text-text-muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-accent-primary/10 file:text-accent-primary hover:file:bg-accent-primary/20 cursor-pointer"
              />
              {data.header?.logo && (
                <button
                  type="button"
                  onClick={() => updateDataField('header', {
                    institutionName: data.header?.institutionName || "KPR College of Arts Science and Research",
                    department: data.header?.department || data.department || "",
                    details: data.header?.details || "",
                    address: data.header?.address || "",
                    text: data.header?.text || "",
                    logo: ''
                  })}
                  className="text-[10px] text-red-500 hover:underline font-semibold"
                >
                  Reset Logo
                </button>
              )}
            </div>
          </div>
        </EditorAccordionSection>

        {/* LOGO OPTIONS ACCORDION */}
        <EditorAccordionSection 
          id="logo"
          title="Logo Options"
          icon={Maximize}
          isOpen={openSection === 'logo'}
          onToggle={() => handleToggleSection('logo')}
        >
          <div className="space-y-3">
            {/* Active Logo Display & Preview */}
            <div className="flex flex-col items-center justify-center p-3 bg-surface-primary border border-surface-tertiary rounded-xl relative group">
              <span className="text-[9px] font-bold text-text-secondary uppercase mb-2">Active Institution Logo</span>
              <div className="h-16 flex items-center justify-center p-1 bg-white rounded border border-slate-200 w-full">
                <img 
                  src={data.header?.logo || '/kprcas_logo.png'} 
                  alt="Active Logo" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="text-[9px] text-text-muted mt-1 font-mono">
                {data.header?.logo && data.header.logo !== '/kprcas_logo.png' ? 'Custom Uploaded Logo' : 'Default (Learn Beyond)'}
              </span>
            </div>

            {/* Upload & Reset Buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const url = URL.createObjectURL(file);
                    updateDataField('header', {
                      institutionName: "KPR College of Arts Science and Research",
                      department: "School of Computing Science",
                      logo: url,
                      ...data.header
                    } as HeaderConfig);
                  }
                }}
                className="hidden"
                id="sidebar-logo-upload-input"
              />
              <label 
                htmlFor="sidebar-logo-upload-input"
                className="flex-1 py-1.5 px-2 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary font-bold text-[10px] rounded-xl text-center cursor-pointer border border-accent-primary/20 transition-all flex items-center justify-center space-x-1"
              >
                <Upload className="w-3 h-3" />
                <span>Upload New Logo</span>
              </label>

              <button
                type="button"
                onClick={() => updateDataField('header', {
                  institutionName: "KPR College of Arts Science and Research",
                  department: "School of Computing Science",
                  ...data.header,
                  logo: '/kprcas_logo.png'
                } as HeaderConfig)}
                className="py-1.5 px-2 bg-surface-tertiary hover:bg-surface-secondary text-text-secondary font-bold text-[10px] rounded-xl text-center border border-surface-tertiary transition-all"
              >
                Reset Default
              </button>
            </div>

            {/* Dimensions Sliders */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-tertiary">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                  <span>Width</span>
                  <span className="font-mono text-text-primary">{styling.logoWidthPx || 120}px</span>
                </div>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={styling.logoWidthPx || 120}
                  onChange={(e) => updateStyling({ logoWidthPx: parseInt(e.target.value) || 120 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                  <span>Height</span>
                  <span className="font-mono text-text-primary">{styling.logoHeightPx || 50}px</span>
                </div>
                <input
                  type="number"
                  min="20"
                  max="200"
                  value={styling.logoHeightPx || 50}
                  onChange={(e) => updateStyling({ logoHeightPx: parseInt(e.target.value) || 50 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary"
                />
              </div>
            </div>

            {/* Position Alignment Buttons */}
            <div className="space-y-1.5 pt-1 border-t border-surface-tertiary">
              <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Logo Alignment</label>
              <div className="flex bg-bg-secondary p-1 rounded-xl border border-surface-tertiary">
                <button
                  type="button"
                  onClick={() => updateStyling({ logoPosition: 'left' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    (styling.logoPosition || 'left') === 'left' 
                      ? 'bg-surface-primary text-text-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => updateStyling({ logoPosition: 'center' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    styling.logoPosition === 'center' 
                      ? 'bg-surface-primary text-text-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => updateStyling({ logoPosition: 'right' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    styling.logoPosition === 'right' 
                      ? 'bg-surface-primary text-text-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Right
                </button>
              </div>
            </div>
          </div>
        </EditorAccordionSection>

        {/* 2. STRUCTURE & LAYOUT */}
        <EditorAccordionSection
          id="layout"
          title="Structure & Layout"
          icon={Sliders}
          isOpen={openSection === 'layout'}
          onToggle={() => handleToggleSection('layout')}
          customTitle={layoutTitle}
        >
          {/* Section reorder & lock controls */}
          <div className="space-y-4 mb-4 pb-4 border-b border-surface-tertiary/50">
            <SectionList />
          </div>

          {/* Typography Controls */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Type className="w-3.5 h-3.5 text-accent-primary" />
              <span>Typography</span>
            </h4>

            <div className="smart-card space-y-3">
              {/* Font Family */}
              <Select
                label="Font Family"
                value={styling.fontFamily}
                onChange={(e) => updateStyling({ fontFamily: e.target.value as any })}
              >
                {fontOptions.map(font => (
                  <option key={font} value={font} className="bg-surface-primary text-text-primary">{font}</option>
                ))}
              </Select>

              {/* Base Font Size */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClasses}>Base Font Size</label>
                  <span className="text-[10px] font-mono font-bold text-text-primary">{styling.fontSizeBase}pt</span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="14"
                  step="0.5"
                  value={styling.fontSizeBase}
                  onChange={(e) => updateStyling({ fontSizeBase: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>

              {/* Line Height */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClasses}>Line Spacing</label>
                  <span className="text-[10px] font-mono font-bold text-text-primary">{styling.lineHeight}</span>
                </div>
                <input
                  type="range"
                  min="1.1"
                  max="1.8"
                  step="0.05"
                  value={styling.lineHeight}
                  onChange={(e) => updateStyling({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="space-y-3 pt-3 border-t border-surface-tertiary">
            <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Space className="w-3.5 h-3.5 text-accent-primary" />
              <span>Paragraph & Section Spacing</span>
            </h4>

            <div className="smart-card space-y-3">
              {/* Paragraph spacing */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClasses}>Paragraph Gap</label>
                  <span className="text-[10px] font-mono font-bold text-text-primary">{styling.paragraphSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  value={styling.paragraphSpacing}
                  onChange={(e) => updateStyling({ paragraphSpacing: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>

              {/* Section Spacing */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClasses}>Section Gap</label>
                  <span className="text-[10px] font-mono font-bold text-text-primary">{styling.sectionSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  value={styling.sectionSpacing}
                  onChange={(e) => updateStyling({ sectionSpacing: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-3 pt-3 border-t border-surface-tertiary">
            <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Maximize className="w-3.5 h-3.5 text-accent-primary" />
              <span>Margins (mm)</span>
            </h4>

            <div className="smart-card grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-secondary text-center block uppercase tracking-wider">Top</label>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={styling.pageLayout.margins.top}
                  onChange={(e) => updateMargins({ top: parseInt(e.target.value) || 10 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-secondary text-center block uppercase tracking-wider">Bottom</label>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={styling.pageLayout.margins.bottom}
                  onChange={(e) => updateMargins({ bottom: parseInt(e.target.value) || 10 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-secondary text-center block uppercase tracking-wider">Left</label>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={styling.pageLayout.margins.left}
                  onChange={(e) => updateMargins({ left: parseInt(e.target.value) || 10 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-secondary text-center block uppercase tracking-wider">Right</label>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={styling.pageLayout.margins.right}
                  onChange={(e) => updateMargins({ right: parseInt(e.target.value) || 10 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Theme Accents */}
          <div className="space-y-3 pt-3 border-t border-surface-tertiary">
            <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-accent-primary" />
              <span>Theme Accents</span>
            </h4>

            <div className="smart-card space-y-3">
              <div className="space-y-1.5">
                <label className={labelClasses}>Primary Document Accent</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={styling.primaryColor}
                    onChange={(e) => updateStyling({ primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-xl border border-surface-tertiary bg-transparent cursor-pointer flex-shrink-0"
                  />
                  <Input
                    type="text"
                    value={styling.primaryColor}
                    onChange={(e) => updateStyling({ primaryColor: e.target.value })}
                    className="text-center font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>Page Orientation</label>
                <div className="flex bg-bg-secondary p-1 rounded-xl border border-surface-tertiary">
                  <button
                    type="button"
                    onClick={() => updateStyling({ pageLayout: { ...styling.pageLayout, orientation: 'portrait' } })}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      styling.pageLayout.orientation === 'portrait' 
                        ? 'bg-surface-primary text-text-primary shadow-sm' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStyling({ pageLayout: { ...styling.pageLayout, orientation: 'landscape' } })}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      styling.pageLayout.orientation === 'landscape' 
                        ? 'bg-surface-primary text-text-primary shadow-sm' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>
            </div>
          </div>
        </EditorAccordionSection>

        {/* 3. HEADER */}
        <EditorAccordionSection
          id="headers"
          title="Header Options"
          icon={LayoutList}
          isOpen={openSection === 'headers'}
          onToggle={() => handleToggleSection('headers')}
        >
          <div className="space-y-4">
            <Input
              label="Institution Name"
              type="text"
              value={headerConfig.institutionName}
              onChange={(e) => updateHeaderField('institutionName', e.target.value)}
              placeholder="e.g. KPR College of Arts Science and Research"
            />
            <Input
              label="Header Title / Document Title"
              type="text"
              value={headerConfig.documentTitle || headerConfig.text || ''}
              onChange={(e) => {
                updateHeaderField('documentTitle', e.target.value);
                updateHeaderField('text', e.target.value);
              }}
              placeholder="e.g. Quality System Document"
            />
            <Input
              label="Header Sub-Title / Report Title"
              type="text"
              value={headerConfig.reportTitle || ''}
              onChange={(e) => updateHeaderField('reportTitle', e.target.value)}
              placeholder="e.g. Report of the Event"
            />
            <Input
              label="Sub-header / Affiliation Details"
              type="text"
              value={headerConfig.details || ''}
              onChange={(e) => updateHeaderField('details', e.target.value)}
              placeholder="e.g. (Affiliated to Bharathiar University, Coimbatore)"
            />
            <Input
              label="Institution Address"
              type="text"
              value={headerConfig.address || ''}
              onChange={(e) => updateHeaderField('address', e.target.value)}
              placeholder="e.g. Avinashi Road, Arasur, Coimbatore - 641407"
            />
            <Input
              label="Logo URL / Base64"
              type="text"
              value={headerConfig.logo || ''}
              onChange={(e) => updateHeaderField('logo', e.target.value)}
              placeholder="Paste logo URL or Base64 data"
            />
            <div className="border-t border-surface-tertiary/60 pt-3 space-y-4">
              <Input
                label="Department Name"
                type="text"
                value={data.department}
                onChange={(e) => {
                  updateDataField('department', e.target.value);
                  updateHeaderField('department', e.target.value);
                }}
                placeholder="e.g. Department of Information Technology"
              />
              <Input
                label="Organizing Body"
                type="text"
                value={data.organizingBody}
                onChange={(e) => updateDataField('organizingBody', e.target.value)}
                placeholder="e.g. Association of Information Technology"
              />
              <Input
                label="Collaboration / Sponsors"
                type="text"
                value={data.collaboration}
                onChange={(e) => updateDataField('collaboration', e.target.value)}
                placeholder="e.g. IEEE / ACM Chapter"
              />
            </div>
          </div>
        </EditorAccordionSection>

        {/* 4. RESET */}
        <EditorAccordionSection
          id="reset"
          title="Reset"
          icon={RotateCcw}
          isOpen={openSection === 'reset'}
          onToggle={() => handleToggleSection('reset')}
        >
          <div className="smart-card space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">
                Section Order
              </span>
              <p className="text-[10px] text-text-muted">
                Reset template section order to default sequence.
              </p>
              <Button
                type="button"
                onClick={handleResetOrder}
                variant="secondary"
                className="w-full text-xs py-2 mt-1 rounded-xl flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Section Order</span>
              </Button>
            </div>

            <div className="space-y-1 pt-2 border-t border-surface-tertiary/50">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">
                Styling & Layout
              </span>
              <p className="text-[10px] text-text-muted">
                Reset margins, typography, spacing and colors to defaults.
              </p>
              <Button
                type="button"
                onClick={handleResetStylingDefaults}
                variant="secondary"
                className="w-full text-xs py-2 mt-1 rounded-xl flex items-center justify-center space-x-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Reset Styling Defaults</span>
              </Button>
            </div>

            <div className="space-y-1 pt-2 border-t border-surface-tertiary/50">
              <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block">
                Entire Draft
              </span>
              <p className="text-[10px] text-text-muted">
                Reset all form contents, uploaded images and styling to initial state.
              </p>
              <Button
                type="button"
                onClick={handleFullDraftReset}
                variant="danger"
                className="w-full text-xs py-2 mt-1 rounded-xl flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Full Draft</span>
              </Button>
            </div>
          </div>
        </EditorAccordionSection>

        {/* 5. DATE & VENUE */}
        <EditorAccordionSection 
          id="schedule"
          title="Date & Venue"
          icon={Calendar}
          isOpen={openSection === 'schedule'}
          onToggle={() => handleToggleSection('schedule')}
        >
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

          <Input
            label="Event Time"
            type="text"
            value={data.time || ''}
            onChange={(e) => updateDataField('time', e.target.value)}
            placeholder="e.g. 10:00 AM to 04:30 PM"
          />

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block mb-1">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="FDP">FDP (Faculty Development Program)</option>
              <option value="Guest Lecture">Guest Lecture</option>
              <option value="Symposium">Symposium</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Placement Drive">Placement Drive</option>
              <option value="Industrial Visit">Industrial Visit</option>
              <option value="Conference">Conference</option>
              <option value="Alumni Meet">Alumni Meet</option>
            </select>
          </div>
        </EditorAccordionSection>

        {/* 3. RESOURCE PERSONS */}
        <EditorAccordionSection 
          id="speakers"
          title="Resource Persons"
          icon={Users}
          isOpen={openSection === 'speakers'}
          onToggle={() => handleToggleSection('speakers')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted font-bold tracking-wide uppercase">Speakers Profile</span>
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
              <div key={idx} className="bg-surface-primary border border-surface-tertiary rounded-2xl p-3.5 relative group hover:shadow-sm transition-all duration-200 theme-transition">
                <Button
                  onClick={() => removeResourcePerson(idx)}
                  variant="danger"
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove speaker"
                >
                  <Trash className="w-3.5 h-3.5" />
                </Button>

                <div className="space-y-3">
                  <span className="text-[9px] text-text-muted font-bold tracking-wide uppercase block">Speaker #{idx + 1}</span>
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
                  <Input
                    placeholder="Contact Email / Phone (Optional)"
                    type="text"
                  />
                </div>
              </div>
            ))}
          </div>
        </EditorAccordionSection>

        {/* 4. OBJECTIVES */}
        <EditorAccordionSection 
          id="objectives"
          title="Objectives"
          icon={BookOpen}
          isOpen={openSection === 'objectives'}
          onToggle={() => handleToggleSection('objectives')}
        >
          <Textarea
            label="Purpose of Event"
            value={data.purpose}
            onChange={(e) => updateDataField('purpose', e.target.value)}
            className="resize-y min-h-[90px]"
            placeholder="State the background purpose and targeted IQAC guidelines..."
          />

          <Textarea
            label="Objective Description"
            value={data.objectiveDescription || ''}
            onChange={(e) => updateDataField('objectiveDescription', e.target.value)}
            placeholder="Detail event specific targets and goals..."
            className="resize-y min-h-[72px]"
          />
        </EditorAccordionSection>

        {/* 5. SUMMARY BULLET POINTS */}
        <EditorAccordionSection 
          id="summary"
          title="Event Summary & Highlights"
          icon={ListOrdered}
          isOpen={openSection === 'summary'}
          onToggle={() => handleToggleSection('summary')}
        >
          <div className="space-y-4">
            <Textarea
              label="Chronological Event Summary"
              value={data.eventSummary || ''}
              onChange={(e) => updateDataField('eventSummary', e.target.value)}
              className="resize-y min-h-[90px]"
              placeholder="Provide a chronological description of the event..."
            />

            <div className="flex items-center justify-between border-t border-surface-tertiary/60 pt-3">
              <span className="text-[10px] text-text-muted font-bold tracking-wide uppercase">Highlights Bullet Points</span>
              <Button
                onClick={addSummaryPoint}
                size="sm"
                className="p-1.5 rounded-xl text-text-primary"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-3">
              {data.summaryPoints.map((pt, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-surface-primary border border-surface-tertiary p-2 rounded-2xl relative group hover:shadow-sm transition-all duration-200 theme-transition">
                  <span className="text-[10px] text-text-muted font-mono mt-3 ml-1 flex-shrink-0">#{idx + 1}</span>
                  <Textarea
                    value={pt}
                    onChange={(e) => updateSummaryPoint(idx, e.target.value)}
                    placeholder="Detail bullet point..."
                    className="flex-1 bg-surface-primary min-h-[50px] text-xs p-1"
                  />
                  <Button
                    onClick={() => removeSummaryPoint(idx)}
                    variant="danger"
                    className="p-2 rounded-xl mt-1 flex-shrink-0"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </EditorAccordionSection>

        {/* 8. EVENT PHOTOGRAPHS */}
        <EditorAccordionSection 
          id="photos"
          title="Event Photographs"
          icon={Camera}
          isOpen={openSection === 'photos'}
          onToggle={() => handleToggleSection('photos')}
        >
          {/* File input (invisible) */}
          <input 
            type="file" 
            ref={imageUploadRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Upload & Choose Layout Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => imageUploadRef.current?.click()}
              className="w-full flex flex-col items-center justify-center border border-dashed border-surface-tertiary hover:border-accent-primary bg-surface-primary rounded-2xl p-3.5 hover:bg-surface-secondary transition-all cursor-pointer group shadow-sm text-center"
            >
              <Upload className="w-4 h-4 text-accent-primary mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-text-primary">Upload Event Photo</span>
              <span className="text-[9px] text-text-muted mt-0.5">Geo-tagged A4 prints | Max 5MB</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="w-full py-2 px-3 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary font-bold text-xs rounded-xl text-center border border-accent-primary/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
              <span>Choose Photo Layout ({data.images.length} photos)</span>
            </button>
          </div>

          <PhotoLayoutModal
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
          />

          <div className="space-y-4 mt-2">
            {data.images.map((img) => (
              <div 
                key={img.id} 
                className="smart-card relative focus-within:ring-2 focus-within:ring-accent-primary group hover:shadow-lg transition-all duration-300 p-3"
              >
                {/* Image display */}
                <div className="relative h-32 bg-surface-primary rounded-lg overflow-hidden flex items-center justify-center p-1.5 border border-surface-tertiary">
                  <img 
                    src={img.url} 
                    alt="Event photograph preview" 
                    className="max-h-full max-w-full rounded object-contain"
                  />
                  <Button
                    onClick={() => removeImage(img.id)}
                    variant="danger"
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-2.5 mt-2">
                  {/* Caption Input */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wide flex items-center space-x-1.5">
                      <Type className="w-3 h-3 text-text-muted" />
                      <span>Geo-tag Caption</span>
                    </span>
                    <Input
                      value={img.caption}
                      onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                      placeholder="e.g. Workshop Session 1 - Introduction"
                      className="p-1.5 text-xs"
                    />
                  </div>

                  {/* Independent Photo Size Controls */}
                  <div className="space-y-2 bg-surface-primary p-2.5 rounded-xl border border-surface-tertiary">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Photo Size Presets</span>
                      <button 
                        type="button"
                        onClick={() => updateImage(img.id, { widthPercent: 100, heightPx: 160 })}
                        className="text-[9px] text-accent-primary hover:underline font-bold"
                      >
                        Reset Size
                      </button>
                    </div>

                    {/* Presets: Small, Medium, Large */}
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => updateImage(img.id, { widthPercent: 40, heightPx: 120 })}
                        className={`py-1 text-[9px] font-bold rounded-lg border transition-all ${
                          img.widthPercent === 40 
                            ? 'bg-accent-primary text-white border-accent-primary shadow-sm' 
                            : 'bg-surface-primary text-text-secondary border-surface-tertiary hover:border-accent-primary/50'
                        }`}
                      >
                        Small (40%)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateImage(img.id, { widthPercent: 70, heightPx: 160 })}
                        className={`py-1 text-[9px] font-bold rounded-lg border transition-all ${
                          img.widthPercent === 70 
                            ? 'bg-accent-primary text-white border-accent-primary shadow-sm' 
                            : 'bg-surface-primary text-text-secondary border-surface-tertiary hover:border-accent-primary/50'
                        }`}
                      >
                        Medium (70%)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateImage(img.id, { widthPercent: 100, heightPx: 220 })}
                        className={`py-1 text-[9px] font-bold rounded-lg border transition-all ${
                          img.widthPercent === 100 
                            ? 'bg-accent-primary text-white border-accent-primary shadow-sm' 
                            : 'bg-surface-primary text-text-secondary border-surface-tertiary hover:border-accent-primary/50'
                        }`}
                      >
                        Large (100%)
                      </button>
                    </div>

                    {/* Width Scale Slider & Step [-] / [+] */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary">
                        <span className="flex items-center space-x-1">
                          <Sliders className="w-3 h-3 text-text-muted" />
                          <span>Width Scale</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          <button 
                            type="button"
                            onClick={() => updateImage(img.id, { widthPercent: Math.max(20, (img.widthPercent || 100) - 10) })}
                            className="px-1.5 py-0.5 rounded bg-surface-tertiary hover:bg-surface-secondary text-text-primary text-[10px] font-bold"
                            title="Decrease width"
                          >
                            -
                          </button>
                          <span className="font-mono text-text-primary w-8 text-center">{img.widthPercent || 100}%</span>
                          <button 
                            type="button"
                            onClick={() => updateImage(img.id, { widthPercent: Math.min(100, (img.widthPercent || 100) + 10) })}
                            className="px-1.5 py-0.5 rounded bg-surface-tertiary hover:bg-surface-secondary text-text-primary text-[10px] font-bold"
                            title="Increase width"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={img.widthPercent || 100}
                        onChange={(e) => updateImage(img.id, { widthPercent: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                      />
                    </div>

                    {/* Container Height Slider */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary">
                        <span>Height Box</span>
                        <span className="font-mono text-text-primary">{img.heightPx || 160}px</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="350"
                        step="10"
                        value={img.heightPx || 160}
                        onChange={(e) => updateImage(img.id, { heightPx: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </EditorAccordionSection>

        {/* 9. ATTENDANCE DETAILS */}
        <EditorAccordionSection 
          id="attendance"
          title="Attendance Details"
          icon={Users}
          isOpen={openSection === 'attendance'}
          onToggle={() => handleToggleSection('attendance')}
        >
          <div className="grid grid-cols-3 gap-3 bg-surface-primary border border-surface-tertiary p-3.5 rounded-2xl">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-secondary block text-center uppercase tracking-wide">Faculty</span>
              <input
                type="number"
                value={data.participantCount.facultyCount}
                onChange={(e) => handleParticipantChange('facultyCount', parseInt(e.target.value) || 0)}
                className={inlineInputClasses}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-secondary block text-center uppercase tracking-wide">Students</span>
              <input
                type="number"
                value={data.participantCount.studentCount}
                onChange={(e) => handleParticipantChange('studentCount', parseInt(e.target.value) || 0)}
                className={inlineInputClasses}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-secondary block text-center uppercase tracking-wide">External</span>
              <input
                type="number"
                value={data.participantCount.externalCount}
                onChange={(e) => handleParticipantChange('externalCount', parseInt(e.target.value) || 0)}
                className={inlineInputClasses}
              />
            </div>
            <div className="col-span-3 border-t border-surface-tertiary pt-2.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Total Attendees:</span>
              <span className="font-extrabold text-text-primary bg-surface-primary border border-surface-tertiary px-2 py-0.5 rounded-lg">
                {data.participantCount.total}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block mb-1">
              Attendance Percentage (%)
            </label>
            <Input 
              type="text"
              value={data.attendancePercentage || ''}
              onChange={(e) => updateDataField('attendancePercentage', e.target.value)}
              placeholder="e.g. 98.4%"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block mb-1">
              Participation Details Text
            </label>
            <Textarea
              value={data.participationDetails || ''}
              onChange={(e) => updateDataField('participationDetails', e.target.value)}
              placeholder="e.g. A total of 120 students from the Department of Information Technology actively participated in the event."
              className="resize-y min-h-[60px] text-xs"
            />
          </div>
        </EditorAccordionSection>

        {/* 9.5. FOOTER */}
        <EditorAccordionSection
          id="footer_settings"
          title="Footer"
          icon={FileText}
          isOpen={openSection === 'footer_settings'}
          onToggle={() => handleToggleSection('footer_settings')}
        >
          <div className="space-y-4">
            <Input
              label="Footer Contact Information"
              type="text"
              value={footerConfig.contact}
              onChange={(e) => updateFooterField('contact', e.target.value)}
              placeholder="e.g. KPRCAS Head Office"
            />
            <Input
              label="Footer Central Text"
              type="text"
              value={footerConfig.text || ''}
              onChange={(e) => updateFooterField('text', e.target.value)}
              placeholder="e.g. IQAC Accredited Report"
            />
            <label className="flex items-center space-x-2.5 bg-surface-primary hover:bg-surface-secondary border border-surface-tertiary p-2.5 rounded-xl text-[11px] font-semibold text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={footerConfig.pageNumber !== false}
                onChange={(e) => updateFooterField('pageNumber', e.target.checked)}
                className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary border-surface-tertiary cursor-pointer accent-accent-primary"
              />
              <span>Show Page Numbers</span>
            </label>
          </div>
        </EditorAccordionSection>

        {/* 10. SIGNATURES */}
        <EditorAccordionSection 
          id="signatures"
          title="Signatures"
          icon={FileText}
          isOpen={openSection === 'signatures'}
          onToggle={() => handleToggleSection('signatures')}
        >
          <div className="space-y-3">
            <span className="text-[10px] text-text-muted font-bold tracking-wide uppercase block">Signatory Layout Settings</span>
            
            <label className="flex items-center space-x-2.5 bg-surface-primary hover:bg-surface-secondary border border-surface-tertiary p-2.5 rounded-xl text-[11px] font-semibold text-text-secondary cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={sigs.coordinator !== false}
                onChange={(e) => updateSignature('coordinator', e.target.checked)}
                className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary border-surface-tertiary cursor-pointer accent-accent-primary"
              />
              <span>Signature of Coordinator</span>
            </label>

            <label className="flex items-center space-x-2.5 bg-surface-primary hover:bg-surface-secondary border border-surface-tertiary p-2.5 rounded-xl text-[11px] font-semibold text-text-secondary cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={sigs.hod !== false}
                onChange={(e) => updateSignature('hod', e.target.checked)}
                className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary border-surface-tertiary cursor-pointer accent-accent-primary"
              />
              <span>Signature of HOD</span>
            </label>

            <label className="flex items-center space-x-2.5 bg-surface-primary hover:bg-surface-secondary border border-surface-tertiary p-2.5 rounded-xl text-[11px] font-semibold text-text-secondary cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={sigs.iqac !== false}
                onChange={(e) => updateSignature('iqac', e.target.checked)}
                className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary border-surface-tertiary cursor-pointer accent-accent-primary"
              />
              <span>IQAC Coordinator</span>
            </label>

            <label className="flex items-center space-x-2.5 bg-surface-primary hover:bg-surface-secondary border border-surface-tertiary p-2.5 rounded-xl text-[11px] font-semibold text-text-secondary cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={sigs.principal !== false}
                onChange={(e) => updateSignature('principal', e.target.checked)}
                className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary border-surface-tertiary cursor-pointer accent-accent-primary"
              />
              <span>Signature of Principal</span>
            </label>
          </div>
        </EditorAccordionSection>

      </div>

    </div>
  );
};
export default EditorSidebar;
