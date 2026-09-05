import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
