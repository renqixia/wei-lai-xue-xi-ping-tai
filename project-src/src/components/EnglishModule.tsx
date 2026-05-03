import React from 'react';
import { AppProvider, useAppContext } from '../context/AppContext';
import { Dashboard } from './Dashboard';
import { Learn } from './Learn';
import { Quiz } from './Quiz';
import { Settings } from './Settings';
import { Navigation } from './Navigation';
import { ArrowLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EnglishContent: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentView, bgColor, theme } = useAppContext();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'learn': return <Learn />;
      case 'quiz': return <Quiz />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={cn(
      "w-full h-full overflow-y-auto pb-24 transition-colors duration-300",
      "text-[var(--app-text)]"
    )} style={{ background: 'var(--app-bg-gradient, var(--app-bg))' }}>
      <div className="sticky top-0 z-40 p-4 flex items-center justify-between backdrop-blur-md">
        <button 
          onClick={onBack}
          className={cn(
            "p-3 rounded-2xl border backdrop-blur-xl transition-all flex items-center gap-2 shadow-sm group",
            theme === 'dark' ? "bg-slate-900/40 border-white/10 text-slate-400 hover:text-white" : "bg-white/40 border-white/20 text-slate-500 hover:text-slate-900"
          )}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">返回课程选择</span>
        </button>
      </div>
      <main className="pt-4">
        {renderView()}
      </main>
      <Navigation />
    </div>
  );
};

export const EnglishModule: React.FC<{ 
  onBack: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  userName?: string;
}> = ({ onBack, theme, setTheme, userName }) => {
  return (
    <AppProvider globalTheme={theme} setGlobalTheme={setTheme} userName={userName}>
      <EnglishContent onBack={onBack} />
    </AppProvider>
  );
};
