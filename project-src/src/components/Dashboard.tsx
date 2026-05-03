import React from 'react';
import { useAppContext } from '../context/AppContext';
import { vocabularyData } from '../data/vocabulary';
import { BookOpen, Target, Trophy, BrainCircuit, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Dashboard: React.FC = () => {
  const { dailyProgress, dailyGoal, wordStats, selectedCategory, setCurrentView, theme } = useAppContext();

  const categoryWords = vocabularyData.filter(w => w.category === selectedCategory);
  const learnedInCategory = categoryWords.filter(w => wordStats[w.id]).length;
  const progressPercentage = Math.min(100, Math.round((dailyProgress.count / dailyGoal) * 100));

  const now = Date.now();
  const reviewsDue = Object.values(wordStats).filter((stat: any) => stat.nextReviewDate <= now).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-600 dark:text-gray-400">Ready to learn some new words today?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Progress Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-3xl p-6 shadow-sm border",
            theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              Daily Goal
            </h2>
            <span className="text-sm font-medium opacity-60">
              {dailyProgress.count} / {dailyGoal} words
            </span>
          </div>
          
          <div className="relative h-4 bg-slate-500/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
            />
          </div>
          <p className="mt-4 text-sm opacity-60 text-center">
            {progressPercentage >= 100 ? "Goal reached! Great job! 🎉" : "Keep going! You can do it!"}
          </p>
        </motion.div>

        {/* Category Stats Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-3xl p-6 shadow-sm border",
            theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {selectedCategory} Mastery
            </h2>
            <span className="text-sm font-medium opacity-60">
              {learnedInCategory} / {categoryWords.length}
            </span>
          </div>
          
          <div className="relative h-4 bg-slate-500/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(learnedInCategory / categoryWords.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-yellow-500 rounded-full"
            />
          </div>

          <div 
            className="mt-6 flex items-center justify-between p-3 rounded-xl"
            style={{ backgroundColor: 'var(--accent)11' }}
          >
            <div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">Reviews Due</span>
            </div>
            <span className="font-bold" style={{ color: 'var(--accent)' }}>{reviewsDue}</span>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <button 
          onClick={() => setCurrentView('learn')}
          className="flex items-center justify-center gap-3 text-white p-6 rounded-2xl text-xl font-semibold transition-all shadow-lg hover:scale-[1.02] active:scale-95"
          style={{ 
            backgroundColor: 'var(--accent)',
            boxShadow: '0 10px 15px -3px var(--accent)44'
          }}
        >
          <BookOpen className="w-6 h-6" />
          Learn / Review
        </button>
        <button 
          onClick={() => setCurrentView('quiz')}
          className="flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-2xl text-xl font-semibold transition-colors shadow-sm"
        >
          <BrainCircuit className="w-6 h-6" />
          Take a Quiz
        </button>
      </div>
    </div>
  );
};
