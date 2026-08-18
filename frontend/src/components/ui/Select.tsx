// frontend/src/components/ui/Select.tsx
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  children,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-text-secondary block">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`w-full bg-surface-primary border border-surface-tertiary rounded-[12px] px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 theme-transition cursor-pointer ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
});
Select.displayName = 'Select';
export default Select;
