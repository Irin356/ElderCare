import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold gap-1.5',
    md: 'px-3.5 py-1 text-sm font-bold gap-2',
    lg: 'px-4 py-1.5 text-base font-bold gap-2.5',
  };

  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    warning: 'bg-amber-100 text-amber-900 border border-amber-300',
    danger: 'bg-rose-100 text-rose-900 border border-rose-300',
    info: 'bg-sky-100 text-sky-900 border border-sky-300',
    neutral: 'bg-slate-100 text-slate-800 border border-slate-300',
    teal: 'bg-teal-100 text-teal-900 border border-teal-300',
    purple: 'bg-purple-100 text-purple-900 border border-purple-300',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full uppercase tracking-wide ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
