// frontend/src/features/dashboard/pages/DashboardPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layout, 
  FileText, 
  Plus, 
  Settings, 
  BarChart3, 
  Users, 
  Bell, 
  Menu, 
  X, 
  Sparkles, 
  FolderOpen, 
  MoreVertical, 
  FileUp,
  FileCode2
} from 'lucide-react';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { Button } from '../../../components/ui/Button';

// Reusable KPI Card component
const KpiCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}> = ({ title, value, subtitle, icon, iconBg }) => (
  <div className="smart-card flex items-center space-x-4 shadow-sm h-full">
    <div className={`p-3.5 rounded-2xl ${iconBg} flex-shrink-0 flex items-center justify-center`}>
      {icon}
    </div>
    <div className="space-y-1 min-w-0">
      <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider block">{title}</span>
      <div className="text-2xl font-extrabold text-text-primary leading-tight">{value}</div>
      <span className="text-xs text-text-secondary block font-medium truncate">{subtitle}</span>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex font-sans theme-transition relative overflow-x-hidden">
      
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* 1. LEFT SIDEBAR (250px) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[250px] bg-bg-secondary dark:bg-surface-secondary border-r border-surface-tertiary flex flex-col p-5 space-y-6 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo and title */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-tertiary/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-accent-primary/20 text-accent-primary">
              <Layout className="w-5 h-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <h2 className="text-sm font-bold text-text-primary truncate">Flow Nest</h2>
              <span className="text-[10px] text-text-muted font-medium block">Smart Event Report</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-tertiary rounded-lg md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto space-y-6">
          
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2 block">Main</span>
            <Link 
              to="/" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-accent-primary/15 text-accent-primary font-semibold text-xs leading-none transition-all"
            >
              <Layout className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2 block font-sans">Reports</span>
            <div className="space-y-1">
              <Link 
                to="/" 
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 text-xs font-semibold transition-all"
              >
                <FileText className="w-4 h-4 text-text-muted" />
                <span>All Reports</span>
              </Link>
              <Link 
                to="/editor" 
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4 text-text-muted" />
                <span>Create New Report</span>
              </Link>
              <Link 
                to="/" 
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 text-xs font-semibold transition-all"
              >
                <FolderOpen className="w-4 h-4 text-text-muted" />
                <span>My Drafts</span>
              </Link>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2 block">Templates</span>
            <div className="space-y-1">
              <Link 
                to="/" 
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 text-xs font-semibold transition-all"
              >
                <FileCode2 className="w-4 h-4 text-text-muted" />
                <span>Manage Templates</span>
              </Link>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2 block">Analytics</span>
            <div className="space-y-1">
              <Link 
                to="/" 
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 text-xs font-semibold transition-all"
              >
                <BarChart3 className="w-4 h-4 text-text-muted" />
                <span>Reports Analytics</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Sidebar settings footer */}
        <div className="pt-2 border-t border-surface-tertiary/40">
          <Link 
            to="/" 
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 text-xs font-semibold transition-all"
          >
            <Settings className="w-4 h-4 text-text-muted" />
            <span>Settings</span>
          </Link>
        </div>

      </aside>

      {/* Main Page shell container (adjusts margins on desktop for fixed sidebar) */}
      <div className="flex-1 flex flex-col md:pl-[250px] min-h-screen min-w-0 transition-all duration-200">
        
        {/* 2. TOP HEADER (72px) */}
        <header className="h-[72px] border-b border-surface-tertiary bg-surface-primary flex items-center justify-between px-6 sticky top-0 z-40 theme-transition no-print">
          
          <div className="flex items-center space-x-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-xl text-text-secondary hover:bg-bg-secondary hover:text-text-primary md:hidden flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 leading-tight">
              <h1 className="text-base font-bold text-text-primary truncate">Dashboard</h1>
              <p className="text-[10.5px] text-text-muted font-medium hidden sm:block truncate">
                Welcome back! Here’s an overview of your report activities.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            <ThemeToggle />
            <button className="p-2 rounded-xl text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
              <Bell className="w-4.5 h-4.5" />
            </button>
            <div className="h-4 w-px bg-surface-tertiary hidden sm:block"></div>
            <Link to="/editor">
              <Button variant="primary" size="sm" className="hidden sm:flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Create New Report</span>
              </Button>
            </Link>
            <div className="h-8 w-8 rounded-full bg-surface-secondary border border-surface-tertiary text-text-primary flex items-center justify-center font-bold text-xs shadow-sm">
              SP
            </div>
          </div>

        </header>

        {/* 3. MAIN WORKSPACE CONTENT */}
        <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">
          
          {/* Onboarding getting started banner */}
          <div className="bg-accent-info/30 border border-accent-info/40 rounded-[18px] p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-bold text-text-primary">Getting Started Onboarding</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="flex items-center space-x-2 text-text-primary">
                <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center text-[10px] font-extrabold">1</span>
                <span>Create your first report</span>
              </div>
              <div className="flex items-center space-x-2 text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-surface-tertiary text-text-muted flex items-center justify-center text-[10px] font-extrabold">2</span>
                <span>Configure templates</span>
              </div>
              <div className="flex items-center space-x-2 text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-surface-tertiary text-text-muted flex items-center justify-center text-[10px] font-extrabold">3</span>
                <span>Add departments</span>
              </div>
              <div className="flex items-center space-x-2 text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-surface-tertiary text-text-muted flex items-center justify-center text-[10px] font-extrabold">4</span>
                <span>Enable approval workflows</span>
              </div>
            </div>
          </div>

          {/* KPI summaries row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1 */}
            <KpiCard 
              title="Reports Done"
              value={0}
              subtitle="+0 this semester"
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-accent-primary/15 text-accent-primary"
            />

            {/* KPI 2 */}
            <KpiCard 
              title="Departments"
              value={1}
              subtitle="IT Department active"
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-accent-success/50 dark:bg-accent-success/20 text-green-700 dark:text-accent-success"
            />

            {/* KPI 3 */}
            <KpiCard 
              title="Formats"
              value={1}
              subtitle="KPRCAS IQAC Format"
              icon={<Layout className="w-5 h-5" />}
              iconBg="bg-accent-secondary/30 dark:bg-accent-secondary/20 text-blue-700 dark:text-accent-secondary"
            />

            {/* KPI 4 */}
            <KpiCard 
              title="Avg Edit Time"
              value="0m"
              subtitle="No reports yet"
              icon={<BarChart3 className="w-5 h-5" />}
              iconBg="bg-[#FFE0E5] dark:bg-red-950/40 text-red-600 dark:text-red-400"
            />

          </div>

          {/* Drafts & Templates section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Drafts empty states */}
            <div className="lg:col-span-2 space-y-3 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between border-b border-surface-tertiary pb-2 flex-shrink-0">
                <h2 className="text-base font-bold text-text-primary flex items-center space-x-2">
                  <FileText className="w-4.5 h-4.5 text-accent-primary" />
                  <span>My Document Drafts</span>
                </h2>
                <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">0 Drafts</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-primary border border-surface-tertiary rounded-[18px] text-center space-y-4 shadow-sm min-h-[220px]">
                <div className="p-3.5 rounded-full bg-accent-secondary/15 text-accent-primary">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-text-primary">No drafts yet</h3>
                  <p className="text-xs text-text-secondary max-w-[300px] leading-relaxed">
                    Create your first event report to get started
                  </p>
                </div>
                <Link to="/editor">
                  <Button variant="primary" size="sm" className="px-4 py-2 text-xs font-semibold">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create New Report
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Templates Gallery */}
            <div className="lg:col-span-1 space-y-3 flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-surface-tertiary pb-2 flex-shrink-0">
                <h2 className="text-base font-bold text-text-primary flex items-center space-x-2">
                  <Layout className="w-4.5 h-4.5 text-accent-primary" />
                  <span>IQAC Templates</span>
                </h2>
                <button className="text-[10px] text-accent-primary hover:underline font-bold">
                  Manage Templates
                </button>
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-between">
                
                {/* Active template */}
                <div className="smart-card flex items-center justify-between shadow-sm relative group p-4">
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-success/50 dark:bg-accent-success/20 text-green-800 dark:text-accent-success border border-green-700/10 dark:border-accent-success/20">
                        v1
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-info/50 dark:bg-accent-info/20 text-blue-800 dark:text-accent-info border border-blue-700/10 dark:border-accent-info/20">
                        Default Template
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-text-primary truncate">
                      KPRCAS IQAC Event Report
                    </h3>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Official IQAC event report format for KPRCAS
                    </p>
                  </div>
                  <button className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-secondary">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Dashed placeholder for new template */}
                <div className="smart-card border-dashed border-2 border-surface-tertiary hover:border-accent-primary/60 hover:bg-accent-primary/5 cursor-pointer flex flex-col items-center justify-center py-4 px-4 text-center transition-all group flex-1 min-h-[100px]">
                  <Plus className="w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors mb-1" />
                  <span className="text-xs font-bold text-text-primary group-hover:text-accent-primary transition-colors">Add New Template</span>
                  <span className="text-[9px] text-text-muted mt-0.5">Create custom templates for different event types</span>
                </div>

              </div>
            </div>

          </div>

          {/* Quick Actions widget */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-text-primary">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <Link to="/editor" className="smart-card flex items-center space-x-3.5 hover:-translate-y-0.5 cursor-pointer shadow-sm group p-4">
                <div className="p-2.5 rounded-xl bg-accent-primary/15 text-accent-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Create New Report</h4>
                  <p className="text-[9.5px] text-text-secondary mt-0.5">Start building a new event report</p>
                </div>
              </Link>

              <div className="smart-card flex items-center space-x-3.5 hover:-translate-y-0.5 cursor-pointer shadow-sm group p-4">
                <div className="p-2.5 rounded-xl bg-accent-secondary/25 text-accent-secondary-text flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Import Document</h4>
                  <p className="text-[9.5px] text-text-secondary mt-0.5">Import from Word or PDF</p>
                </div>
              </div>

              <div className="smart-card flex items-center space-x-3.5 hover:-translate-y-0.5 cursor-pointer shadow-sm group p-4">
                <div className="p-2.5 rounded-xl bg-accent-success/50 dark:bg-accent-success/20 text-green-700 dark:text-accent-success flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Browse Templates</h4>
                  <p className="text-[9.5px] text-text-secondary mt-0.5">Use pre-designed templates</p>
                </div>
              </div>

              <div className="smart-card flex items-center space-x-3.5 hover:-translate-y-0.5 cursor-pointer shadow-sm group p-4">
                <div className="p-2.5 rounded-xl bg-accent-gold/45 dark:bg-accent-gold/20 text-yellow-700 dark:text-accent-gold flex-shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">View Analytics</h4>
                  <p className="text-[9.5px] text-text-secondary mt-0.5">Check report statistics</p>
                </div>
              </div>

            </div>
          </div>

          {/* Minimal realistic Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly Reports Compiled empty placeholder */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-base font-bold text-text-primary">Monthly Reports Compiled</h2>
              <div className="smart-card flex flex-col items-center justify-center h-48 text-center space-y-2 relative overflow-hidden p-6">
                <div className="absolute inset-x-8 bottom-10 top-8 flex items-end justify-between opacity-15 pointer-events-none">
                  {[4, 8, 12, 16, 20, 24, 28].map((_, idx) => (
                    <div key={idx} className="flex-1 border-b border-dashed border-text-primary h-[80%] flex items-end">
                      <div className="w-full bg-text-primary h-0.5 opacity-50" />
                    </div>
                  ))}
                </div>
                
                <BarChart3 className="w-7 h-7 text-text-muted z-10" />
                <span className="text-xs font-bold text-text-primary z-10">No report data available yet</span>
                <span className="text-[10px] text-text-secondary z-10">Compile report documents to view statistics</span>
              </div>
            </div>

            {/* Reports by Department (IT 100%) */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-base font-bold text-text-primary">Reports by Department</h2>
              <div className="smart-card flex items-center justify-around h-48 shadow-sm p-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 animate-fade-in" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--surface-tertiary)" strokeWidth="3.2" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--accent-primary)" strokeWidth="3.5" strokeDasharray="100 100" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center leading-none">
                    <span className="text-sm font-extrabold text-text-primary">100%</span>
                    <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">IT Dept</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
                    <span>IT — 100%</span>
                  </div>
                  <span className="text-[9.5px] text-text-secondary block font-semibold pl-4 leading-none">1 Department active</span>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
};
export default DashboardPage;
