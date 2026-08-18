// frontend/src/features/editor/components/CenterPanel/LivePreview.tsx
import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { KprcasTemplate } from './KprcasTemplate';
import '../../../../assets/styles/editor.css';

interface LivePreviewProps {
  zoomScale?: number;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ zoomScale = 1.0 }) => {
  const { data, styling, layoutConfig, sections } = useEditorStore();

  return (
    <KprcasTemplate 
      data={data}
      styling={styling}
      layoutConfig={layoutConfig}
      sections={sections}
      zoomScale={zoomScale}
    />
  );
};

export default LivePreview;
