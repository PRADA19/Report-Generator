// frontend/src/features/editor/pages/CreateReportPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import { ChevronLeft, Save, RefreshCw, AlignLeft, Printer } from 'lucide-react';
import { LivePreview } from '../components/CenterPanel/LivePreview';
import { EditorSidebar } from '../components/LeftPanel/EditorSidebar';
import { PreviewToolbar, AutosaveIndicator } from '../components/CenterPanel/PreviewToolbar';
import { A4PreviewContainer } from '../components/CenterPanel/A4PreviewContainer';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { Button } from '../../../components/ui/Button';

export const CreateReportPage: React.FC = () => {
  const { data, resetToTemplateDefaults } = useEditorStore();
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  
  // Responsive layout breakpoints
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [activeTabletDrawer, setActiveTabletDrawer] = useState<'inputs' | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<'inputs' | 'preview'>('inputs');

  const viewportRef = useRef<HTMLDivElement>(null);

  // Keyboard Productivity Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          console.log('Ctrl+S: Autosaved state.');
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          const confirmReset = window.confirm("Reset report draft to template defaults?");
          if (confirmReset) {
            resetToTemplateDefaults();
          }
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomScale(prev => Math.min(prev + 0.1, 1.8));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomScale(prev => Math.max(prev - 0.1, 0.4));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomScale(1.0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetToTemplateDefaults]);

  // Fit Width calculator
  const handleFitWidth = () => {
    if (viewportRef.current) {
      const width = viewportRef.current.clientWidth;
      const padding = 32;
      const targetWidth = 794;
      const scale = (width - padding) / targetWidth;
      setZoomScale(Math.min(Math.max(scale, 0.35), 1.5));
    }
  };

  // Fit Height calculator
  const handleFitPage = () => {
    if (viewportRef.current) {
      const height = viewportRef.current.clientHeight;
      const padding = 48;
      const targetHeight = 1123;
      const scale = (height - padding) / targetHeight;
      setZoomScale(Math.min(Math.max(scale, 0.35), 1.5));
    }
  };

  // Safe reset call
  const triggerResetDraft = () => {
    const confirmReset = window.confirm("Are you sure you want to reset this draft to template defaults?");
    if (confirmReset) {
      resetToTemplateDefaults();
    }
  };

  // Render header details
  const renderHeader = () => (
    <header className="h-14 border-b border-surface-tertiary bg-surface-primary flex items-center justify-between px-4 z-45 flex-shrink-0 no-print theme-transition">
      <div className="flex items-center space-x-3 min-w-0">
        <Link to="/generate-report" className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-xl hover:bg-bg-secondary flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="h-4 w-px bg-surface-tertiary flex-shrink-0"></div>
        <div className="min-w-0">
          <span className="text-[10px] text-accent-primary uppercase tracking-widest font-bold hidden sm:inline">Report Generator</span>
          <h1 className="text-xs sm:text-sm font-semibold text-text-primary leading-tight truncate">
            {data.title || "Untitled Event Report"}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        <ThemeToggle />
        <div className="h-4 w-px bg-surface-tertiary hidden sm:block"></div>
        
        <Button 
          onClick={triggerResetDraft}
          size="sm"
          variant="secondary"
        >
          <RefreshCw className="w-3 h-3 mr-1.5" />
          <span className="hidden sm:inline">Reset Draft</span>
        </Button>
        
        <Button 
          onClick={() => window.print()}
          size="sm"
          variant="primary"
          className="shadow-md shadow-accent-primary/20 font-bold"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          <span>Export PDF</span>
        </Button>
      </div>
    </header>
  );

  // DESKTOP: Renders 2-panel layout (Left Sidebar + Center Preview)
  const renderDesktopLayout = () => (
    <div className="flex-1 flex overflow-hidden">
      {/* LEFT SIDEBAR: Accordion editing & layout panel (350px) - Scrolls independently */}
      <aside className="w-[350px] min-w-[350px] max-w-[350px] bg-surface-primary border-r border-surface-tertiary flex flex-col overflow-y-auto overscroll-contain flex-shrink-0 theme-transition">
        <EditorSidebar />
      </aside>

      {/* CENTER WORKSPACE: Zoom Toolbar + Sticky Live Preview Canvas */}
      <main className="flex-1 bg-bg-primary flex flex-col overflow-hidden relative theme-transition">
        <PreviewToolbar 
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
          onFitWidth={handleFitWidth}
          onFitPage={handleFitPage}
        />
        <div ref={viewportRef} className="flex-1 overflow-hidden relative flex flex-col">
          <A4PreviewContainer>
            <LivePreview zoomScale={zoomScale} />
          </A4PreviewContainer>
        </div>
      </main>
    </div>
  );

  // TABLET: Collapsible side panel overlay
  const renderTabletLayout = () => (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Collapsible overlay panel */}
        {activeTabletDrawer && (
          <div className="absolute inset-y-0 left-0 w-80 bg-surface-primary border-r border-surface-tertiary z-30 shadow-premium dark:shadow-premium-dark flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-surface-tertiary flex items-center justify-between bg-bg-secondary">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Report Editor & Layout
              </span>
              <Button 
                onClick={() => setActiveTabletDrawer(null)}
                size="sm"
                variant="secondary"
                className="scale-90"
              >
                Close
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain bg-surface-primary">
              <EditorSidebar />
            </div>
          </div>
        )}

        {/* Central Viewport */}
        <main className="flex-1 bg-bg-primary flex flex-col overflow-hidden relative theme-transition">
          <PreviewToolbar 
            zoomScale={zoomScale}
            setZoomScale={setZoomScale}
            onFitWidth={handleFitWidth}
            onFitPage={handleFitPage}
          />
          <div ref={viewportRef} className="flex-1 overflow-hidden relative flex flex-col">
            <A4PreviewContainer>
              <LivePreview zoomScale={zoomScale} />
            </A4PreviewContainer>
          </div>
        </main>
      </div>

      {/* Bottom tabs toggle drawer */}
      <div className="px-4 py-2 bg-transparent flex-shrink-0 no-print">
        <footer className="glass-panel h-14 rounded-2xl flex items-center justify-around select-none relative z-40">
          <button
            onClick={() => setActiveTabletDrawer(activeTabletDrawer ? null : 'inputs')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-4 rounded-xl text-xs transition-colors ${activeTabletDrawer ? 'text-text-primary bg-surface-tertiary/20' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <AlignLeft className="w-4 h-4 text-accent-primary" />
            <span className="text-[10px] font-bold">Report Editor & Layout</span>
          </button>
        </footer>
      </div>
    </div>
  );

  // MOBILE: Stacked tab pages (Canva/Docs mobile style with floating rounded tab bar)
  const renderMobileLayout = () => (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Active Tab Screen */}
      <div className="flex-1 overflow-hidden relative bg-bg-secondary theme-transition">
        {activeMobileView === 'inputs' && (
          <div className="h-full flex flex-col bg-surface-primary overflow-y-auto overscroll-contain pb-8 theme-transition">
            <EditorSidebar />
          </div>
        )}

        {activeMobileView === 'preview' && (
          <div className="h-full flex flex-col bg-bg-primary overflow-hidden theme-transition">
            {/* Mobile toolbar */}
            <div className="h-10 border-b border-surface-tertiary bg-surface-primary flex items-center justify-between px-3 flex-shrink-0 select-none">
              <div className="scale-90 origin-left">
                <AutosaveIndicator />
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.05, 0.3))}
                  className="bg-bg-secondary text-text-primary text-xs px-2 py-0.5 rounded-lg font-bold border border-surface-tertiary"
                >
                  -
                </button>
                <span className="text-[10px] font-mono font-semibold text-text-secondary">{Math.round(zoomScale * 100)}%</span>
                <button 
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.05, 1.1))}
                  className="bg-bg-secondary text-text-primary text-xs px-2 py-0.5 rounded-lg font-bold border border-surface-tertiary"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Viewport */}
            <div ref={viewportRef} className="flex-1 overflow-hidden relative flex flex-col">
              <A4PreviewContainer>
                <LivePreview zoomScale={zoomScale} />
              </A4PreviewContainer>
            </div>
          </div>
        )}
      </div>

      {/* Floating rounded bottom tab bar with frosted glass */}
      <div className="no-print">
        <footer className="fixed bottom-4 left-4 right-4 rounded-3xl bg-white/90 dark:bg-surface-primary/90 backdrop-blur-2xl border border-surface-tertiary shadow-2xl h-14 flex items-center justify-around select-none z-40">
          <button
            onClick={() => setActiveMobileView('inputs')}
            className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-4 rounded-xl transition-all ${
              activeMobileView === 'inputs' 
                ? 'text-accent-primary bg-accent-primary/10 shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <AlignLeft className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold">Editor</span>
          </button>
          
          <button
            onClick={() => {
              setActiveMobileView('preview');
              setZoomScale(0.42);
            }}
            className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-4 rounded-xl transition-all ${
              activeMobileView === 'preview' 
                ? 'text-accent-secondary bg-accent-secondary/10 shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Printer className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold">Preview</span>
          </button>
        </footer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen h-screen max-h-screen bg-bg-primary text-text-primary flex flex-col font-sans select-none overflow-hidden touch-manipulation theme-transition">
      {renderHeader()}
      {isDesktop && renderDesktopLayout()}
      {isTablet && renderTabletLayout()}
      {isMobile && renderMobileLayout()}
    </div>
  );
};
export default CreateReportPage;
