// frontend/src/features/editor/components/LeftPanel/ImageList.tsx
import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Upload, Trash2, Image as ImageIcon, Sliders, Type, Maximize, Eye } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Select } from '../../../../components/ui/Select';

export const ImageList: React.FC = () => {
  const { data, addImage, updateImage, removeImage, layoutConfig, updateLayoutConfig } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          addImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Section wide layout modes
  const isCompact = layoutConfig.compactPhotoMode || false;
  const currentLayoutMode = isCompact ? 'compact' : (layoutConfig.photoLayoutMode || 'two');

  const handleLayoutModeChange = (mode: 'single' | 'two' | 'three' | 'compact') => {
    if (mode === 'compact') {
      updateLayoutConfig({
        compactPhotoMode: true,
        photoLayoutMode: 'compact'
      });
    } else {
      updateLayoutConfig({
        compactPhotoMode: false,
        photoLayoutMode: mode
      });
    }
  };

  const handleToggleCompactMode = () => {
    const nextCompact = !isCompact;
    updateLayoutConfig({
      compactPhotoMode: nextCompact,
      ...(nextCompact ? { photoLayoutMode: 'compact' } : { photoLayoutMode: 'two' })
    });
  };

  // Snapping options for individual sizing
  const widthOptions = [25, 33, 50, 66, 75, 100];
  const heightOptions = [80, 120, 160, 200, 240, 300, 400];
  
  // Proportional maps to maintain aspect ratio
  const aspectHeightMap: Record<number, number> = {
    25: 80,
    33: 120,
    50: 160,
    66: 200,
    75: 240,
    100: 300
  };

  return (
    <div className="flex flex-col space-y-6 p-4">
      
      {/* 1. Upload Header Area */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-4.5 h-4.5 text-accent-primary" />
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Event Photographs</h3>
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <button
          onClick={handleUploadClick}
          className="w-full flex flex-col items-center justify-center border-2 border-dashed border-surface-tertiary hover:border-accent-primary bg-surface-primary rounded-3xl p-5 hover:bg-surface-secondary transition-all cursor-pointer group shadow-sm text-center theme-transition"
        >
          <div className="p-2.5 bg-surface-secondary border border-surface-tertiary text-text-secondary rounded-2xl mb-2 group-hover:scale-105 transition-transform duration-280 shadow-sm">
            <Upload className="w-4.5 h-4.5 text-accent-primary" />
          </div>
          <span className="text-xs font-bold text-text-primary">Upload Image File</span>
          <span className="text-[9px] text-text-secondary mt-0.5">Geo-tagged A4 prints | Max 5MB</span>
        </button>
      </div>

      {/* 2. Global Gallery Layout Configurations */}
      <div className="bg-bg-secondary/40 border border-surface-tertiary/75 rounded-2xl p-3.5 space-y-3 shadow-sm">
        <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">
          Gallery Layout Configuration
        </span>

        {/* Layout Mode Grid Select */}
        <Select
          label="Photo Grid Layout"
          value={currentLayoutMode}
          onChange={(e) => handleLayoutModeChange(e.target.value as any)}
        >
          <option value="single" className="bg-surface-primary text-text-primary">Single Large (1 Col)</option>
          <option value="two" className="bg-surface-primary text-text-primary">Two Column (2 Col)</option>
          <option value="three" className="bg-surface-primary text-text-primary">Three Column (3 Col)</option>
          <option value="compact" className="bg-surface-primary text-text-primary">Compact Evidence Grid (2 Col)</option>
        </Select>

        {/* Compact Mode Toggle */}
        <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none text-[10px] font-bold text-text-primary">
          <input
            type="checkbox"
            checked={isCompact}
            onChange={handleToggleCompactMode}
            className="w-4 h-4 rounded border-surface-tertiary text-accent-primary focus:ring-accent-primary focus:ring-2 focus:ring-offset-2 accent-accent-primary"
          />
          <span className="uppercase tracking-wider">Compact Photo Mode (Tight fit)</span>
        </label>
        {isCompact && (
          <p className="text-[9px] text-accent-primary font-medium pl-6 leading-tight">
            * Locks dimensions to 48% width & 140px height for optimal spacing.
          </p>
        )}
      </div>

      {/* 3. Uploaded Photographs Grid List */}
      <div className="space-y-5">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
          Images Queue ({data.images.length})
        </span>

        {data.images.length === 0 ? (
          <div className="text-center py-8 bg-surface-secondary rounded-3xl border border-surface-tertiary text-[11px] text-text-secondary">
            No photographs uploaded yet.
          </div>
        ) : (
          <div className="space-y-5">
            {data.images.map((img) => {
              const maintainRatio = img.maintainAspectRatio !== undefined ? img.maintainAspectRatio : true;
              const capPosition = img.captionPosition || 'below';
              
              // Map width snap index
              const widthVal = img.widthPercent || 100;
              const widthIdx = widthOptions.indexOf(widthVal) !== -1 ? widthOptions.indexOf(widthVal) : 5;

              // Map height snap index
              const heightVal = img.heightPx || 160;
              const heightIdx = heightOptions.indexOf(heightVal) !== -1 ? heightOptions.indexOf(heightVal) : 2;

              return (
                <div 
                  key={img.id} 
                  className="smart-card relative focus-within:ring-2 focus-within:ring-accent-primary group hover:shadow-lg transition-all duration-300 space-y-3.5"
                >
                  {/* Photo frame with clean neutral background */}
                  <div className="relative h-32 bg-surface-primary rounded-xl overflow-hidden flex items-center justify-center p-1.5 border border-surface-tertiary transition-all duration-300">
                    <img 
                      src={img.url} 
                      alt="Event upload" 
                      className="max-h-full max-w-full rounded-lg object-contain shadow-sm border border-surface-tertiary"
                    />
                    
                    {/* Floating Action Delete Button */}
                    <Button
                      onClick={() => removeImage(img.id)}
                      variant="danger"
                      className="absolute top-2 right-2 p-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Delete Photograph"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Caption Form Input */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-text-secondary flex items-center space-x-1.5 uppercase tracking-wide">
                      <Type className="w-3 h-3 text-text-muted" />
                      <span>Geo-tag Image Caption</span>
                    </span>
                    <Input
                      value={img.caption}
                      onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                      placeholder="e.g. Session 1 - Introduction to Cloud Infrastructure"
                    />
                  </div>

                  {/* SIZING & POSITION CONTROLS */}
                  {!isCompact ? (
                    <div className="space-y-3 bg-surface-secondary/40 p-2.5 rounded-xl border border-surface-tertiary">
                      
                      {/* 1. Width control */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary">
                          <span className="flex items-center space-x-1 uppercase tracking-wider">
                            <Sliders className="w-3 h-3 text-accent-primary" />
                            <span>Width Percent</span>
                          </span>
                          <span className="font-mono text-text-primary">{widthVal}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          value={widthIdx}
                          onChange={(e) => {
                            const newWidth = widthOptions[parseInt(e.target.value)];
                            const updates: Partial<typeof img> = { widthPercent: newWidth };
                            if (maintainRatio) {
                              updates.heightPx = aspectHeightMap[newWidth] || 160;
                            }
                            updateImage(img.id, updates);
                          }}
                          className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                        />
                      </div>

                      {/* 2. Height px control */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary">
                          <span className="flex items-center space-x-1 uppercase tracking-wider">
                            <Sliders className="w-3 h-3 text-accent-primary" />
                            <span>Height (PX)</span>
                          </span>
                          <span className="font-mono text-text-primary">{heightVal}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="1"
                          value={heightIdx}
                          onChange={(e) => {
                            const newHeight = heightOptions[parseInt(e.target.value)];
                            const updates: Partial<typeof img> = { heightPx: newHeight };
                            if (maintainRatio) {
                              // Find closest width
                              const closestWidth = Object.keys(aspectHeightMap).find(
                                (k) => aspectHeightMap[parseInt(k)] === newHeight
                              );
                              if (closestWidth) {
                                updates.widthPercent = parseInt(closestWidth);
                              }
                            }
                            updateImage(img.id, updates);
                          }}
                          disabled={maintainRatio}
                          className={`w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary ${
                            maintainRatio ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>

                      {/* 3. Aspect Ratio Toggle */}
                      <label className="flex items-center space-x-2 pt-0.5 cursor-pointer select-none text-[9px] font-bold text-text-primary">
                        <input
                          type="checkbox"
                          checked={maintainRatio}
                          onChange={(e) => updateImage(img.id, { maintainAspectRatio: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-surface-tertiary text-accent-primary accent-accent-primary"
                        />
                        <span className="flex items-center space-x-1 uppercase tracking-wider">
                          <Maximize className="w-3 h-3 text-text-muted" />
                          <span>Lock Aspect Ratio</span>
                        </span>
                      </label>

                    </div>
                  ) : (
                    <div className="bg-surface-secondary/40 p-2 rounded-xl border border-surface-tertiary/60 text-[9px] font-medium text-text-secondary text-center leading-normal">
                      * Sizing sliders locked by Compact Gallery Mode (48% x 140px).
                    </div>
                  )}

                  {/* 4. Caption Position Radio buttons */}
                  <div className="space-y-1.5 bg-surface-secondary/40 p-2.5 rounded-xl border border-surface-tertiary">
                    <span className="text-[9px] font-bold text-text-secondary flex items-center space-x-1.5 uppercase tracking-wider">
                      <Eye className="w-3 h-3 text-accent-primary" />
                      <span>Caption Position</span>
                    </span>
                    <div className="flex items-center justify-between text-[9px] font-bold text-text-primary pt-1">
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`caption-pos-${img.id}`}
                          checked={capPosition === 'below'}
                          onChange={() => updateImage(img.id, { captionPosition: 'below' })}
                          className="w-3.5 h-3.5 text-accent-primary accent-accent-primary"
                        />
                        <span>Below</span>
                      </label>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`caption-pos-${img.id}`}
                          checked={capPosition === 'overlay'}
                          onChange={() => updateImage(img.id, { captionPosition: 'overlay' })}
                          className="w-3.5 h-3.5 text-accent-primary accent-accent-primary"
                        />
                        <span>Overlay</span>
                      </label>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`caption-pos-${img.id}`}
                          checked={capPosition === 'hidden'}
                          onChange={() => updateImage(img.id, { captionPosition: 'hidden' })}
                          className="w-3.5 h-3.5 text-accent-primary accent-accent-primary"
                        />
                        <span>Hidden</span>
                      </label>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
export default ImageList;
