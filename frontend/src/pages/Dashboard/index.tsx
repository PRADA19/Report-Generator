// frontend/src/pages/Dashboard/index.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Library, ArrowRight, FileCheck, Building2, FileOutput } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { useTemplateStore } from '../../store/templateStore';
import { useReportStore } from '../../store/reportStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { templates } = useTemplateStore();
  const { reportsCount } = useReportStore();

  const stats = [
    {
      title: 'Reports Done',
      value: reportsCount,
      subtitle: 'Total generated reports',
      icon: FileCheck,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Department',
      value: 'IT',
      icon: Building2,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Templates',
      value: templates.length,
      subtitle: 'Available templates',
      icon: Library,
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    },
    {
      title: 'Format',
      value: '1',
      subtitle: '1 Template',
      icon: FileOutput,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    }
  ];

  return (
    <DashboardLayout 
      pageTitle="Dashboard" 
      pageSubtitle="Welcome back"
    >
      <div className="space-y-8">
        
        {/* Header Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-tertiary/60">
          <div>
            <h2 className="text-2xl font-black text-text-primary">Welcome back</h2>
            <p className="text-xs text-text-secondary mt-1">
              Select an action below to generate an event report or manage institutional templates.
            </p>
          </div>
        </div>

        {/* 4 COMPACT STATISTIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx}
                className="bg-surface-primary border border-surface-tertiary rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-3.5 group hover:-translate-y-0.5"
              >
                <div className={`p-3 rounded-xl ${stat.iconBg} flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
                    {stat.title}
                  </span>
                  <div className="text-xl font-extrabold text-text-primary leading-tight mt-0.5">
                    {stat.value}
                  </div>
                  <span className="text-[10px] text-text-secondary block font-medium truncate">
                    {stat.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2 PRIMARY CARDS LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Generate Report */}
          <div className="bg-surface-primary border border-surface-tertiary rounded-2xl p-7 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 group hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-32 h-32 text-accent-primary" />
            </div>

            <div className="space-y-4 z-10">
              <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                  Generate Report
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Generate reports using existing templates. Select from approved department and institutional report formats.
                </p>
              </div>
            </div>

            <div className="pt-2 z-10">
              <Button 
                onClick={() => navigate('/generate-report')}
                variant="primary" 
                size="md" 
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold shadow-md shadow-accent-primary/20 flex items-center justify-center space-x-2"
              >
                <span>Generate Report</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Card 2: Template Library */}
          <div className="bg-surface-primary border border-surface-tertiary rounded-2xl p-7 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 group hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Library className="w-32 h-32 text-accent-secondary" />
            </div>

            <div className="space-y-4 z-10">
              <div className="w-12 h-12 rounded-2xl bg-accent-secondary/15 text-accent-secondary flex items-center justify-center shadow-inner">
                <Library className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-text-primary group-hover:text-accent-secondary transition-colors">
                  Template Library
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Manage all report templates. Create, edit, and organize custom templates for departments and accreditation events.
                </p>
              </div>
            </div>

            <div className="pt-2 z-10">
              <Button 
                onClick={() => navigate('/templates')}
                variant="secondary" 
                size="md" 
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold flex items-center justify-center space-x-2 border-surface-tertiary hover:bg-surface-tertiary/50"
              >
                <span>Manage</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};
