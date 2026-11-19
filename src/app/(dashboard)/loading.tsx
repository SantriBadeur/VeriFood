import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 sm:w-64 bg-slate-200/80 rounded-xl" />
          <div className="h-4 w-64 sm:w-80 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-slate-200/80 rounded-xl" />
      </div>

      {/* Top Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between gap-4 h-28"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200/70 rounded-md" />
              <div className="w-8 h-8 rounded-full bg-slate-100" />
            </div>
            <div className="h-6 w-32 bg-slate-200/80 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-5 w-40 bg-slate-200/80 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            <div className="h-8 w-24 bg-slate-100 rounded-lg" />
          </div>
        </div>

        {/* Skeleton Table Rows */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-12 w-full bg-slate-50 rounded-xl flex items-center px-4 justify-between"
            >
              <div className="h-4 w-36 bg-slate-200/60 rounded-md" />
              <div className="h-4 w-24 bg-slate-200/60 rounded-md hidden sm:block" />
              <div className="h-4 w-20 bg-slate-200/60 rounded-md" />
              <div className="h-6 w-16 bg-slate-200/70 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

