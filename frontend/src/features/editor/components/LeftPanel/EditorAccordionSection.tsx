// frontend/src/features/editor/components/LeftPanel/EditorAccordionSection.tsx
import React, { useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface EditorAccordionSectionProps {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  customTitle?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const EditorAccordionSection: React.FC<EditorAccordionSectionProps> = ({
  id,
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  customTitle,
  headerRight
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Keyboard Accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className="border-b border-surface-tertiary/40 py-1 theme-transition">
      <div
        role="button"
        tabIndex={0}
        id={`header-${id}`}
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-[14px] cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary select-none ${
          isOpen
            ? 'bg-accent-primary/10 dark:bg-surface-secondary shadow-sm border border-accent-primary/20 text-text-primary'
            : 'bg-transparent text-text-secondary hover:bg-surface-secondary/40 hover:text-text-primary'
        }`}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isOpen ? 'text-accent-primary' : 'text-text-muted'}`} />
          {customTitle ? customTitle : (
            <span className="text-xs font-bold uppercase tracking-wider truncate">{title}</span>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {headerRight}
          <ChevronDown 
            className={`w-4 h-4 text-text-muted transition-transform duration-250 ease-out ${
              isOpen ? 'transform rotate-180 text-accent-primary' : ''
            }`} 
          />
        </div>
      </div>
      
      <div
        id={`section-${id}`}
        role="region"
        aria-labelledby={`header-${id}`}
        ref={contentRef}
        className="transition-all duration-250 ease-in-out"
        style={{
          maxHeight: isOpen ? `${(contentRef.current?.scrollHeight || 0) + 100}px` : '0px',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          paddingTop: isOpen ? '16px' : '0px',
          paddingBottom: isOpen ? '16px' : '0px',
          paddingLeft: '4px',
          paddingRight: '4px',
          transition: 'max-height 0.25s ease, opacity 0.2s ease, padding 0.2s ease, transform 0.2s ease',
        }}
      >
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
export default EditorAccordionSection;
