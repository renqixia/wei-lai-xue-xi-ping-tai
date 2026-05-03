import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, Trophy, Brain, BookOpen, Clock, ChevronRight, Calendar } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ReviewWindow = ({ onClose, theme }: { onClose: () => void, theme: 'light' | 'dark' }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!auth.currentUser) return;
      const path = 'reviews';
      try {
        const q = query(
          collection(db, path),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        // Handle index error or permission error
        console.warn('Firestore fetch failed (likely missing index):', err);
        // Fallback or handle later
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "w-full max-w-2xl h-[80vh] rounded-[3rem] border p-12 shadow-2xl overflow-hidden flex flex-col",
          theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black italic tracking-tight">我的复盘记录</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Review History</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-slate-500/10 hover:bg-slate-500/20 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8 flex-grow overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">正在调取云端复盘数据...</p>
                </div>
            ) : reviews.length > 0 ? (
                reviews.map((review, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={review.id} 
                      className={cn(
                        "p-6 rounded-[2rem] border group hover:border-accent transition-all cursor-pointer",
                        theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    <Calendar className="w-4 h-4 text-accent" />
                                </div>
                                <div className="text-sm font-black">{new Date(review.date || review.createdAt?.toDate()).toLocaleDateString()}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="text-sm text-slate-400 line-clamp-3 italic">
                            “{review.insight.slice(0, 150)}...”
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-500/5 rounded-[2rem] flex items-center justify-center">
                        <Brain className="w-10 h-10 text-slate-700" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">尚无复盘数据</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">每一个顶级天才都来自于不断的深度反思，开启你的第一次复盘吧！</p>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-500/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 123}`} alt="user" />
                        </div>
                    ))}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">已有 12,402 位精英加入复盘计划</span>
            </div>
            <button className="px-6 py-3 bg-accent text-white font-black rounded-xl text-xs hover:scale-105 transition-transform">
                导出周报
            </button>
        </div>
      </motion.div>
    </div>
  );
};

import { Loader2 } from 'lucide-react';
