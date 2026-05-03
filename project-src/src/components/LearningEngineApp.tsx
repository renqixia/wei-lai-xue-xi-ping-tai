import React, { useState, useEffect, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Book, Target, Grid, Presentation, PenTool, CheckCircle2, CornerDownRight, Maximize2, ArrowRight, Menu, X, Sparkles, Mic, Loader2, Undo2, Info, Trash2 } from 'lucide-react';
import { BrainIcon } from './BrainIcon';
import { parseDailyReview, evaluateFeynman, generateAdvice, generateMindMap, polishTextDirectly } from '../services/aiService';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Basic Data Types
type KnowledgeItem = {
  id: string;
  subject: string;
  coreConcept: string;
  keyPoints: string[];
  tags: string[];
  importance: string;
  nextReviewDate: string; // ISO String
  interval: number; // days
  reps: number;
};

type MistakeItem = {
  id: string;
  subject: string;
  questionContext: string;
  errorReason: string;
  actionAdvice: string;
  nextReviewDate: string; // ISO
  interval: number;
  reps: number;
};

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
const VIEW_REVIEW = 'review';
const VIEW_RECALL = 'recall';
const VIEW_MISTAKES = 'mistakes';
const VIEW_FEYNMAN = 'feynman';
const VIEW_REPORTS = 'reports';

