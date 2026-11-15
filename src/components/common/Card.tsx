import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: 'teal' | 'amber' | 'rose' | 'sky' | 'none';
  onClick?: () => void;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  highlight = 'none',
  onClick,
  interactive = false,
}) => {
  const highlightClasses = {
    none: 'border-slate-200/80',
    teal: 'border-teal-400 bg-teal-50/30',
    amber: 'border-amber-400 bg-amber-50/30',
    rose: 'border-rose-400 bg-rose-50/30',
    sky: 'border-sky-400 bg-sky-50/30',
  };

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-teal-500 hover:shadow-elevated transition-all duration-200 transform hover:-translate-y-0.5'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border-2 p-6 shadow-soft ${highlightClasses[highlight]} ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
};
