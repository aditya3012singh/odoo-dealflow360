import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40',
  danger:  'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40',
  info:    'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40',
  purple:  'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${variants[variant]}`}>
      {children}
    </span>
  );
}
