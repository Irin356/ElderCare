import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'outline'
    | 'ghost'
    | 'soft-teal'
    | 'amber'
    | 'emerald'
    | 'purple';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'lg',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-[42px] gap-2 font-semibold',
      md: 'px-5 py-2.5 text-base min-h-[48px] gap-2.5 font-semibold',
      lg: 'px-6 py-3.5 text-lg min-h-[56px] gap-3 font-bold',
      xl: 'px-8 py-4 text-xl min-h-[64px] gap-3.5 font-extrabold',
    };

    const variantClasses = {
      primary:
        'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-md hover:shadow-lg focus:ring-4 focus:ring-teal-200 border-2 border-teal-600',
      secondary:
        'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 shadow-md hover:shadow-lg focus:ring-4 focus:ring-sky-200 border-2 border-sky-600',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-md hover:shadow-lg focus:ring-4 focus:ring-rose-200 border-2 border-rose-600 animate-pulse-subtle',
      outline:
        'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-300 hover:border-slate-400 focus:ring-4 focus:ring-slate-200',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:ring-4 focus:ring-slate-200',
      'soft-teal':
        'bg-teal-50 text-teal-800 hover:bg-teal-100 active:bg-teal-200 border-2 border-teal-200 focus:ring-4 focus:ring-teal-100',
      amber:
        'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-200 border-2 border-amber-600',
      emerald:
        'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-md hover:shadow-lg focus:ring-4 focus:ring-emerald-200 border-2 border-emerald-600',
      purple:
        'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 shadow-md hover:shadow-lg focus:ring-4 focus:ring-purple-200 border-2 border-purple-600',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-2xl transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
