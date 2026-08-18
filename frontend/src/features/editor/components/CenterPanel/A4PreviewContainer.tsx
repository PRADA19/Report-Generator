// frontend/src/features/editor/components/CenterPanel/A4PreviewContainer.tsx
import React from 'react';

interface A4PreviewContainerProps {
  children: React.ReactNode;
}

export const A4PreviewContainer: React.FC<A4PreviewContainerProps> = ({ children }) => {
  return (
    <div className="preview-canvas-container flex-1 min-w-0 overflow-y-auto overflow-x-auto overscroll-contain p-8 flex justify-center !items-start !flex-row bg-bg-primary theme-transition">
      {children}
    </div>
  );
};
export default A4PreviewContainer;
