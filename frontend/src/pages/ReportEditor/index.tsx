// frontend/src/pages/ReportEditor/index.tsx
import React, { useEffect } from 'react';
import { useTemplateStore } from '../../store/templateStore';
import { useReportStore } from '../../store/reportStore';
import CreateReportPage from '../../features/editor/pages/CreateReportPage';

export const ReportEditorPage: React.FC = () => {
  const { selectedTemplateId, selectTemplate, getSelectedTemplate } = useTemplateStore();
  const { initializeReportFromTemplate } = useReportStore();
  const selectedTemplate = getSelectedTemplate();

  useEffect(() => {
    if (!selectedTemplateId || !selectedTemplate) {
      const defaultTpl = useTemplateStore.getState().templates.find(t => t.id === 'kprcas-event-template') || useTemplateStore.getState().templates[0];
      if (defaultTpl) {
        selectTemplate(defaultTpl.id);
        initializeReportFromTemplate(defaultTpl);
      } else {
        selectTemplate('kprcas-event-template');
      }
    }
  }, [selectedTemplateId, selectedTemplate, selectTemplate, initializeReportFromTemplate]);

  return <CreateReportPage />;
};

export default ReportEditorPage;
