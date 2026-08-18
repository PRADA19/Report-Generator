// frontend/src/pages/Settings/index.tsx
import React from 'react';
import { Shield, User, Palette } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Badge } from '../../components/common/Badge';

export const SettingsPage: React.FC = () => {
  return (
    <DashboardLayout 
      pageTitle="Settings" 
      pageSubtitle="Configure institutional preferences, system defaults, and theme options."
    >
      <div className="max-w-4xl space-y-6">
        
        {/* Account & Institutional Information */}
        <div className="bg-surface-primary border border-surface-tertiary rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-surface-tertiary/60">
            <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Institutional Account</h3>
              <p className="text-xs text-text-muted">Manage department and organization profile settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted block font-semibold">Application Title</span>
              <span className="font-bold text-text-primary text-sm">Report Generator</span>
            </div>
            <div>
              <span className="text-text-muted block font-semibold">Institution Code</span>
              <span className="font-bold text-text-primary text-sm">IQAC-2026</span>
            </div>
            <div>
              <span className="text-text-muted block font-semibold">Current Department</span>
              <span className="font-bold text-text-primary text-sm">Department of Information Technology</span>
            </div>
            <div>
              <span className="text-text-muted block font-semibold">Role</span>
              <Badge variant="purple">Administrator</Badge>
            </div>
          </div>
        </div>

        {/* Theme & Display Settings */}
        <div className="bg-surface-primary border border-surface-tertiary rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-tertiary/60">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-accent-secondary/15 text-accent-secondary">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Appearance & Theme</h3>
                <p className="text-xs text-text-muted">Toggle dark mode and interface themes.</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            The Report Generator supports high-contrast institutional dark mode and light mode across all pages and report preview builders.
          </p>
        </div>

        {/* Security & System Info */}
        <div className="bg-surface-primary border border-surface-tertiary rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-surface-tertiary/60">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">System Compliance</h3>
              <p className="text-xs text-text-muted">NAAC/IQAC accreditation compliance standards enabled.</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>Version Status</span>
            <Badge variant="success">Active v2.0 Enterprise</Badge>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
