import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  ArrowLeft,
  ChevronRight,
  Target,
  BarChart2,
  X,
  LineChart as LineChartIcon,
  Brain,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Trophy,
  Activity,
  Lightbulb,
  Compass,
  Zap,
  BookOpen
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line
} from 'recharts';
import ExamDiagnosis from './ExamDiagnosis';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GradeEntry {
  id: string;
  subject: string;
  score: number;
  totalScore: number;
  date: string;
  examName: string;
  takeaway: string;
  images?: string[];
}

interface GradeRegistrationProps {
  theme: 'light' | 'dark';
  onClose: () => void;
}

const initialSubjects = [
  { id: 'chinese', name: '语文', color: 'bg-rose-500', icon: BookOpen },
  { id: 'math', name: '数学', color: 'bg-accent text-white', icon: Compass },
  { id: 'english', name: '英语', color: 'bg-amber-500', icon: Lightbulb },
  { id: 'physics', name: '物理', color: 'bg-indigo-500', icon: Activity },
  { id: 'chemistry', name: '化学', color: 'bg-emerald-500', icon: Zap },
];

type View = 'planning' | 'subject' | 'diagnosis';

const CustomTooltip = ({ active, payload, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={cn("p-4 rounded-2xl border shadow-2xl max-w-[250px]", theme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
        <p className="font-black text-[14px] mb-1">{data.examName}</p>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-xl font-black text-accent">{data.score}</span>
          <span className="text-xs text-slate-500 font-bold">/ {data.totalScore}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest">{data.date}</p>
      </div>
    );
  }
  return null;
};

export const GradeRegistration: React.FC<GradeRegistrationProps> = ({ theme, onClose }) => {
  const [view, setView] = useState<View>('planning');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  
  const [subjects] = useState(() => {
    const saved = localStorage.getItem('learning_app_subjects');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-attach icons from initialSubjects
      return parsed.map((s: any) => ({
        ...s,
        icon: initialSubjects.find(is => is.id === s.id)?.icon || BookOpen
      }));
    }
    return initialSubjects;
  });

  const [entries, setEntries] = useState<GradeEntry[]>(() => {
    const saved = localStorage.getItem('learning_app_grades');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  const [newEntry, setNewEntry] = useState<Partial<GradeEntry>>({
    score: 0,
    totalScore: 120,
    date: new Date().toISOString().split('T')[0],
    examName: '',
    takeaway: '',
    images: []
  });

  const [diagnosisData, setDiagnosisData] = useState<{score: number; totalScore: number; examName: string; takeaway: string; images?: string[]} | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const currentImages = newEntry.images || [];
    if (currentImages.length >= 10) return;

    const remainingSlots = 10 - currentImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEntry(prev => ({
          ...prev,
          images: [...(prev.images || []), reader.result as string].slice(0, 10)
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setNewEntry(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    localStorage.setItem('learning_app_grades', JSON.stringify(entries));
  }, [entries]);

  const activeEntries = useMemo(() => {
    if (!activeSubject) return [];
    return [...entries].filter(e => e.subject === activeSubject).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, activeSubject]);

  const activeStats = useMemo(() => {
    if (activeEntries.length === 0) return { avgRate: 0, count: 0, highest: 0 };
    const avgRate = activeEntries.reduce((acc, curr) => acc + (curr.score / curr.totalScore), 0) / activeEntries.length;
    return {
      avgRate: avgRate * 100,
      count: activeEntries.length,
      highest: Math.max(...activeEntries.map(e => (e.score / e.totalScore) * 100))
    };
  }, [activeEntries]);

  const chartData = useMemo(() => {
    return activeEntries.map(e => ({
      date: e.date.split('-').slice(1).join('/'),
      scoreRate: (e.score / e.totalScore) * 100,
      score: e.score,
      totalScore: e.totalScore,
      examName: e.examName,
      averageRate: activeStats.avgRate
    }));
  }, [activeEntries, activeStats]);

  const handleAdd = () => {
    if (!newEntry.examName || newEntry.score === undefined || !activeSubject) return;
    const entry: GradeEntry = {
      id: Math.random().toString(36).substr(2, 9),
      subject: activeSubject,
      score: Number(newEntry.score),
      totalScore: Number(newEntry.totalScore),
      date: newEntry.date as string,
      examName: newEntry.examName as string,
      takeaway: newEntry.takeaway || '没有记录特别的想法。',
      images: newEntry.images || []
    };
    setEntries([...entries, entry]);
    setNewEntry({
      score: 0,
      totalScore: 120,
      date: new Date().toISOString().split('T')[0],
      examName: '',
      takeaway: '',
      images: []
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const openDiagnosis = (entry?: GradeEntry) => {
    if (entry) {
      setDiagnosisData({
        score: entry.score,
        totalScore: entry.totalScore,
        examName: entry.examName,
        takeaway: entry.takeaway,
        images: entry.images
      });
    } else {
      setDiagnosisData({
        score: Number(newEntry.score),
        totalScore: Number(newEntry.totalScore),
        examName: newEntry.examName || '自主测评',
        takeaway: newEntry.takeaway || '',
        images: newEntry.images
      });
    }
    setView('diagnosis');
  };

  return (
    <div className={cn(
      "w-full max-w-5xl h-[85vh] backdrop-blur-3xl border rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col transition-all duration-700 relative",
      theme === 'dark' ? "bg-slate-950/90 border-white/5" : "bg-white border-slate-200"
    )}>
      
      {/* Header */}
      <div className={cn("px-8 py-5 flex items-center justify-between border-b shrink-0 relative z-30", theme === 'dark' ? "bg-slate-900/40 border-white/5" : "bg-white/40 border-slate-100")}>
        <div className="flex items-center gap-5">
          {view !== 'planning' && (
            <button 
              onClick={() => setView('planning')}
              className={cn("p-2 rounded-xl transition-all", theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900")}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl shadow-lg", theme === 'dark' ? "bg-white" : "bg-slate-950")}>
              <TrendingUp className={cn("w-5 h-5", theme === 'dark' ? "text-slate-950" : "text-white")} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase leading-none">
                {view === 'planning' ? '学情大规划' : activeSubject}
              </h2>
              <p className="text-[11px] font-black tracking-[0.2em] uppercase opacity-50 mt-1">
                {view === 'planning' ? 'Strategic Academic Blueprint' : 'Interactive Subject Matrix'}
              </p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {view === 'planning' ? (
            <motion.div 
              key="planning"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 md:p-10 space-y-12 pb-24"
            >
              {/* Strategic Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={cn("lg:col-span-2 p-8 rounded-[2.5rem] border flex flex-col justify-center relative overflow-hidden group", theme === 'dark' ? "bg-white text-slate-950" : "bg-slate-950 text-white shadow-2xl shadow-slate-900/20")}>
                  <div className="relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-50 mb-3">综合掌握指数</h3>
                    <div className="text-6xl font-black tracking-tighter mb-4 flex items-baseline gap-2">
                      {entries.length ? Math.round((entries.reduce((acc, curr) => acc + (curr.score / curr.totalScore), 0) / entries.length) * 100) : 0}
                      <span className="text-2xl opacity-40">%</span>
                    </div>
                    <p className="text-sm font-bold opacity-70 max-w-sm italic leading-relaxed">“全维度学情追踪已激活。您的知识掌握分布呈现典型的阶梯状增长。建议继续保持优势学科的稳定性。”</p>
                  </div>
                  <Sparkles className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                </div>
                
                <div className={cn("p-8 rounded-[2.5rem] border flex flex-col justify-between shadow-xl", theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-slate-50 border-slate-100")}>
                   <div className="space-y-3">
                      <div className="p-3 bg-emerald-500 rounded-xl w-fit shadow-lg shadow-emerald-500/20">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-xl font-black tracking-tight">巅峰状态追踪</h4>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">检测到近期在“理综”板块录入了高频优异成绩，神经网络建议开启下一阶段深度研学。</p>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-4">
                      <div className="h-full bg-accent text-white w-[78%] rounded-full" />
                   </div>
                </div>
              </div>

              {/* Subject Matrix */}
              <div className="space-y-8">
                 <div className="flex flex-col gap-2 text-center">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">领域矩阵 / Academic Domains</h4>
                    <p className="text-xl font-black tracking-tight">点击进入各学科专业评估与登记</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((s: any) => {
                      const subEntries = entries.filter(e => e.subject === s.name);
                      const avg = subEntries.length ? (subEntries.reduce((acc, curr) => acc + (curr.score / curr.totalScore), 0) / subEntries.length) * 100 : 0;
                      return (
                        <button 
                          key={s.id}
                          onClick={() => { setActiveSubject(s.name); setView('subject'); }}
                          className={cn(
                            "group p-6 rounded-[2rem] border transition-all duration-500 text-left flex flex-col h-auto relative overflow-hidden",
                            theme === 'dark' 
                              ? "bg-slate-900/50 border-white/5 hover:border-accent/50 hover:bg-slate-900" 
                              : "bg-white border-slate-200 hover:border-blue-300 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-xl"
                          )}
                        >
                           <div className="flex justify-between items-start mb-6 relative z-10">
                              <div className={cn("p-4 rounded-[1.5rem] shadow-2xl transition-transform duration-500 group-hover:scale-110", s.color)}>
                                 <s.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-right">
                                 <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-0.5">Accuracy</div>
                                 <div className="text-3xl font-black tabular-nums tracking-tighter text-accent">{Math.round(avg)}%</div>
                              </div>
                           </div>
                           
                           <div className="relative z-10">
                              <h5 className="text-xl font-black tracking-tight mb-2 uppercase">{s.name}</h5>
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 flex-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${avg}%` }}
                                    className={cn("h-full rounded-full", s.color)}
                                  />
                                </div>
                                <span className="text-[10px] font-black opacity-40">{subEntries.length} SESSIONS</span>
                              </div>
                           </div>

                           <div className="mt-6 flex items-center justify-between relative z-10 pt-4 border-t border-slate-200/50 dark:border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">进行成绩登记分析</span>
                              <ArrowRight className="w-5 h-5 text-accent transform translate-x-0 group-hover:translate-x-1.5 transition-transform" />
                           </div>

                           {/* Decorative number */}
                           <div className="absolute -bottom-6 -right-6 text-6xl font-black opacity-[0.03] pointer-events-none italic">
                             {subEntries.length}
                           </div>
                        </button>
                      );
                    })}
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="subject"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 md:p-8 space-y-10 pb-24"
            >
              {/* Registration Module - Scaled Down */}
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-white/5">
                   <div>
                      <h3 className="text-xl font-black tracking-tight uppercase mb-0.5">成绩成果录入</h3>
                      <p className="text-[10px] font-black tracking-[0.1em] opacity-40 uppercase">Academic Ledger • {activeSubject}</p>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg shadow-sm shadow-accent/5">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">录入模式已激活</span>
                   </div>
                </div>

                <div className={cn("p-8 rounded-[2rem] border relative overflow-hidden", theme === 'dark' ? "bg-slate-900 border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-lg shadow-slate-200/20")}>
                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                       <div className="flex-1 space-y-5">
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">考试标识 / Exam Identity</label>
                             <input 
                               type="text" 
                               placeholder="例如：2026年三月联考" 
                               value={newEntry.examName} 
                               onChange={e => setNewEntry({...newEntry, examName: e.target.value})}
                               className={cn("w-full px-4 py-3 rounded-xl border font-bold text-sm transition-all focus:ring-4 focus:ring-accent/5 outline-none", theme === 'dark' ? "bg-black/20 border-white/5 focus:border-accent text-white" : "bg-slate-50 border-slate-200 focus:border-blue-300 text-slate-900")}
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center block">得分</label>
                                <input 
                                   type="number" 
                                   value={newEntry.score} 
                                   onChange={e => setNewEntry({...newEntry, score: Number(e.target.value)})}
                                   className={cn("w-full px-4 py-2 rounded-xl border font-black text-xl text-center text-accent outline-none", theme === 'dark' ? "bg-black/40 border-white/5 focus:border-accent" : "bg-slate-50 border-slate-200 focus:border-blue-300")}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center block">总分</label>
                                <input 
                                   type="number" 
                                   value={newEntry.totalScore} 
                                   onChange={e => setNewEntry({...newEntry, totalScore: Number(e.target.value)})}
                                   className={cn("w-full px-4 py-2 rounded-xl border font-black text-xl text-center text-slate-400 outline-none", theme === 'dark' ? "bg-black/40 border-white/5 focus:border-accent" : "bg-slate-50 border-slate-200 focus:border-blue-300")}
                                />
                             </div>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center justify-between">
                                <span>试卷素材 ({newEntry.images?.length || 0}/10)</span>
                             </label>
                             <div className="grid grid-cols-5 gap-2">
                                {newEntry.images?.map((img, i) => (
                                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                    <button 
                                      onClick={() => removeImage(i)}
                                      className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                {(!newEntry.images || newEntry.images.length < 10) && (
                                  <label className={cn(
                                    "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5",
                                    theme === 'dark' ? "border-white/10 hover:border-accent/50" : "border-slate-200 hover:border-blue-300"
                                  )}>
                                    <Plus className="w-5 h-5 text-slate-400" />
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                                  </label>
                                )}
                             </div>
                          </div>
                       </div>

                       <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> 深度反思 / Insight
                             </label>
                             <div className="relative group min-h-[160px]">
                               <textarea 
                                 placeholder="总结失分原因与知识收获..." 
                                 value={newEntry.takeaway} 
                                 onChange={e => setNewEntry({...newEntry, takeaway: e.target.value})}
                                 className={cn("w-full h-[160px] px-4 py-4 rounded-xl border text-sm font-bold leading-relaxed resize-none outline-none focus:ring-4 focus:ring-emerald-500/5", theme === 'dark' ? "bg-black/20 border-emerald-900/30 focus:border-emerald-500 text-white" : "bg-emerald-50/20 border-emerald-100 focus:border-emerald-300")}
                               />
                               <div className="absolute bottom-3 right-3 flex gap-2">
                                  <button 
                                    onClick={() => openDiagnosis()}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                                  >
                                    <Sparkles className="w-4 h-4 text-amber-500" /> AI 试卷诊断系统
                                  </button>
                               </div>
                             </div>
                          </div>

                          <div className="flex justify-center pt-4">
                             <button 
                               onClick={handleAdd}
                               className="w-full py-4 bg-accent text-white hover:bg-accent text-white text-white rounded-2xl font-black text-sm shadow-[0_15px_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                             >
                                <Plus className="w-5 h-5" /> 确认并录入本次成绩
                             </button>
                          </div>
                       </div>
                    </div>

                    {/* Aesthetic background accents */}
                    <div className="absolute -left-16 -top-16 w-48 h-48 bg-accent/5 rounded-full blur-[80px] z-0" />
                    <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] z-0" />
                </div>
              </div>

              {/* Data Visualization Section */}
              <div className="border-t border-white/5 pt-12 space-y-12 relative z-20">
                 <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                    <div className={cn("px-6 py-5 rounded-[1.5rem] border min-w-[160px] shrink-0", theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-white border-slate-200 shadow-sm")}>
                       <div className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1">平均得分率</div>
                       <div className="text-2xl font-black tabular-nums">{activeStats.avgRate.toFixed(1)}%</div>
                    </div>
                    <div className={cn("px-6 py-5 rounded-[1.5rem] border min-w-[160px] shrink-0", theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-white border-slate-200 shadow-sm")}>
                       <div className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1">测验密度</div>
                       <div className="text-2xl font-black tabular-nums">{activeStats.count} <span className="text-xs opacity-30">次</span></div>
                    </div>
                    <div className={cn("px-6 py-5 rounded-[1.5rem] border min-w-[160px] shrink-0", theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-white border-slate-200 shadow-sm")}>
                       <div className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1">最高突破</div>
                       <div className="text-2xl font-black text-accent tabular-nums">{activeStats.highest.toFixed(0)}%</div>
                    </div>
                 </div>

                 <div className={cn("p-8 rounded-[2.5rem] border relative overflow-hidden", theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                          <LineChartIcon className="w-4 h-4 text-accent" />
                          表现轨迹图谱 / Performance Trajectory
                       </h4>
                    </div>
                    <div className="h-[280px] w-full">
                       {activeEntries.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                           <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                             <defs>
                               <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                 <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                             <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                             <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                             <Tooltip content={<CustomTooltip theme={theme} />} />
                             <Area type="monotone" dataKey="scoreRate" stroke="#3B82F6" strokeWidth={5} fillOpacity={1} fill="url(#colorRate)" activeDot={{ r: 6, strokeWidth: 0 }} />
                             <Line type="monotone" dataKey="averageRate" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="6 6" dot={false} activeDot={false} />
                           </ComposedChart>
                         </ResponsiveContainer>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-10">
                           <Activity className="w-16 h-16" />
                           <p className="text-[8px] font-black uppercase tracking-[0.6em]">等待历史数据接入</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* History Cards */}
                 <div className="space-y-8">
                    <div className="flex items-center justify-between px-4">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">归档记录 / Academic Archives</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {activeEntries.map((entry) => (
                          <div 
                            key={entry.id}
                            className={cn(
                              "p-8 rounded-[2.5rem] border group relative transition-all duration-700 overflow-hidden",
                              theme === 'dark' ? "bg-slate-900 border-white/5 hover:border-white/20" : "bg-white border-slate-100 hover:border-blue-200 shadow-md shadow-slate-100/30"
                            )}
                          >
                             <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                   <div className="text-[8px] font-black text-slate-400 tracking-widest uppercase bg-slate-500/10 px-3 py-1 rounded-lg mb-2 w-fit">{entry.date}</div>
                                   <h5 className="font-black text-lg leading-tight uppercase tracking-tight max-w-[180px]">{entry.examName}</h5>
                                </div>
                                <div className="text-right">
                                   <div className="text-2xl font-black text-accent tabular-nums">{entry.score}<span className="text-xs text-slate-400 ml-1">/ {entry.totalScore}</span></div>
                                   <div className="text-[8px] font-black uppercase text-slate-500 tracking-widest mt-0.5">Accuracy: {((entry.score/entry.totalScore)*100).toFixed(0)}%</div>
                                </div>
                             </div>
                             
                             <div className={cn("p-5 rounded-[1.5rem] text-[12px] font-bold leading-relaxed mb-6 italic border relative z-10", theme === 'dark' ? "bg-black/40 border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600")}>
                                “{entry.takeaway}”
                             </div>

                             <div className="flex gap-3 relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openDiagnosis(entry)}
                                  className="flex-1 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[1.2rem] text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-xl hover:bg-accent text-white hover:text-white dark:hover:bg-accent text-white dark:hover:text-white transition-all transform group-hover:scale-[1.01]"
                                >
                                   <Sparkles className="w-4 h-4 text-amber-500" /> 专业诊断报告
                                </button>
                                <button 
                                  onClick={() => removeEntry(entry.id)}
                                  className="p-3 bg-red-500/5 text-red-500 rounded-[1.2rem] hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
         {view === 'diagnosis' && (
           <ExamDiagnosis 
             theme={theme} 
             subject={activeSubject || ''} 
             examData={diagnosisData || undefined}
             onClose={() => setView('subject')} 
           />
         )}
      </AnimatePresence>
    </div>
  );
};
