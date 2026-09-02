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
            <span>Typography & Font Sizes</span>
          </h4>

          <div className="smart-card space-y-4">
            {/* 1. Font Family (Common for all text) */}
            <div className="space-y-1">
              <Select
                label="Font Family (Style for All Text)"
                value={styling.fontFamily}
                onChange={(e) => updateStyling({ fontFamily: e.target.value as any })}
              >
                {fontOptions.map(font => (
                  <option key={font} value={font} className="bg-surface-primary text-text-primary">{font}</option>
                ))}
              </Select>
              <p className="text-[9px] text-text-muted">Applies to headers, subheadings, and body content consistently.</p>
            </div>

            {/* Quick Size Presets */}
            <div className="space-y-1.5 pt-2 border-t border-surface-tertiary">
              <label className={labelClasses}>Quick Typography Presets</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateStyling({
                      fontSizeHeader: 14,
                      fontSizeTitle: 12,
                      fontSizeReportTitle: 13,
                      fontSizeSubHeader: 10.5,
                      fontSizeBase: 10,
                      fontSizeTable: 9.5
                    });
                  }}
                  className="py-1.5 text-[9.5px] font-bold rounded-lg border border-surface-tertiary bg-bg-secondary hover:bg-accent-primary/10 hover:border-accent-primary transition-all text-text-primary text-center"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateStyling({
                      fontSizeHeader: 12.5,
                      fontSizeTitle: 10.5,
                      fontSizeReportTitle: 11.5,
                      fontSizeSubHeader: 9.5,
                      fontSizeBase: 9,
                      fontSizeTable: 8.5
                    });
                  }}
                  className="py-1.5 text-[9.5px] font-bold rounded-lg border border-surface-tertiary bg-bg-secondary hover:bg-accent-primary/10 hover:border-accent-primary transition-all text-text-primary text-center"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateStyling({
                      fontSizeHeader: 16,
                      fontSizeTitle: 13.5,
                      fontSizeReportTitle: 14.5,
                      fontSizeSubHeader: 12,
                      fontSizeBase: 11,
                      fontSizeTable: 10.5
                    });
                  }}
                  className="py-1.5 text-[9.5px] font-bold rounded-lg border border-surface-tertiary bg-bg-secondary hover:bg-accent-primary/10 hover:border-accent-primary transition-all text-text-primary text-center"
                >
                  Large
                </button>
              </div>
            </div>

            {/* 2. THE 3 CLEAR FONT SIZE CATEGORIES */}
            <div className="space-y-3 pt-2 border-t border-surface-tertiary">
              {/* Category 1: Headers Font Size */}
              <div className="p-2.5 rounded-xl border border-surface-tertiary bg-bg-secondary/50 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-text-primary flex items-center space-x-1 uppercase tracking-wider">
                    <span>👑 1. Headers Size</span>
                  </span>
                  <span className="text-[10px] font-mono font-extrabold text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-md">
                    {styling.fontSizeHeader || 13} pt
                  </span>
                </div>
                <p className="text-[9px] text-text-muted">Main institution banner, report headline & document title.</p>
                <input
                  type="range"
                  min="10"
                  max="20"
                  step="0.5"
                  value={styling.fontSizeHeader || 13}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateStyling({
                      fontSizeHeader: val,
                      fontSizeReportTitle: Math.max(9, val - 1),
                      fontSizeTitle: Math.max(8, val - 2)
                    });
                  }}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>

              {/* Category 2: Subheadings Font Size */}
              <div className="p-2.5 rounded-xl border border-surface-tertiary bg-bg-secondary/50 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-text-primary flex items-center space-x-1 uppercase tracking-wider">
                    <span>📌 2. Subheadings Size</span>
                  </span>
                  <span className="text-[10px] font-mono font-extrabold text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-md">
                    {styling.fontSizeSubHeader || 9.5} pt
                  </span>
                </div>
                <p className="text-[9px] text-text-muted">Section titles (Purpose, Summary, Outcomes) & sub-headers.</p>
                <input
                  type="range"
                  min="8"
                  max="16"
                  step="0.5"
                  value={styling.fontSizeSubHeader || 9.5}
                  onChange={(e) => updateStyling({ fontSizeSubHeader: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>

              {/* Category 3: Content / Body Font Size */}
              <div className="p-2.5 rounded-xl border border-surface-tertiary bg-bg-secondary/50 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-text-primary flex items-center space-x-1 uppercase tracking-wider">
                    <span>📝 3. Content & Body Size</span>
                  </span>
                  <span className="text-[10px] font-mono font-extrabold text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-md">
                    {styling.fontSizeBase || 10} pt
                  </span>
                </div>
                <p className="text-[9px] text-text-muted">Paragraph text, bullet points, outcome lists & table data.</p>
                <input
                  type="range"
                  min="7"
                  max="14"
                  step="0.5"
                  value={styling.fontSizeBase || 10}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateStyling({
                      fontSizeBase: val,
                      fontSizeTable: Math.max(7, val - 0.5)
                    });
                  }}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
            </div>

            {/* Line Spacing */}
            <div className="space-y-1 pt-2 border-t border-surface-tertiary">
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

        {/* Table Size & Dimensions (Length/Breadth) */}
        <div className="space-y-3 pt-3 border-t border-surface-tertiary">
          <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-accent-primary" />
            <span>Table Size & Dimensions</span>
          </h4>

          <div className="smart-card space-y-3">
            {/* Table Width % */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className={labelClasses}>Table Width / Breadth</label>
                <span className="text-[10px] font-mono font-bold text-text-primary">{styling.tableWidthPercent || 100}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                step="1"
                value={styling.tableWidthPercent || 100}
                onChange={(e) => updateStyling({ tableWidthPercent: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
            </div>

            {/* Label Column Width % */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className={labelClasses}>Label Column Width</label>
                <span className="text-[10px] font-mono font-bold text-text-primary">{styling.tableLabelWidthPercent || 32}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                step="1"
                value={styling.tableLabelWidthPercent || 32}
                onChange={(e) => updateStyling({ tableLabelWidthPercent: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
            </div>

            {/* Cell Padding */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className={labelClasses}>Cell Padding (Row Height)</label>
                <span className="text-[10px] font-mono font-bold text-text-primary">{styling.tablePaddingPx || 6}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="14"
                step="1"
                value={styling.tablePaddingPx || 6}
                onChange={(e) => updateStyling({ tablePaddingPx: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
            </div>

            {/* Border Width & Color */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className={labelClasses}>Border Width</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.5"
                  value={styling.tableBorderWidthPx || 1}
                  onChange={(e) => updateStyling({ tableBorderWidthPx: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary"
                />
              </div>
              <div>
                <label className={labelClasses}>Border Color</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="color"
                    value={styling.tableBorderColor || '#94a3b8'}
                    onChange={(e) => updateStyling({ tableBorderColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-surface-tertiary bg-transparent cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={styling.tableBorderColor || '#94a3b8'}
                    onChange={(e) => updateStyling({ tableBorderColor: e.target.value })}
                    className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1 text-center font-mono text-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo & Branding */}
        <div className="space-y-3 pt-3 border-t border-surface-tertiary">
          <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center space-x-1.5">
            <Maximize className="w-3.5 h-3.5 text-accent-primary" />
            <span>Logo & Header Branding</span>
          </h4>

          <div className="smart-card space-y-3">
            {/* Show Logo Toggle */}
            <div className="flex items-center justify-between">
              <label className={labelClasses}>Display Logo</label>
              <input
                type="checkbox"
                checked={styling.showLogo !== false}
                onChange={(e) => updateStyling({ showLogo: e.target.checked })}
                className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary accent-accent-primary cursor-pointer"
              />
            </div>

            {/* Custom Logo Image URL / Upload */}
            <div className="space-y-1.5">
              <label className={labelClasses}>Custom Logo Image URL</label>
              <Input
                type="text"
                value={useEditorStore.getState().data.header?.logo || ''}
                onChange={(e) => useEditorStore.getState().updateNestedField('header.logo', e.target.value)}
                placeholder="Paste Image URL or data:image/..."
                className="text-xs"
              />
            </div>

            {/* Logo Dimensions & Position */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClasses}>Logo Width (px)</label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={styling.logoWidthPx || 120}
                  onChange={(e) => updateStyling({ logoWidthPx: parseInt(e.target.value) || 120 })}
                  className="w-full bg-surface-primary border border-surface-tertiary rounded-xl p-1.5 text-center text-xs text-text-primary"
                />
              </div>
              <div>
                <label className={labelClasses}>Logo Height (px)</label>
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

            {/* Logo Position / Alignment */}
            <div className="space-y-1.5">
              <label className={labelClasses}>Logo Position Alignment</label>
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
        </div>

        {/* Footer & Signature Controls */}
        <div className="space-y-3 pt-3 border-t border-surface-tertiary">
          <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider flex items-center space-x-1.5">
            <LayoutList className="w-3.5 h-3.5 text-accent-primary" />
            <span>Footer & Signature Labels</span>
          </h4>

          <div className="smart-card space-y-3">
            <Input
              label="Footer Document Code"
              value={useEditorStore.getState().data.footer?.docCode || ''}
              onChange={(e) => useEditorStore.getState().updateNestedField('footer.docCode', e.target.value)}
              className="text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Footer Version"
                value={useEditorStore.getState().data.footer?.version || ''}
                onChange={(e) => useEditorStore.getState().updateNestedField('footer.version', e.target.value)}
                className="text-xs"
              />
              <Input
                label="Footer Date"
                value={useEditorStore.getState().data.footer?.docDate || ''}
                onChange={(e) => useEditorStore.getState().updateNestedField('footer.docDate', e.target.value)}
                className="text-xs"
              />
            </div>
            
            <div className="pt-2 border-t border-surface-tertiary space-y-2">
              <label className={labelClasses}>Signature Labels</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={useEditorStore.getState().data.signatures?.hodLabel || 'HOD'}
                  onChange={(e) => useEditorStore.getState().updateNestedField('signatures.hodLabel', e.target.value)}
                  placeholder="HOD"
                  className="text-center text-xs"
                />
                <Input
                  value={useEditorStore.getState().data.signatures?.deanLabel || 'Dean'}
                  onChange={(e) => useEditorStore.getState().updateNestedField('signatures.deanLabel', e.target.value)}
                  placeholder="Dean"
                  className="text-center text-xs"
                />
                <Input
                  value={useEditorStore.getState().data.signatures?.principalLabel || 'Principal'}
                  onChange={(e) => useEditorStore.getState().updateNestedField('signatures.principalLabel', e.target.value)}
                  placeholder="Principal"
                  className="text-center text-xs"
                />
              </div>
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
