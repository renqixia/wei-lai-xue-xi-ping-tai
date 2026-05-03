import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Book, ChevronRight } from 'lucide-react';
import { CHINESE_SYSTEM_DATA } from '../data/chineseTopic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChineseKnowledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
}

// Hotspot coordinates (percentage based relative to image container)
const HOTSPOTS = [
    { top: 25, left: 50 }, // 汉字系统
    { top: 40, left: 35 }, // 古诗文
    { top: 40, left: 65 }, // 文言文
    { top: 60, left: 25 }, // 阅读
    { top: 60, left: 75 }, // 写作
];

export const ChineseKnowledgeModal = ({ isOpen, onClose, theme }: ChineseKnowledgeModalProps) => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={cn(
                            "relative w-full max-w-4xl max-h-[90vh] rounded-3xl p-6 shadow-2xl overflow-hidden border",
                            theme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/20">
                            <X size={20} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            {/* Image Part - Map Representation */}
                            <div className={cn(
                                "relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4",
                                theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-orange-50 border-orange-100"
                            )}>
                                {/* Decorative Map Background */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M10,25 Q30,15 50,25 T90,25" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                        <path d="M20,40 Q40,30 60,40 T80,40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                        <path d="M15,60 Q35,50 55,60 T75,60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.1" />
                                    </svg>
                                </div>

                                {/* Flow Lines between Hotspots */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {/* Lines from Center (汉字系统) to others */}
                                    <motion.path 
                                        d="M50,25 L35,40 M50,25 L65,40" 
                                        stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2,2"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <motion.path 
                                        d="M35,40 L25,60 M65,40 L75,60" 
                                        stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2,2"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                    />
                                </svg>
                                
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-[80px] font-black opacity-5 select-none -rotate-12">语文地图</div>
                                </div>

                                {/* Hotspots */}
                                {HOTSPOTS.map((pos, idx) => (
                                    <div 
                                        key={idx} 
                                        className="absolute transition-all"
                                        style={{ top: `${pos.top}%`, left: `${pos.left}%`, transform: 'translate(-50%, -50%)' }}
                                    >
                                        <button
                                            className={cn(
                                                "w-8 h-8 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-all",
                                                selectedCategory === idx 
                                                    ? "bg-red-500 scale-125 ring-4 ring-red-500/30" 
                                                    : "bg-amber-500 hover:scale-110"
                                            )}
                                            onClick={() => setSelectedCategory(idx)}
                                        >
                                            <span className="text-white text-[10px] font-black">{idx + 1}</span>
                                        </button>
                                        <div className={cn(
                                            "mt-2 whitespace-nowrap text-[10px] font-black px-2 py-0.5 rounded bg-white/90 shadow-sm text-slate-900 border border-slate-200",
                                            selectedCategory === idx ? "opacity-100 scale-100" : "opacity-60 scale-90"
                                        )}>
                                            {CHINESE_SYSTEM_DATA[idx].title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Content Part */}
                            <div className="flex flex-col overflow-hidden">
                                {selectedCategory !== null ? (
                                    <div className="h-full overflow-y-auto space-y-4 pr-2">
                                        <h2 className="text-2xl font-black">{CHINESE_SYSTEM_DATA[selectedCategory].title}</h2>
                                        <p className="text-sm border-l-4 border-amber-500 pl-4 py-2 bg-amber-500/10 italic">
                                            {CHINESE_SYSTEM_DATA[selectedCategory].principle}
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {CHINESE_SYSTEM_DATA[selectedCategory].blocks.map((b, bi) => (
                                                <div key={bi} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                    <h4 className="font-bold text-sm mb-1">{b.title}</h4>
                                                    <p className="text-xs text-slate-500">{b.content.join(' ')}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2 mt-4">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                <ChevronRight className="w-4 h-4 text-amber-500" />
                                                极速进阶路径
                                            </h4>
                                            <div className="space-y-1">
                                                {CHINESE_SYSTEM_DATA[selectedCategory].steps.map((s, si) => (
                                                    <div key={si} className="flex gap-2 text-[10px] text-slate-500">
                                                        <span className="font-black text-amber-500">{si + 1}.</span>
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white mt-4 border border-white/10">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">达成目标</h4>
                                            <p className="text-xs font-medium leading-relaxed">{CHINESE_SYSTEM_DATA[selectedCategory].goal}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500">
                                        点击地图上的红点查看系统详解
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
