import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, LayoutGrid, Sparkles } from 'lucide-react';
import { getPresetsForCount, getPresetById } from './photoLayoutPresets';
import { useEditorStore } from '../../store/editorStore';

interface PhotoLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoLayoutModal: React.FC<PhotoLayoutModalProps> = ({ isOpen, onClose }) => {
  const { data, layoutConfig, updateLayoutConfig } = useEditorStore();
  const imageCount = data.images ? data.images.length : 0;

  // Active Category Tab (1, 2, 3, 4, 5, 6, or 7 for 7+)
  const [activeTabCount, setActiveTabCount] = useState<number>(Math.max(1, Math.min(6, imageCount || 2)));
  
  const currentPreset = getPresetById(layoutConfig.photoLayoutPreset, Math.max(1, imageCount));
  const [selectedPresetId, setSelectedPresetId] = useState<string>(currentPreset.id);

  // Sync state when modal opens or image count changes
  useEffect(() => {
    if (isOpen) {
      const defaultCount = imageCount > 0 ? (imageCount >= 7 ? 7 : imageCount) : 2;
      setActiveTabCount(defaultCount);
      const preset = getPresetById(layoutConfig.photoLayoutPreset, defaultCount);
      setSelectedPresetId(preset.id);
    }
  }, [isOpen, imageCount, layoutConfig.photoLayoutPreset]);

  if (!isOpen) return null;

  const availablePresets = getPresetsForCount(activeTabCount);

  const handleSelectCard = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  const handleApply = () => {
    updateLayoutConfig({
      photoLayoutPreset: selectedPresetId,
      compactPhotoMode: false
    });
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Choose Photo Layout</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Select visual card arrangement for your report photographs
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* STEP 1: How many photos? Count Tabs Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                How many photos?
              </span>
              {imageCount > 0 && (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Uploaded: {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              {[1, 2, 3, 4, 5, 6, 7].map((cnt) => {
                const isTabActive = activeTabCount === cnt;
                const isCurrentUploaded = (cnt === 7 && imageCount >= 7) || (cnt === imageCount);

                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setActiveTabCount(cnt);
                      const presets = getPresetsForCount(cnt);
                      if (presets.length > 0) {
                        setSelectedPresetId(presets[0].id);
                      }
                    }}
                    className={`relative py-2 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      isTabActive
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{cnt === 7 ? '7+' : cnt}</span>
                    <span className="text-[9px] font-medium opacity-80">{cnt === 7 ? 'photos' : (cnt === 1 ? 'photo' : 'photos')}</span>
                    {isCurrentUploaded && (
                      <span 
                        className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isTabActive ? 'bg-white' : 'bg-indigo-500 animate-pulse'}`}
                        title="Matches currently uploaded photo count"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: User Sees Visual Cards Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visual Cards Layout Options ({availablePresets.length})
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availablePresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectCard(preset.id)}
                    className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all text-left group cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-lg ring-2 ring-indigo-500/30 scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Selected Indicator Badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Miniature A4 Visual Preview Page */}
                    <div className="w-full aspect-[1/1.2] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-inner overflow-hidden justify-center items-center mb-2">
                      {preset.rows.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1.5 justify-center w-full">
                          {row.columns.map((colWidth, cIdx) => (
                            <div
                              key={cIdx}
                              style={{ width: `${colWidth}%` }}
                              className={`h-5 rounded-sm transition-all ${
                                isSelected
                                  ? 'bg-indigo-600/85 border border-indigo-700 shadow-sm'
                                  : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400'
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Preset Name / Label */}
                    <span className={`text-xs font-bold text-center w-full truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Selecting a card updates photographs in the report
          </span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Layout</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
export default PhotoLayoutModal;
