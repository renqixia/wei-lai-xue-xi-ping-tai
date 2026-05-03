import React from 'react';
import { Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChineseKnowledgeBannerProps {
    onClick: () => void;
    theme: 'light' | 'dark';
}

export const ChineseKnowledgeBanner = ({ onClick, theme }: ChineseKnowledgeBannerProps) => {
  return (
    <div 
        onClick={onClick}
        className={cn(
            "fixed top-4 left-0 right-0 mx-auto w-[90%] max-w-sm z-[90] cursor-pointer transition-all hover:scale-105 active:scale-95 group",
            "rounded-2xl border p-2 flex items-center gap-3 backdrop-blur-md shadow-lg",
            theme === 'dark' ? "bg-slate-800/80 border-slate-600" : "bg-white/80 border-slate-200"
        )}
    >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
        </div>
        <div className="flex-grow">
            <h3 className={cn(
                "text-sm font-black tracking-tight",
                theme === 'dark' ? "text-white" : "text-slate-900"
            )}>中考语文·全系统学习地图</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chinese Knowledge System Map</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
    </div>
  );
};
