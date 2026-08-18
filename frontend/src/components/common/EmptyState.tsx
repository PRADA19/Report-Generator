// frontend/src/components/common/EmptyState.tsx
import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No templates available",
  description = "Create your first template to start generating reports.",
  actionText = "Create Template",
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-surface-primary border border-surface-tertiary rounded-2xl text-center space-y-4 shadow-sm my-6">
      <div className="p-4 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
        {icon || <FileText className="w-10 h-10" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      </div>
      {onAction && (
        <Button onClick={onAction} variant="primary" size="sm" className="mt-2">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{actionText}</span>
        </Button>
      )}
    </div>
  );
};
