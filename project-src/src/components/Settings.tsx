import React from 'react';
import { useAppContext } from '../context/AppContext';
import { WordCategory } from '../data/vocabulary';
import { Moon, Sun, Target, BookA, Palette } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Settings: React.FC = () => {
  const { 
    theme, setTheme, 
    dailyGoal, setDailyGoal, 
    selectedCategory, setSelectedCategory,
    bgColor, setBgColor
  } = useAppContext();

  const categories: WordCategory[] = ['KET', 'PET', 'Essential'];
  const bgColors = [
    { name: 'Default', class: 'bg-gray-50' },
    { name: 'Warm', class: 'bg-orange-50' },
    { name: 'Cool', class: 'bg-blue-50' },
    { name: 'Nature', class: 'bg-green-50' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      <div className={cn(
        "rounded-3xl p-6 shadow-sm border space-y-8",
        theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
      )}>
        
        {/* Vocabulary Category */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <BookA className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            Vocabulary Level
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="py-3 px-4 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: selectedCategory === cat ? 'var(--accent)' : 'rgba(128, 128, 128, 0.1)',
                  color: selectedCategory === cat ? '#white' : 'inherit'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <hr className="opacity-10" />

        {/* Daily Goal */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            Daily Goal (Words)
          </h3>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="5"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full h-2 bg-slate-500/10 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span className="text-xl font-bold w-12 text-center" style={{ color: 'var(--accent)' }}>
              {dailyGoal}
            </span>
          </div>
        </div>

        <hr className="opacity-10" />

        {/* Theme */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            Appearance
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                theme === 'light' ? "bg-slate-900 text-white" : "bg-slate-500/10"
              )}
            >
              <Sun className="w-4 h-4" /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
              )}
              style={{
                backgroundColor: theme === 'dark' ? 'var(--accent)' : 'rgba(128, 128, 128, 0.1)',
                color: theme === 'dark' ? 'white' : 'inherit'
              }}
            >
              <Moon className="w-4 h-4" /> Dark
            </button>
          </div>
        </div>

        <hr className="border-gray-100 dark:border-gray-700" />

        {/* Background Color (Light mode only) */}
        <div className={theme === 'dark' ? 'opacity-50 pointer-events-none' : ''}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-pink-500" />
            Background Tint (Light Mode)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bgColors.map(color => (
              <button
                key={color.name}
                onClick={() => setBgColor(color.class)}
                className={`py-3 px-4 rounded-xl font-medium transition-all border-2 ${color.class} ${
                  bgColor === color.class 
                    ? 'border-accent text-accent' 
                    : 'border-transparent text-gray-700 hover:border-gray-300'
                }`}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
