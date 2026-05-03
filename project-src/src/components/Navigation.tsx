import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Home, BookOpen, BrainCircuit, Settings as SettingsIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navigation: React.FC = () => {
  const { currentView, setCurrentView, theme } = useAppContext();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'learn', icon: BookOpen, label: 'Learn' },
    { id: 'quiz', icon: BrainCircuit, label: 'Quiz' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ] as const;

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 w-full border-t pb-safe z-50 backdrop-blur-md",
        theme === 'dark' ? "bg-slate-900/80 border-white/10" : "bg-white/80 border-slate-200"
      )}
    >
      <div className="max-w-md mx-auto px-6 h-20 flex items-center justify-between">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentView(id as any)}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-all"
              style={{
                color: isActive ? 'var(--accent)' : 'inherit',
                opacity: isActive ? 1 : 0.5
              }}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current opacity-20")} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
