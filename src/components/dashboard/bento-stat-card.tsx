'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

export interface BentoStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string | number;
  isPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'glass' | 'gradient-urgent';
  badgeText?: string;
  onClick?: () => void;
}

export function BentoStatCard({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  variant = 'glass',
  badgeText,
  onClick,
}: BentoStatCardProps) {
  if (variant === 'gradient-urgent') {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        onClick={onClick}
        className="cursor-pointer p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col justify-between"
      >
        {/* Background glow & waves */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <p className="text-xs font-bold uppercase tracking-wider text-white/90">
                {title}
              </p>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono mt-2">
              {value}
            </h3>
          </div>

          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white">
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-white/90 relative z-10 pt-2 border-t border-white/20">
          <span className="font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {subtitle || 'Segera jadwalkan distribusi'}
          </span>
          {badgeText && (
            <span className="px-2 py-0.5 rounded-full bg-white text-orange-600 font-extrabold text-[10px] shadow-sm uppercase">
              {badgeText}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131b2a] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-900/5 dark:shadow-black/40 transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-emerald-500/50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-mono mt-1">
            {value}
          </h3>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
          <Icon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          {subtitle || 'Status operasional'}
        </span>

        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 font-bold ${
              isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
