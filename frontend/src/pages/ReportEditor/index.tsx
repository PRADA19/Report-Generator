// frontend/src/pages/ReportEditor/index.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateStore } from '../../store/templateStore';
import CreateReportPage from '../../features/editor/pages/CreateReportPage';

export const ReportEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedTemplateId, getSelectedTemplate } = useTemplateStore();
  const selectedTemplate = getSelectedTemplate();

  useEffect(() => {
    if (!selectedTemplateId || !selectedTemplate) {
      navigate('/generate-report', { 
        replace: true, 
        state: { error: 'Please select a template before creating a report.' } 
      });
    }
  }, [selectedTemplateId, selectedTemplate, navigate]);

  if (!selectedTemplateId || !selectedTemplate) {
    return null;
  }

  return <CreateReportPage />;
};

export default ReportEditorPage;
