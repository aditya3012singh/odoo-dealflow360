import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-64">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Construction className="w-6 h-6 text-slate-500 dark:text-zinc-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">{title}</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-xs">{description}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 px-4 py-2 rounded-lg text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-500 rounded-full animate-pulse" />
          Coming in next phase
        </div>
      </div>
    </div>
  );
}
