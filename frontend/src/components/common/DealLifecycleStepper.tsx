import React from 'react';
import { Check, Clock, PackageCheck, Truck, ShoppingCart, ShieldAlert, Sparkles } from 'lucide-react';

export type DealStageKey = 
  | 'DRAFT'
  | 'GOVERNANCE'
  | 'PORTAL_NEGOTIATION'
  | 'ORDER_CONFIRMED'
  | 'WAREHOUSE_SPLIT'
  | 'DISPATCHED_DELIVERED';

export interface DealLifecycleStepperProps {
  status: string; // e.g. 'DRAFT', 'APPROVED', 'UNDER_NEGOTIATION', 'PENDING_MANAGER', 'CONVERTED_TO_ORDER', 'CONFIRMED'
  createdAt?: string;
  updatedAt?: string;
  orderNumber?: string;
  quotationNumber?: string;
  className?: string;
}

interface StepConfig {
  id: DealStageKey;
  title: string;
  subtitle: string;
  activeSubtitle: string;
  completedSubtitle: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  {
    id: 'DRAFT',
    title: 'Quotation Drafted',
    subtitle: 'Commercial specs prepared',
    activeSubtitle: 'Building quotation...',
    completedSubtitle: 'Quotation initiated',
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
  },
  {
    id: 'GOVERNANCE',
    title: 'Margin & Governance',
    subtitle: 'Tier allowance check',
    activeSubtitle: 'Under Manager Review',
    completedSubtitle: 'Auto-Approved ✓',
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
  },
  {
    id: 'PORTAL_NEGOTIATION',
    title: 'Portal Negotiation',
    subtitle: 'Customer review & acceptance',
    activeSubtitle: 'Ready for Confirmation',
    completedSubtitle: 'Terms Accepted ✓',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  {
    id: 'ORDER_CONFIRMED',
    title: 'Order & Invoiced',
    subtitle: 'Sales Order converted',
    activeSubtitle: 'Generating Sales Order',
    completedSubtitle: 'Order Placed ✓',
    icon: <PackageCheck className="w-3.5 h-3.5" />,
  },
  {
    id: 'WAREHOUSE_SPLIT',
    title: 'Warehouse Allocation',
    subtitle: 'Multi-hub inventory routing',
    activeSubtitle: 'Allocating BLR & BOM hubs',
    completedSubtitle: 'Stock Reserved & Packed',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  {
    id: 'DISPATCHED_DELIVERED',
    title: 'Dispatched & Delivered',
    subtitle: 'Carrier tracking & receipt',
    activeSubtitle: 'In Transit via Logistics Hub',
    completedSubtitle: 'Delivered to Customer ✓',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
];

export function DealLifecycleStepper({
  status,
  createdAt,
  updatedAt,
  orderNumber,
  quotationNumber,
  className = '',
}: DealLifecycleStepperProps) {
  // Compute the numeric step index (0 to 5) based on quotation / order status
  let activeIndex = 0;
  const upperStatus = (status || 'DRAFT').toUpperCase();

  switch (upperStatus) {
    case 'DRAFT':
      activeIndex = 0;
      break;
    case 'PENDING_MANAGER':
    case 'PENDING_FINANCE':
      activeIndex = 1;
      break;
    case 'APPROVED':
    case 'UNDER_NEGOTIATION':
      // Approved or under portal negotiation = stage 2 (waiting for customer confirmation)
      activeIndex = 2;
      break;
    case 'CONVERTED_TO_ORDER':
    case 'ORDER_PLACED':
      activeIndex = 3;
      break;
    case 'CONFIRMED':
    case 'PROCESSING':
    case 'ALLOCATED':
    case 'PARTIALLY_FULFILLED':
      activeIndex = 4;
      break;
    case 'DISPATCHED':
    case 'SHIPPED':
    case 'DELIVERED':
    case 'FULFILLED':
      activeIndex = 5;
      break;
    default:
      activeIndex = 0;
  }

  return (
    <div className={`w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors ${className}`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100 dark:border-zinc-800/80 mb-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
            End-to-End Deal Journey
          </h3>
          {quotationNumber && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              {quotationNumber}
            </span>
          )}
          {orderNumber && (
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
              {orderNumber}
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
          <span>Current Milestone:</span>
          <span className="font-semibold text-slate-900 dark:text-white px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
            {STEPS[activeIndex].title}
          </span>
        </div>
      </div>

      {/* Horizontal Stepper Timeline */}
      <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin">
        <div className="min-w-[760px] relative">
          {/* Main Track Background Line */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full z-0" />

          {/* Active Progress Track Line */}
          <div
            className="absolute top-5 left-8 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 rounded-full z-0 transition-all duration-700 ease-out"
            style={{
              width: `${(activeIndex / (STEPS.length - 1)) * 92}%`,
            }}
          />

          {/* Stepper Nodes */}
          <div className="relative z-10 flex justify-between items-start">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < activeIndex;
              const isActive = idx === activeIndex;
              const isUpcoming = idx > activeIndex;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center text-center group cursor-default"
                  style={{ width: `${100 / STEPS.length}%` }}
                >
                  {/* Node Icon Circle */}
                  <div className="relative mb-3 flex items-center justify-center">
                    {/* Pulsing ambient halo for active node */}
                    {isActive && (
                      <span className="absolute -inset-2 rounded-full bg-purple-500/20 dark:bg-purple-400/20 animate-ping duration-1000" />
                    )}

                    {isCompleted && (
                      <div className="w-10 h-10 rounded-full bg-purple-700 dark:bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 transition-transform duration-200 group-hover:scale-105">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    )}

                    {isActive && (
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border-4 border-purple-600 dark:border-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30 ring-4 ring-purple-100 dark:ring-purple-950/60 z-10">
                        <div className="w-3.5 h-3.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse" />
                      </div>
                    )}

                    {isUpcoming && (
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800/80 border-2 border-slate-300 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 flex items-center justify-center transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Stage Title */}
                  <h4
                    className={`text-xs font-bold tracking-tight mb-1 transition-colors px-1 ${
                      isActive
                        ? 'text-purple-700 dark:text-purple-300'
                        : isCompleted
                        ? 'text-slate-900 dark:text-zinc-100'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {step.title}
                  </h4>

                  {/* Subtitle / Micro Status */}
                  <p
                    className={`text-[11px] leading-tight max-w-[120px] ${
                      isActive
                        ? 'font-semibold text-purple-600 dark:text-purple-400'
                        : isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-400 dark:text-zinc-600'
                    }`}
                  >
                    {isCompleted
                      ? step.completedSubtitle
                      : isActive
                      ? step.activeSubtitle
                      : step.subtitle}
                  </p>

                  {/* Contextual Timestamp / Date note */}
                  {isCompleted && idx === 0 && createdAt && (
                    <span className="text-[10px] text-slate-400 font-mono mt-1">
                      {createdAt.slice(0, 10)}
                    </span>
                  )}
                  {isActive && updatedAt && (
                    <span className="text-[10px] text-purple-500 dark:text-purple-400 font-mono mt-1">
                      Updated {updatedAt.slice(0, 10)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
