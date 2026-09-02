// frontend/src/components/common/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'purple' | 'outline' | 'danger';
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', title }) => {
  const variantStyles = {
    default: 'bg-surface-tertiary text-text-secondary border-surface-tertiary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    purple: 'bg-accent-primary/15 text-accent-primary border-accent-primary/20',
    outline: 'bg-transparent text-text-muted border-surface-tertiary',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  };

  return (
    <span title={title} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border transition-colors ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
