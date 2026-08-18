// frontend/src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'secondary', 
  size = 'md', 
  className = '', 
  disabled, 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold transition-all duration-150 ease-out select-none focus:outline-none focus:ring-2 focus:ring-accent-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:active:scale-100 theme-transition";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-[10px]",
    md: "px-[18px] py-3 text-sm rounded-[12px]",
    lg: "px-6 py-3.5 text-base rounded-[14px]"
  };
  
  const variantStyles = {
    primary: "bg-accent-primary text-white shadow-sm hover:bg-accent-primary-hover border border-accent-primary/10",
    secondary: "bg-accent-secondary text-accent-secondary-text border border-surface-tertiary shadow-sm hover:bg-accent-secondary-hover",
    ghost: "bg-transparent text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
    danger: "bg-red-500 text-white hover:bg-red-600 border border-red-500/10 active:scale-[0.98]"
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;
