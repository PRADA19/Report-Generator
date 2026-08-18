// frontend/src/pages/GenerateReport/index.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Layers, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTemplateStore } from '../../store/templateStore';
import { useReportStore } from '../../store/reportStore';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import type { TemplateItem } from '../../types/template';

export const GenerateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { templates, selectTemplate } = useTemplateStore();
  const { initializeReportFromTemplate } = useReportStore();

  const errorMessage = location.state?.error as string | undefined;

  const handleUseTemplate = (template: TemplateItem) => {
    selectTemplate(template.id);
    initializeReportFromTemplate(template);
    navigate('/editor');
  };

  return (
    <DashboardLayout 
      pageTitle="Select Template" 
      pageSubtitle="Choose an official institutional template below to generate your event report."
    >
      <div className="space-y-6">
        
        {/* Error Redirect Warning Banner */}
        {errorMessage && (
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold">{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-tertiary/60">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Available Templates</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Select a template to launch the report editor.
            </p>
          </div>
          <Badge variant="purple">{templates.length} Available</Badge>
        </div>

        {/* Templates List or Empty State */}
        {templates.length === 0 ? (
          <EmptyState
            title="No templates available"
            description="Create your first template in the Template Library to start generating reports."
            actionText="Go to Template Library"
            onAction={() => navigate('/templates')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="bg-surface-primary border border-surface-tertiary rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-5 group hover:-translate-y-1"
              >
                <div className="space-y-3">
                  {/* Header badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="purple">{template.currentVersion}</Badge>
                    <div className="flex items-center space-x-1.5 text-[11px] text-text-muted font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-accent-primary" />
                      <span>{template.department} Dept</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed line-clamp-3">
                      {template.description}
                    </p>
                  </div>

                  {/* Metadata details */}
                  <div className="pt-2 border-t border-surface-tertiary/40 flex items-center justify-between text-[11px] text-text-muted font-medium">
                    <div className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-text-muted" />
                      <span>{template.sectionsCount} Sections</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{template.eventType}</span>
                    </div>
                  </div>

                  {/* Section tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {template.sectionsList.slice(0, 4).map((sec, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-surface-tertiary/50 text-text-muted text-[10px] font-medium"
                      >
                        {sec}
                      </span>
                    ))}
                    {template.sectionsList.length > 4 && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-tertiary/50 text-text-muted text-[10px] font-medium">
                        +{template.sectionsList.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="pt-3 border-t border-surface-tertiary/60">
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    variant="primary"
                    size="sm"
                    className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-bold shadow-md shadow-accent-primary/20"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
