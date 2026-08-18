// frontend/src/routes/index.tsx
import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from '../pages/Dashboard';
import { GenerateReportPage } from '../pages/GenerateReport';
import { ManageTemplatesPage } from '../pages/TemplateLibrary';
import { ReportEditorPage } from '../pages/ReportEditor';
import { SettingsPage } from '../pages/Settings';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/generate-report" element={<GenerateReportPage />} />
      <Route path="/templates" element={<ManageTemplatesPage />} />
      <Route path="/editor" element={<ReportEditorPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<DashboardPage />} />
    </Routes>
  );
};
