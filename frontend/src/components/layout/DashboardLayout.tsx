// frontend/src/components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Library, 
  Settings, 
  Bell, 
  Menu, 
  X, 
  Sparkles 
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle = "Dashboard",
  pageSubtitle = "Welcome back! Manage your report templates and generate reports."
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Generate Report', path: '/generate-report', icon: FileText },
    { label: 'Template Library', path: '/templates', icon: Library },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex font-sans theme-transition relative overflow-x-hidden">
      
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* 1. LEFT SIDEBAR (250px) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[250px] bg-surface-primary border-r border-surface-tertiary flex flex-col p-5 space-y-6 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Branding header: Report Generator */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-tertiary/60">
          <Link to="/" className="flex items-center space-x-3 group min-w-0">
            <div className="p-2.5 rounded-xl bg-accent-primary text-white shadow-md shadow-accent-primary/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <h2 className="text-xs font-black text-text-primary uppercase tracking-tight truncate">
                Report Generator
              </h2>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-tertiary rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 pt-2">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2 block">
            Navigation
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active 
                    ? 'bg-accent-primary text-white shadow-md shadow-accent-primary/20 font-bold' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-text-muted'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="pt-3 border-t border-surface-tertiary/60 text-center">
          <span className="text-[10px] text-text-muted font-medium block">
            Institutional SaaS v2.0
          </span>
        </div>

      </aside>

      {/* Main Page Shell Container */}
      <div className="flex-1 flex flex-col md:pl-[250px] min-h-screen min-w-0 transition-all duration-200">
        
        {/* 2. TOP HEADER (72px) */}
        <header className="h-[72px] border-b border-surface-tertiary bg-surface-primary flex items-center justify-between px-6 sticky top-0 z-40 theme-transition no-print">
          
          <div className="flex items-center space-x-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-text-secondary hover:bg-bg-secondary hover:text-text-primary md:hidden flex-shrink-0 border border-surface-tertiary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 leading-tight">
              <h1 className="text-base font-bold text-text-primary truncate">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="text-[11px] text-text-muted font-medium hidden sm:block truncate mt-0.5">
                  {pageSubtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            <ThemeToggle />
            <button className="p-2 rounded-xl text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors relative">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-primary" />
            </button>
            <div className="h-4 w-px bg-surface-tertiary hidden sm:block" />
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-full bg-accent-primary text-white flex items-center justify-center font-bold text-xs shadow-md shadow-accent-primary/20">
                SP
              </div>
            </div>
          </div>

        </header>

        {/* 3. MAIN CONTENT SLOT */}
        <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">
          {children}
        </main>

      </div>

    </div>
  );
};
