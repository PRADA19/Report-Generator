// frontend/src/features/editor/components/RightPanel/StylePanel.tsx
import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Type, Space, Palette, Maximize, RotateCcw, LayoutList, Sliders, RefreshCw } from 'lucide-react';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { SectionList } from '../LeftPanel/SectionList';
import { EditorAccordionSection } from '../LeftPanel/EditorAccordionSection';

export const StylePanel: React.FC = () => {
  const { 
    styling, 
    updateStyling, 
    updateMargins, 
    templateId, 
    resetTemplateSectionOrder,
    resetToTemplateDefaults
  } = useEditorStore();
  
  // Accordion state: 'layout' is open by default
  const [openSection, setOpenSection] = useState<string>('layout');

  const handleToggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? '' : section);
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

  const handleResetSectionOrder = () => {
    resetTemplateSectionOrder(templateId);
  };

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

  return (
    <div className="flex flex-col space-y-1 p-4 bg-surface-primary min-h-screen theme-transition select-none">
      
      {/* 1. STRUCTURE & LAYOUT ACCORDION */}
      <EditorAccordionSection
        id="layout"
        title="Structure & Layout"
        icon={Sliders}
        isOpen={openSection === 'layout'}
        onToggle={() => handleToggleSection('layout')}
      >
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

      {/* 2. HEADERS ACCORDION */}
      <EditorAccordionSection
        id="headers"
        title="Headers"
        icon={LayoutList}
        isOpen={openSection === 'headers'}
        onToggle={() => handleToggleSection('headers')}
      >
        <SectionList />
      </EditorAccordionSection>

      {/* 3. RESET ACCORDION */}
      <EditorAccordionSection
        id="reset"
        title="Reset Options"
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
              onClick={handleResetSectionOrder}
              variant="secondary"
              className="w-full text-xs py-2 mt-1 rounded-xl flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Section Order</span>
            </Button>
          </div>

          <div className="space-y-1 pt-2 border-t border-surface-tertiary">
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

          <div className="space-y-1 pt-2 border-t border-surface-tertiary">
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

    </div>
  );
};

export default StylePanel;
