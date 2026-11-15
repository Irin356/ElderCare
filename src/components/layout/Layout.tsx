import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Heart, ShieldCheck, Accessibility } from 'lucide-react';
import { useCare } from '../../context/CareContext';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const { isDemoMode, isLoading, persistenceError, clearPersistenceError } = useCare();

  return (
    <div
      className={`min-h-screen bg-slate-50 flex flex-col transition-all ${
        largeText ? 'text-lg text-slate-900 leading-relaxed' : 'text-base text-slate-800'
      }`}
    >
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        largeText={largeText}
        onToggleLargeText={() => setLargeText((prev) => !prev)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-200 lg:pl-72 sm:lg:pl-80 p-4 sm:p-6 lg:p-8 min-w-0 ${
            largeText ? 'space-y-8' : 'space-y-6'
          }`}
        >
          {isDemoMode && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Demo Mode — sample care data is stored on this device only. Do not enter real health information.
            </div>
          )}
          {isLoading && (
            <div role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Loading care data from Supabase…
            </div>
          )}
          {persistenceError && (
            <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <span>{persistenceError}</span>
              <button
                type="button"
                onClick={clearPersistenceError}
                className="shrink-0 font-bold underline"
              >
                Dismiss
              </button>
            </div>
          )}
          <Outlet context={{ largeText }} />
        </main>
      </div>

      {/* Accessible Healthcare Footer */}
      <footer className="bg-white border-t-2 border-slate-200 mt-auto lg:pl-72 sm:lg:pl-80 py-6 px-4 sm:px-8 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Heart className="w-4 h-4 text-teal-600 fill-teal-600" />
            <span>ElderCare Compassionate Platform • Hackathon 2026 Edition</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            {!isDemoMode && (
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Access controlled by Supabase RLS
              </span>
            )}
            <span className="flex items-center gap-1">
              <Accessibility className="w-4 h-4 text-teal-600" /> Accessibility features
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