export const LearningEngineApp = ({ theme = 'light' }: { theme?: 'light' | 'dark' }) => {
  const [activeView, setActiveView] = useState(VIEW_REVIEW);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data Stores
  const [knowledgeVault, setKnowledgeVault] = useState<KnowledgeItem[]>(() => {
    const saved = localStorage.getItem('knowledgeVault');
    return saved ? JSON.parse(saved) : [];
  });
  const [mistakeBook, setMistakeBook] = useState<MistakeItem[]>(() => {
    const saved = localStorage.getItem('mistakeBook');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('knowledgeVault', JSON.stringify(knowledgeVault));
  }, [knowledgeVault]);

  useEffect(() => {
    localStorage.setItem('mistakeBook', JSON.stringify(mistakeBook));
  }, [mistakeBook]);

  // SM-2 style progression
  const calculateNextReview = (reps: number) => {
    const intervals = [0, 0, 1, 3, 7, 30]; // in days
    const nextInterval = intervals[Math.min(reps, intervals.length - 1)];
    const date = new Date();
    date.setDate(date.getDate() + Math.max(1, nextInterval));
    return { interval: nextInterval, date: date.toISOString() };
  };

  const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button 
      onClick={() => {
        setActiveView(id);
        setIsSidebarOpen(false); // Mobile: auto-close on navigate
      }}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
        activeView === id 
          ? "bg-accent text-white text-white shadow-md" 
          : cn("hover:bg-slate-100 dark:hover:bg-slate-800", theme === 'dark' ? "text-slate-400" : "text-slate-600")
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className={cn("flex h-screen font-sans selection:bg-blue-200 overflow-hidden relative", theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
      
      {/* Mobile/Toggle Header & Backdrop */}
      <div className={cn("absolute top-6 left-6 z-30 transition-opacity lg:hidden", isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
         <button onClick={() => setIsSidebarOpen(true)} className={cn("p-3 rounded-2xl shadow-lg border", theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900")}>
           <Menu className="w-6 h-6" />
         </button>
      </div>

      <div 
        className={cn("fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden", isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Sidebar Drawer / Island */}
      <div className={cn(
          "fixed z-50 w-72 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-2xl", 
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200", 
          "inset-y-0 left-0 border-r lg:inset-y-6 lg:left-6 lg:border lg:rounded-[2rem] lg:h-[calc(100vh-48px)]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-8 pt-10 lg:pt-8">
          <div className="flex items-center gap-3 font-black text-xl tracking-tight">
            <span className="w-8 h-8 bg-accent text-white rounded-lg flex items-center justify-center text-white shadow-inner">
              <BrainIcon className="w-5 h-5" />
            </span>
            认知引擎
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={cn("p-2 rounded-xl lg:hidden", theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-100")}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className={cn("text-xs font-bold tracking-widest mb-4 px-4 uppercase", theme === 'dark' ? "text-slate-600" : "text-slate-400")}>每日核心</div>
          <NavItem id={VIEW_REVIEW} label="沉浸复盘" icon={PenTool} />
          
          <div className={cn("text-xs font-bold tracking-widest mb-4 px-4 pt-6 uppercase", theme === 'dark' ? "text-slate-600" : "text-slate-400")}>记忆与输出</div>
          <NavItem id={VIEW_RECALL} label="闪卡提取" icon={Book} />
          <NavItem id={VIEW_MISTAKES} label="错题档案" icon={Target} />
          <NavItem id={VIEW_FEYNMAN} label="费曼演练" icon={Presentation} />
          
          <div className={cn("text-xs font-bold tracking-widest mb-4 px-4 pt-6 uppercase", theme === 'dark' ? "text-slate-600" : "text-slate-400")}>高维视角</div>
          <NavItem id={VIEW_REPORTS} label="认知图谱" icon={Grid} />
        </nav>

        <div className={cn("p-6 border-t lg:rounded-b-[2rem] flex flex-col gap-4", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
           <div className={cn("text-xs font-medium flex items-center justify-between", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                记忆引擎运转中
             </div>
             <button 
                onClick={() => {
                  if (confirm('确定要清空所有复盘数据吗？此操作无法恢复。')) {
                    localStorage.removeItem('knowledgeVault');
                    localStorage.removeItem('mistakeBook');
                    setKnowledgeVault([]);
                    setMistakeBook([]);
                    setActiveView(VIEW_REVIEW);
                  }
                }}
                title="清空数据"
                className={cn("p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors", theme === 'dark' ? "text-slate-600" : "text-slate-400")}
             >
                <Trash2 className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative w-full lg:pl-[336px]">
        <div className={cn("absolute inset-x-0 top-0 h-32 bg-gradient-to-b pointer-events-none z-10 lg:left-[336px]", theme === 'dark' ? "from-slate-950 to-transparent" : "from-slate-50 to-transparent")} />
        <div className="h-full overflow-y-auto px-6 md:px-16 pt-24 pb-32 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {activeView === VIEW_REVIEW && (
               <DailyReviewView 
                  theme={theme}
                  onSave={(k, m) => {
                    setKnowledgeVault([...k, ...knowledgeVault]);
                    setMistakeBook([...m, ...mistakeBook]);
                    setActiveView(VIEW_RECALL);
                  }}
               />
            )}
            {activeView === VIEW_RECALL && (
               <RecallView 
                  theme={theme}
                  items={knowledgeVault} 
                  onReview={(id, success) => {
                    setKnowledgeVault(prev => prev.map(item => {
                      if (item.id === id) {
                        const nextReps = success ? item.reps + 1 : 0;
                        const { interval, date } = calculateNextReview(nextReps);
                        return { ...item, reps: nextReps, interval, nextReviewDate: date };
                      }
                      return item;
                    }));
                  }}
               />
            )}
            {activeView === VIEW_MISTAKES && (
               <MistakeView theme={theme} items={mistakeBook} />
            )}
            {activeView === VIEW_FEYNMAN && (
               <FeynmanView theme={theme} combinedItems={[...knowledgeVault, ...mistakeBook]} />
            )}
            {activeView === VIEW_REPORTS && (
               <ReportView theme={theme} vault={knowledgeVault} mistakes={mistakeBook} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// ==========================================
// DAILY REVIEW VIEW
// ==========================================
const DailyReviewView = ({ theme, onSave }: any) => {
  const [content, setContent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  // Polish state
  const [originalContent, setOriginalContent] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isPolished, setIsPolished] = useState(false);

  // Voice recording state
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenInsightTutorial');
    if (!hasSeen) {
      setShowTutorial(true);
    }
    
    // Voice setup
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setContent(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handlePolish = async () => {
    if (!content.trim() || isPolishing) return;
    setOriginalContent(content);
    setIsPolishing(true);
    try {
      const result = await polishTextDirectly(content);
      setContent(result);
      setIsPolished(true);
    } catch {
      alert("润色发生错误。");
    } finally {
      setIsPolishing(false);
    }
  };

  const handleRevertPolish = () => {
    setContent(originalContent);
    setIsPolished(false);
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsProcessing(true);
    try {
      const data = await parseDailyReview(content);
      setParsedData(data);
    } catch (e) {
      alert("分析失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedData) return;
    const knowledges: KnowledgeItem[] = (parsedData.knowledgePoints || []).map((k: any) => ({
      id: crypto.randomUUID(),
      subject: selectedSubject,
      coreConcept: k.coreConcept,
      keyPoints: k.keyPoints,
      tags: k.tags,
      importance: k.importance,
      nextReviewDate: new Date().toISOString(),
      interval: 0, reps: 0
    }));
    const mistakes: MistakeItem[] = (parsedData.mistakesFound || []).map((m: any) => ({
      id: crypto.randomUUID(),
      subject: selectedSubject,
      questionContext: m.questionContext,
      errorReason: m.errorReason,
      actionAdvice: m.actionAdvice,
      nextReviewDate: new Date().toISOString(),
      interval: 0, reps: 0
    }));
    onSave(knowledges, mistakes);
    setContent('');
    setIsPolished(false);
    setParsedData(null);
  };

  const closeTutorial = () => {
    localStorage.setItem('hasSeenInsightTutorial', 'true');
    setShowTutorial(false);
  };

  const c_bg = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const c_input = theme === 'dark' ? "bg-slate-950 focus:bg-slate-900 border-slate-800 focus:ring-slate-800" : "bg-slate-50 focus:bg-white border-slate-200 focus:ring-slate-100";

  return (
    <div className="space-y-12 animate-fade-in pb-20 relative">
      {/* Inline Tutorial Banner instead of fullscreen modal */}
      {showTutorial && (
        <div className={cn("p-6 sm:p-8 rounded-3xl border relative overflow-hidden mt-8 md:mt-4 shadow-sm", theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200")}>
           <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4"><BrainIcon className="w-64 h-64" /></div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center text-white">
                   <Info className="w-5 h-5" />
                 </div>
                 <h2 className="text-xl font-black">什么是“高维洞察”？</h2>
              </div>
              <div className="space-y-3 leading-relaxed opacity-80 mb-6 max-w-2xl">
                <p>欢迎来到认知引擎！在这里，你不需要把知识点抄得整整齐齐。你只需要像聊天一样，把今天学的部分、听不懂的地方、做错的题说出来。</p>
                <p>点击<strong className="text-accent mx-1">生成高维洞察</strong>，AI 老师会自动从你的话中拆解出核心考点和心智卡点，并为你生成科学的复习计划。</p>
              </div>
              <button 
                onClick={closeTutorial} 
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-accent text-white text-white font-bold hover:opacity-90 transition shadow-lg"
              >
                我明白了，开始复盘
              </button>
           </div>
        </div>
      )}

      <header className="max-w-3xl pt-16 sm:pt-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">今日沉浸复盘</h1>
        <p className={cn("text-base sm:text-lg", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
          不要干巴巴地登记知识点。把今天学到的、错过的、领悟的，用最自然的话说出来，或者点击话筒录音，认知引擎会为你自动做拆解。
        </p>
      </header>

      {!parsedData ? (
        <section className={cn("p-4 sm:p-8 rounded-3xl border shadow-sm", c_bg)}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:px-2">
            <span className="font-bold opacity-70 shrink-0">选择科目:</span>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    selectedSubject === s 
                      ? "bg-accent text-white text-white shadow-md shadow-black/10" 
                      : theme === 'dark' ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn("w-full h-72 sm:h-64 p-6 pt-6 pb-20 rounded-2xl border outline-none resize-none text-base sm:text-lg leading-relaxed focus:ring-4 transition-all", c_input, theme === 'dark' ? "text-white placeholder-slate-600 focus:ring-slate-800" : "text-slate-900 placeholder-slate-400 focus:ring-slate-100")}
              placeholder="例如：今天学了微积分的链式法则，核心是复合函数求导要一层层剥开，但我做题时总是忘记乘以内层函数的导数。另外物理摩擦力的受力分析我也老是画错方向..."
            />
            {/* Toolbar inside Textarea bottom */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              
              <button 
                onClick={toggleListen}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm", 
                  isListening 
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse" 
                    : theme === 'dark' ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                )}
              >
                <Mic className="w-4 h-4" />
                {isListening ? "录音中, 点击停止" : "语音输入"}
              </button>

              <div className="flex items-center gap-2">
                {isPolished ? (
                  <button onClick={handleRevertPolish} className={cn("p-2 sm:p-3 rounded-xl transition", theme === 'dark' ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300")} title="撤销润色">
                    <Undo2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    disabled={!content.trim() || isPolishing}
                    onClick={handlePolish}
                    className={cn("p-2 sm:p-3 rounded-xl transition", isPolishing ? "opacity-50" : "", theme === 'dark' ? "bg-slate-800 text-amber-400 hover:bg-slate-700" : "bg-slate-200 text-amber-600 hover:bg-slate-300")}
                    title="AI智能理顺逻辑"
                  >
                    {isPolishing ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              disabled={isProcessing || !content.trim()}
              onClick={handleAnalyze}
              className="group flex w-full sm:w-auto items-center justify-center gap-3 px-10 py-5 bg-accent text-white text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
            >
              {isProcessing ? "认知引擎解构中..." : "生成高维洞察" }
              {!isProcessing && <BrainIcon className={cn("w-5 h-5", "group-hover:scale-110 transition-transform")} />}
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-8 animate-fade-in">
          <div className={cn("p-6 sm:p-8 rounded-3xl border bg-gradient-to-br", theme === 'dark' ? "from-accent/20 to-slate-900 border-accent/20" : "from-accent/10 to-white border-accent/20")}>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent text-white flex items-center justify-center text-white shrink-0 shadow-lg">
                <BrainIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className={cn("text-xs font-bold tracking-widest uppercase mb-2 text-accent")}>教练核心总结 ({selectedSubject})</div>
                <div className={cn("text-lg sm:text-xl font-bold leading-relaxed", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>{parsedData.dailySummary}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Book className={cn("w-5 h-5", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")} />
                <h3 className="font-bold text-lg">捕获的知识锚点</h3>
              </div>
              {parsedData.knowledgePoints?.map((k: any, i: number) => (
                <div key={i} className={cn("p-6 rounded-2xl border", c_bg)}>
                  <div className="flex gap-2 mb-3">
                    <span className={cn("text-xs font-bold px-2 py-1 rounded", theme==='dark'?"bg-slate-800 text-accent":"bg-slate-100 text-accent")}>{selectedSubject}</span>
                    {k.tags?.map((t: string) => <span key={t} className={cn("text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800", theme==='dark'?"text-slate-300":"text-slate-600")}>{t}</span>)}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{k.coreConcept}</h4>
                  <ul className="space-y-2">
                    {k.keyPoints?.map((p: string, j: number) => (
                      <li key={j} className="flex gap-3 text-sm">
                        <CornerDownRight className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className={theme === 'dark' ? "text-slate-300" : "text-slate-600"}>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Target className={cn("w-5 h-5", theme === 'dark' ? "text-rose-400" : "text-rose-600")} />
                <h3 className="font-bold text-lg">暴漏的心智卡点</h3>
              </div>
              {parsedData.mistakesFound?.map((m: any, i: number) => (
                <div key={i} className={cn("p-6 rounded-2xl border", c_bg)}>
                  <div className="mb-4 flex items-start gap-2">
                     <span className={cn("shrink-0 text-[10px] font-black px-2 py-1 mt-1 rounded", theme==='dark'?"bg-rose-900/30 text-rose-300":"bg-rose-100 text-rose-700")}>{selectedSubject}</span>
                     <h4 className="font-bold">{m.questionContext}</h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className={cn("p-4 rounded-xl", theme === 'dark' ? "bg-rose-950/30 text-rose-200" : "bg-rose-50 text-rose-800")}>
                      <span className="font-bold block mb-1">心智盲区：</span>
                      {m.errorReason}
                    </div>
                    <div className={cn("p-4 rounded-xl", theme === 'dark' ? "bg-slate-800/50 text-accent" : "bg-slate-100 text-accent")}>
                      <span className="font-bold block mb-1 flex items-center gap-2">行动纠偏：</span>
                      <span className="opacity-90">{m.actionAdvice}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-8 pb-4">
            <button 
              onClick={handleConfirm}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 className="w-5 h-5" />
              写入记忆引擎 (开启艾宾浩斯循环)
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

// ==========================================
// RECALL VIEW
// ==========================================
const RecallView = ({ theme, items, onReview }: any) => {
  const dueItems = items.filter((item: any) => new Date(item.nextReviewDate) <= new Date());
  const upcomingItems = items.filter((item: any) => new Date(item.nextReviewDate) > new Date());

  return (
    <div className="space-y-12 animate-fade-in pl-4 pr-4 sm:px-0">
      <header className="pt-16 sm:pt-4">
        <h1 className="text-3xl font-bold tracking-tight mb-2">闪卡提取 (Active Recall)</h1>
        <p className={theme==='dark'?"text-slate-400":"text-slate-500"}>通过“遮盖回忆”主动提取记忆，系统会自动计算最佳复习间隔。</p>
      </header>

      {dueItems.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <h2 className="text-sm font-bold tracking-widest uppercase">今日待攻克 ({dueItems.length})</h2>
          </div>
          <div className="grid gap-6">
            {dueItems.map((item: any) => (
              <ReviewCard key={item.id} theme={theme} item={item} onReview={onReview} />
            ))}
          </div>
        </section>
      )}

      {dueItems.length === 0 && upcomingItems.length === 0 && (
        <div className={cn("p-12 text-center border border-dashed rounded-3xl", theme==='dark'?"border-slate-800 text-slate-500":"border-slate-200 text-slate-400")}>
           记忆库空空如也，快去“沉浸复盘”录入今天的学习感悟吧。
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-6 mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
           <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">记忆缓冲区 ({upcomingItems.length})</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
          {upcomingItems.map((item: any) => (
            <div key={item.id} className={cn("p-6 border rounded-2xl flex items-start gap-3", theme==='dark'?"bg-slate-900/50 border-slate-800":"bg-white border-slate-200")}>
              <span className={cn("shrink-0 text-[10px] font-black px-2 py-1 mt-1 rounded", theme==='dark'?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500")}>
                 {item.subject || '未分类'}
              </span>
              <div className="min-w-0">
                 <h3 className="font-bold mb-1 truncate">{item.coreConcept}</h3>
                 <div className="text-xs text-slate-400">下次复习: {new Date(item.nextReviewDate).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ReviewCard = ({ theme, item, onReview }: any) => {
  const [revealed, setRevealed] = useState(false);
  const c_bg = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={cn("p-6 sm:p-8 border rounded-3xl transition-all shadow-sm", c_bg, revealed ? "" : "hover:shadow-md")}>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
          提取线索 <span className="text-accent">· {item.subject || '未分类'}</span>
        </span>
        <span className={cn("text-xs font-bold px-3 py-1 rounded-lg", theme === 'dark' ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600")}>
          周期 {item.reps}
        </span>
      </div>
      
      <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 text-center">{item.coreConcept}</h3>
      
      <div className="mb-8 max-w-2xl mx-auto">
        {!revealed ? (
          <button 
            onClick={() => setRevealed(true)}
            className={cn("w-full py-12 border-2 border-dashed rounded-2xl transition-colors flex flex-col items-center gap-3 px-4", theme === 'dark' ? "border-slate-700 hover:bg-slate-800 text-slate-400" : "border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500")}
          >
             <Maximize2 className="w-6 h-6 opacity-50" />
             <span className="font-bold text-center">点击展开答案<br/><span className="text-xs opacity-60 font-normal mt-1 block">(请先在大脑中回忆)</span></span>
          </button>
        ) : (
          <div className={cn("p-6 sm:p-8 rounded-2xl animate-fade-in border", theme === 'dark' ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
            <ul className="space-y-4">
              {item.keyPoints.map((point: string, i: number) => (
                <li key={i} className="flex gap-3 leading-relaxed">
                  <ArrowRight className="w-5 h-5 shrink-0 text-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {revealed && (
        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
          <button 
            onClick={() => { setRevealed(false); onReview(item.id, false); }}
            className={cn("px-8 py-4 rounded-xl font-bold border transition-colors", theme === 'dark' ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50")}
          >
            完全遗忘 / 模糊 (重置)
          </button>
          <button 
            onClick={() => { setRevealed(false); onReview(item.id, true); }}
            className="px-8 py-4 rounded-xl font-bold bg-accent text-white text-white hover:opacity-90 transition-colors shadow-lg"
          >
            记忆清晰 (进入下个周期)
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MISTAKE VIEW
// ==========================================
const MistakeView = ({ theme, items }: any) => {
  return (
    <div className="space-y-12 animate-fade-in px-4 sm:px-0">
      <header className="pt-16 sm:pt-4">
        <h1 className="text-3xl font-bold tracking-tight mb-2">错题与盲点档案</h1>
        <p className={theme==='dark'?"text-slate-400":"text-slate-500"}>所有通过复盘暴露的认知盲区都在此归档。</p>
      </header>

      {items.length === 0 && (
         <div className={cn("p-12 text-center border border-dashed rounded-3xl", theme==='dark'?"border-slate-800 text-slate-500":"border-slate-200 text-slate-400")}>
           目前没有记录任何卡点。
        </div>
      )}

      <section className="grid gap-6">
        {items.map((item: any) => (
          <div key={item.id} className={cn("p-6 sm:p-8 border rounded-3xl", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
             <div className="text-lg font-bold mb-6 pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start gap-3">
               <span className={cn("shrink-0 text-[10px] font-black px-2 py-1 mt-1 rounded max-w-max", theme==='dark'?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500")}>
                 {item.subject || '未分类'}
               </span>
               <div className="leading-relaxed">
                 {item.questionContext}
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className={cn("font-bold mb-3 flex items-center gap-2", theme === 'dark' ? "text-rose-400" : "text-rose-600")}>
                    <BrainIcon className="w-4 h-4" /> 心智盲区透视
                  </h4>
                  <p className="leading-relaxed opacity-80">{item.errorReason}</p>
                </div>
                <div>
                  <h4 className={cn("font-bold mb-3 flex items-center gap-2 text-accent")}>
                    <Target className="w-4 h-4" /> 行动纠偏建议
                  </h4>
                  <p className="leading-relaxed opacity-80">{item.actionAdvice}</p>
                </div>
             </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// ==========================================
// FEYNMAN VIEW
// ==========================================
const FeynmanView = ({ theme, combinedItems }: any) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const topics = combinedItems.map((item: any) => item.coreConcept || item.questionContext).filter(Boolean);

  const handleSubmit = async () => {
    if (!selectedTopic || !output) return;
    setIsProcessing(true);
    try {
      const data = await evaluateFeynman(selectedTopic, output);
      setEvaluation(data);
    } catch (e) {
      alert('评估失败');
    } finally {
      setIsProcessing(false);
    }
  }

  const ScorePill = ({ label, score }: { label: string, score: number }) => (
    <div className={cn("flex flex-col gap-1 items-center justify-center p-6 rounded-2xl border", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-4xl font-black">{score}<span className="text-base font-medium opacity-50">/10</span></div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20 px-4 sm:px-0">
      <header className="pt-16 sm:pt-4">
         <h1 className="text-3xl font-bold tracking-tight mb-2">费曼能力试炼场</h1>
         <p className={theme==='dark'?"text-slate-400":"text-slate-500"}>用最简单的“人话”（不带专业词汇）解释复杂概念，接受 AI 的严格拷问。</p>
      </header>

      <div className="space-y-6">
        <select 
          value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
          className={cn("w-full p-4 border rounded-2xl outline-none text-base sm:text-lg font-bold transition-all", theme === 'dark' ? "bg-slate-900 border-slate-800 focus:border-accent" : "bg-white border-slate-200 focus:border-accent")}
        >
          <option value="">-- 请选择当前库中的一个概念作为靶子 --</option>
          {topics.map((t: string, i: number) => <option key={i} value={t}>{t}</option>)}
        </select>

        <textarea 
          value={output} onChange={e => setOutput(e.target.value)}
          placeholder="设想你在给一个八岁的小孩讲这个概念..."
          className={cn("w-full h-64 p-6 sm:p-8 border rounded-3xl outline-none resize-none text-lg leading-relaxed transition-all", theme === 'dark' ? "bg-slate-950 border-slate-800 focus:border-slate-700 placeholder-slate-700" : "bg-slate-50 border-slate-200 focus:bg-white placeholder-slate-400")}
        />

        <div className="flex justify-end">
          <button 
            disabled={isProcessing || !output || !selectedTopic}
            onClick={handleSubmit}
            className="flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg w-full sm:w-auto justify-center"
          >
            {isProcessing ? "AI 教练评估中..." : "启动高阶多维评估" }
            <BrainIcon className={cn("w-6 h-6", isProcessing ? "animate-pulse" : "opacity-80")} />
          </button>
        </div>
      </div>

      {evaluation && (
        <section className="animate-fade-in pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <ScorePill label="准确性" score={evaluation.accuracyScore} />
            <ScorePill label="简洁度" score={evaluation.concisenessScore} />
            <ScorePill label="形式逻辑" score={evaluation.logicScore} />
            <ScorePill label="认知深度" score={evaluation.depthScore} />
          </div>

          <div className={cn("p-6 sm:p-10 rounded-3xl border", theme === 'dark' ? "bg-accent text-white/10 border-accent/20" : "bg-slate-100 border-slate-200")}>
            <div className="text-xs font-bold tracking-widest uppercase mb-4 text-accent">教练优化建议</div>
            <p className="leading-relaxed text-base sm:text-lg opacity-90">{evaluation.coachAdvice}</p>
          </div>
        </section>
      )}
    </div>
  )
}

// ==========================================
// REPORTS & MAP VIEW
// ==========================================
const ReportView = ({ theme, vault, mistakes }: any) => {
  const [advice, setAdvice] = useState<string>('');
  const [mindmapData, setMindmapData] = useState<any>(null);
  const [isLoadingMAP, setIsLoadingMAP] = useState(false);
  const [isLoadingADVICE, setIsLoadingADVICE] = useState(false);

  const handleGenerateAdvice = async () => {
    setIsLoadingADVICE(true);
    try {
      const resp = await generateAdvice({ 
        knowledgeCount: vault.length, mistakeCount: mistakes.length,
        dueCount: vault.filter((v:any) => new Date(v.nextReviewDate) <= new Date()).length
      });
      setAdvice(resp);
    } catch {
      alert("生成失败");
    } finally {
      setIsLoadingADVICE(false);
    }
  }

  const handleGenerateMap = async () => {
    setIsLoadingMAP(true);
    try {
      const concepts = vault.map((v:any) => v.coreConcept).filter(Boolean);
      const resp = await generateMindMap(concepts);
      setMindmapData(resp);
    } catch {
      alert("生成失败或数据不足");
    } finally {
      setIsLoadingMAP(false);
    }
  };

  const renderNode = (node: any) => {
    if (!node) return null;
    return (
      <div className={cn("ml-8 pl-6 py-3 border-l-2", theme === 'dark' ? "border-slate-800" : "border-slate-200")}>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("w-2 h-2 rounded-full", theme === 'dark' ? "bg-slate-600" : "bg-slate-400")} />
          <span className="font-bold text-lg">{node.name}</span>
        </div>
        {node.children && node.children.map((child: any, i: number) => (
          <React.Fragment key={i}>
            {renderNode(child)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 px-4 sm:px-0">
      <header className="pt-16 sm:pt-4">
         <h1 className="text-3xl font-bold tracking-tight mb-2">高维认知拓扑</h1>
         <p className={theme==='dark'?"text-slate-400":"text-slate-500"}>鸟瞰你的知识森林，生成个性化的成长干预策略。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className={cn("p-8 sm:p-10 border rounded-3xl flex flex-col items-center text-center", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
              <Grid className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="font-bold text-xl mb-3">记忆网状拓扑</h3>
            <p className="text-sm opacity-60 mb-8 px-4">将零散的知识颗粒重组为具有层级的树状思维导图。</p>
            <button 
              disabled={isLoadingMAP || vault.length === 0}
              onClick={handleGenerateMap}
              className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              {isLoadingMAP ? "生成中..." : "渲染思维拓扑"}
              <BrainIcon className="w-5 h-5 ml-1" />
            </button>
         </div>

         <div className={cn("p-8 sm:p-10 border rounded-3xl flex flex-col items-center text-center", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
              <BrainIcon className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="font-bold text-xl mb-3">AI 上帝视角分析</h3>
            <p className="text-sm opacity-60 mb-8 px-4">根据当前错题量与记忆库状态，生成下一步学习建议。</p>
            <button 
              disabled={isLoadingADVICE}
              onClick={handleGenerateAdvice}
              className="w-full flex justify-center items-center gap-2 px-6 py-4 border-2 border-slate-900 dark:border-white font-bold hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors rounded-xl"
            >
              {isLoadingADVICE ? "解析数据流..." : "生成靶向干预"}
            </button>
         </div>
      </div>

      {advice && (
        <section className={cn("p-8 sm:p-10 rounded-3xl border shadow-lg animate-fade-in", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-900 text-slate-100 border-slate-900")}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-bold tracking-widest uppercase">战略白皮书</h2>
          </div>
          <div className="markdown-body prose prose-invert max-w-none prose-lg">
            <ReactMarkdown>{advice}</ReactMarkdown>
          </div>
        </section>
      )}

      {mindmapData && (
        <section className={cn("p-8 sm:p-10 border rounded-3xl animate-fade-in overflow-x-auto", theme === 'dark' ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200")}>
          <div className="flex items-center gap-3 mb-10">
            <h2 className="text-sm font-bold tracking-widest uppercase opacity-50">结构树渲染完成</h2>
          </div>
          
          <div className="min-w-max">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-4 h-4 bg-accent text-white rounded-sm" />
               <span className="font-black text-2xl">{mindmapData.name}</span>
             </div>
             <div className="ml-4">
                {mindmapData.children && mindmapData.children.map((child: any, i: number) => (
                  <React.Fragment key={i}>
                    {renderNode(child)}
                  </React.Fragment>
                ))}
             </div>
          </div>
        </section>
      )}
    </div>
  )
}
