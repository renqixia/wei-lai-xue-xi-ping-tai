import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WordCategory } from '../data/vocabulary';

export interface WordStat {
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: number;
}

interface AppState {
  currentView: 'dashboard' | 'learn' | 'quiz' | 'settings';
  selectedCategory: WordCategory;
  wordStats: Record<string, WordStat>;
  dailyProgress: { date: string; count: number };
  dailyGoal: number;
  theme: 'light' | 'dark';
  bgColor: string;
}

interface AppContextType extends AppState {
  setCurrentView: (view: AppState['currentView']) => void;
  setSelectedCategory: (category: WordCategory) => void;
  reviewWord: (wordId: string, quality: number) => void;
  setDailyGoal: (goal: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setBgColor: (color: string) => void;
}

const defaultState: AppState = {
  currentView: 'dashboard',
  selectedCategory: 'KET',
  wordStats: {},
  dailyProgress: { date: new Date().toISOString().split('T')[0], count: 0 },
  dailyGoal: 20,
  theme: 'light',
  bgColor: 'bg-gray-50',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ 
  children: ReactNode;
  globalTheme?: 'light' | 'dark';
  setGlobalTheme?: (theme: 'light' | 'dark') => void;
  userName?: string;
}> = ({ children, globalTheme, setGlobalTheme, userName }) => {
  const [state, setState] = useState<AppState>(defaultState);

  // Load user-specific data
  useEffect(() => {
    const storageKey = userName ? `vocabAppState_${userName}` : 'vocabAppState_guest';
    const saved = localStorage.getItem(storageKey);
    const today = new Date().toISOString().split('T')[0];

    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Daily Reset Logic for English Module
      if (parsed.dailyProgress?.date !== today) {
        // Reset daily count but keep word stats and category
        setState({
          ...defaultState,
          ...parsed,
          dailyProgress: { date: today, count: 0 },
          theme: globalTheme || parsed.theme || defaultState.theme
        });
      } else {
        setState({
          ...defaultState,
          ...parsed,
          theme: globalTheme || parsed.theme || defaultState.theme
        });
      }
    } else {
      // New user or guest
      setState({
        ...defaultState,
        theme: globalTheme || defaultState.theme
      });
    }
  }, [userName, globalTheme]);

  // Save user-specific data
  useEffect(() => {
    if (state === defaultState) return; // Don't save initial default state
    
    const storageKey = userName ? `vocabAppState_${userName}` : 'vocabAppState_guest';
    localStorage.setItem(storageKey, JSON.stringify(state));
    
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (setGlobalTheme && state.theme !== globalTheme) {
      setGlobalTheme(state.theme);
    }
  }, [state, userName, setGlobalTheme, globalTheme]);

  const setCurrentView = (view: AppState['currentView']) => setState(s => ({ ...s, currentView: view }));
  const setSelectedCategory = (category: WordCategory) => setState(s => ({ ...s, selectedCategory: category }));
  
  const reviewWord = (wordId: string, quality: number) => {
    setState(s => {
      const stat = s.wordStats[wordId] || { interval: 0, repetition: 0, easeFactor: 2.5, nextReviewDate: 0 };
      let { interval, repetition, easeFactor } = stat;

      // SuperMemo-2 Algorithm simplified
      if (quality >= 3) {
        if (repetition === 0) interval = 1;
        else if (repetition === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetition += 1;
      } else {
        repetition = 0;
        interval = 1;
      }

      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;
      const today = new Date().toISOString().split('T')[0];
      const newCount = s.dailyProgress.date === today ? s.dailyProgress.count + 1 : 1;

      return {
        ...s,
        wordStats: { ...s.wordStats, [wordId]: { interval, repetition, easeFactor, nextReviewDate } },
        dailyProgress: { date: today, count: newCount }
      };
    });
  };

  const setDailyGoal = (goal: number) => setState(s => ({ ...s, dailyGoal: goal }));
  const setTheme = (theme: 'light' | 'dark') => setState(s => ({ ...s, theme }));
  const setBgColor = (color: string) => setState(s => ({ ...s, bgColor: color }));

  return (
    <AppContext.Provider value={{
      ...state,
      setCurrentView,
      setSelectedCategory,
      reviewWord,
      setDailyGoal,
      setTheme,
      setBgColor
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
