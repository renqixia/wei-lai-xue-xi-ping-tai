import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIResponse } from '../services/aiService';
import { Swords, Shield, Zap, Trophy, X, User, Bot, Timer, Award, Pencil, Eraser, Trash2, ChevronRight, BookOpen, Languages, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MathPKProps {
  theme: 'dark' | 'light';
  credits: number;
  setCredits: (c: number) => void;
  onBack: () => void;
}

type Subject = 'math' | 'chinese' | 'english';

const ScratchPad = ({ theme }: { theme: 'dark' | 'light' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(theme === 'dark' ? '#3b82f6' : '#2563eb');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="relative w-full h-full group">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={clear}
          className="p-2 bg-slate-800/80 text-white rounded-lg hover:bg-red-500 transition-colors"
          title="清除草稿"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-800/50 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
        草稿纸区域 (Scratchpad)
      </div>
    </div>
  );
};

export default function MathPK({ theme, credits, setCredits, onBack }: MathPKProps) {
  const [gameState, setGameState] = useState<'lobby' | 'subject-selection' | 'searching' | 'playing' | 'result'>('lobby');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [currentQuestion, setCurrentQuestion] = useState<{ q: string; a: string; options: string[] } | null>(null);
  const [opponentName, setOpponentName] = useState('AI 高级导师');
  const [aiStatus, setAiStatus] = useState<'thinking' | 'correct' | 'wrong' | 'idle'>('idle');

  const generateQuestion = () => {
    const types = ['quadratic-equation', 'quadratic-function', 'system-equations'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'quadratic-equation') {
      // x^2 - (x1+x2)x + x1*x2 = 0
      const x1 = Math.floor(Math.random() * 6) - 3;
      const x2 = Math.floor(Math.random() * 6) - 3;
      const b = -(x1 + x2);
      const c = x1 * x2;
      const q = `解方程: x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0, 求其中一个根`;
      const ans = x1.toString();
      const options = [ans, (x1 + 5).toString(), (x1 - 4).toString(), (x1 + 2).toString()].sort(() => Math.random() - 0.5);
      return { q, a: ans, options };
    } else if (type === 'quadratic-function') {
      // y = a(x-h)^2 + k
      const h = Math.floor(Math.random() * 4) - 2;
      const k = Math.floor(Math.random() * 4) - 2;
      const q = `二次函数 y = (x ${h >= 0 ? '-' : '+'}${Math.abs(h)})² ${k >= 0 ? '+' : ''}${k} 的顶点坐标是?`;
      const ans = `(${h},${k})`;
      const options = [ans, `(${-h},${k})`, `(${h},${-k})`, `(0,0)`].sort(() => Math.random() - 0.5);
      return { q, a: ans, options };
    } else {
      // x + y = s1, x - y = s2 => 2x = s1+s2, 2y = s1-s2
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);
      const s1 = x + y;
      const s2 = x - y;
      const q = `解方程组: x+y=${s1}, x-y=${s2}. 求 x 的值`;
      const ans = x.toString();
      const options = [ans, y.toString(), (x + 1).toString(), (x - 1).toString()].sort(() => Math.random() - 0.5);
      return { q, a: ans, options };
    }
  };

  const startSearch = (subject: Subject) => {
    if (subject !== 'math') return; // Others in development
    setSelectedSubject(subject);
    setGameState('searching');
    setTimeout(() => {
      setGameState('playing');
      setCurrentQuestion(generateQuestion());
      setTimeLeft(300);
    }, 2000);
  };

  useEffect(() => {
    let timer: any;
    let aiTimeout: any;

    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      const aiThink = async () => {
        if (gameState !== 'playing' || !currentQuestion) return;
        
        setAiStatus('thinking');
        
        try {
          const prompt = `你是一个正在参加数学竞赛的 AI 选手。请解决以下初中数学问题并仅输出答案的数值。
          问题：${currentQuestion.q}
          选项：${currentQuestion.options.join(', ')}
          正确答案应该是选项中的哪一个？只输出那个值。`;

          const text = await getAIResponse(prompt);
          const aiAnswer = text.trim();
          const isCorrect = aiAnswer.includes(currentQuestion.a);

          // Add a logical delay based on the AI's "thought process"
          const solveTime = Math.floor(Math.random() * 4000) + 4000;
          
          aiTimeout = setTimeout(() => {
            if (gameState !== 'playing') return;

            if (isCorrect) {
              setAiStatus('correct');
              setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
            } else {
              setAiStatus('wrong');
            }

            setTimeout(() => {
              if (gameState === 'playing') {
                setCurrentQuestion(generateQuestion());
                aiThink();
              }
            }, 1500);
          }, solveTime);

        } catch (error) {
          console.error("AI PK error:", error);
          // Fallback if API fails
          aiTimeout = setTimeout(() => {
            if (gameState !== 'playing') return;
            const isCorrect = Math.random() > 0.15;
            if (isCorrect) {
              setAiStatus('correct');
              setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
            } else {
              setAiStatus('wrong');
            }
            setTimeout(() => {
              if (gameState === 'playing') {
                setCurrentQuestion(generateQuestion());
                aiThink();
              }
            }, 2000);
          }, 8000);
        }
      };

      aiThink();
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('result');
    }

    return () => {
      clearInterval(timer);
      clearTimeout(aiTimeout);
    };
  }, [gameState, timeLeft === 0, currentQuestion?.q]); // Re-run when game starts, ends, or question changes

  const handleAnswer = (choice: string) => {
    if (currentQuestion && choice === currentQuestion.a) {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      setCurrentQuestion(generateQuestion());
    } else if (currentQuestion) {
      // Wrong answer penalty or shake
      import('../utils/mistakeTracker').then(({ recordMistake }) => {
        recordMistake('数学', currentQuestion.q, choice, currentQuestion.a);
      });
      // Optionally penalize or move on
      // setCurrentQuestion(generateQuestion()); // Let's not advance so they can try again, or maybe we do advance? The original code didn't advance. Let's keep it as is.
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={cn(
      "flex flex-col min-h-full items-center justify-center p-8 overflow-y-auto custom-scrollbar",
      "text-[var(--app-text)]"
    )} style={{ background: 'var(--app-bg-gradient, var(--app-bg))' }}>
      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center max-w-md"
          >
            <div 
              className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-premium"
              style={{ 
                backgroundColor: 'var(--accent)',
                boxShadow: '0 25px 50px -12px var(--accent)44'
              }}
            >
              <Swords className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">全科 PK 大赛</h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              与全服高手实时对战，赢取知识金币，提升你的学科股神排名！
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setGameState('subject-selection')}
                className="w-full py-5 rounded-3xl text-white font-black text-lg transition-all shadow-xl"
                style={{ 
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 10px 15px -3px var(--accent)44'
                }}
              >
                进入竞技场
              </button>
              <button 
                onClick={onBack}
                className={cn(
                  "w-full py-4 rounded-3xl border font-bold transition-all",
                  theme === 'dark' ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"
                )}
              >
                返回首页
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'subject-selection' && (
          <motion.div
            key="subject-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl"
          >
            <h2 className="text-3xl font-black mb-8 text-center tracking-tight">选择对战领域</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { id: 'math', name: '数学', icon: Zap, color: 'bg-accent text-white', desc: '初中数学全考点对战' },
                { id: 'chinese', name: '语文', icon: BookOpen, color: 'bg-red-600', desc: '古诗词与文学常识 (开发中)', disabled: true },
                { id: 'english', name: '英语', icon: Languages, color: 'bg-emerald-600', desc: '词汇与语法逻辑 (开发中)', disabled: true },
              ].map((sub) => (
                <motion.button
                  key={sub.id}
                  whileHover={sub.disabled ? {} : { y: -10 }}
                  onClick={() => !sub.disabled && startSearch(sub.id as Subject)}
                  className={cn(
                    "p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border text-left transition-all relative overflow-hidden group",
                    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl",
                    sub.disabled && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg", sub.color)}>
                    <sub.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black mb-1 md:mb-2">{sub.name}</h3>
                  <p className="text-slate-500 text-xs md:text-sm">{sub.desc}</p>
                  {!sub.disabled && (
                    <div className="mt-4 md:mt-6 flex items-center text-accent font-bold text-[10px] md:text-xs uppercase tracking-widest">
                      立即匹配 <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            <button 
              onClick={() => setGameState('lobby')}
              className="mt-12 mx-auto block text-slate-500 hover:text-slate-300 font-bold"
            >
              返回
            </button>
          </motion.div>
        )}

        {gameState === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-t-blue-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-10 h-10 text-accent animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">正在搜寻对手...</h3>
            <p className="text-slate-500 text-sm">匹配实力相当的 {selectedSubject === 'math' ? '数学' : ''} 学者</p>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">我的分数</p>
                  <p className="text-2xl font-black">{score.player}</p>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-red-500" />
                  <span className="text-2xl font-black tabular-nums">{formatTime(timeLeft)}</span>
                </div>
                <div className="w-48 h-2 bg-slate-500/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 300) * 100}%` }}
                    className="h-full bg-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="relative">
                  <AnimatePresence>
                    {aiStatus === 'correct' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: -20 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-8 right-0 text-emerald-500 font-bold text-xs"
                      >
                        正确! +1
                      </motion.div>
                    )}
                    {aiStatus === 'wrong' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: -20 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-8 right-0 text-red-500 font-bold text-xs"
                      >
                        粗心了...
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">对手分数</p>
                  <p className="text-2xl font-black">{score.opponent}</p>
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500",
                  aiStatus === 'thinking' ? "bg-purple-600 animate-pulse" : 
                  aiStatus === 'correct' ? "bg-emerald-600 scale-110" :
                  aiStatus === 'wrong' ? "bg-red-600 shake" : "bg-purple-600"
                )}>
                  <Bot className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
              {/* Question Area */}
              <div className="flex flex-col">
                <motion.div
                  key={currentQuestion?.q}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={cn(
                    "flex-grow p-10 rounded-[3rem] border flex flex-col items-center justify-center text-center mb-6",
                    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl"
                  )}
                >
                  <h2 className="text-4xl font-black tracking-tighter mb-8 leading-tight">{currentQuestion?.q}</h2>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {currentQuestion?.options.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(opt)}
                        className={cn(
                          "py-6 rounded-2xl border text-xl font-black transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 hover:border-accent" : "bg-slate-50 border-slate-200 hover:border-accent"
                        )}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Scratchpad Area */}
              <div className={cn(
                "rounded-[3rem] border overflow-hidden relative",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl"
              )}>
                <ScratchPad theme={theme} />
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className={cn(
              "w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl",
              score.player >= score.opponent ? "bg-emerald-600 shadow-emerald-500/20" : "bg-red-600 shadow-red-500/20"
            )}>
              {score.player >= score.opponent ? <Trophy className="w-12 h-12 text-white" /> : <Award className="w-12 h-12 text-white" />}
            </div>
            <h2 className="text-4xl font-black mb-2 tracking-tighter">
              {score.player > score.opponent ? '你赢了！' : score.player === score.opponent ? '平局！' : '惜败！'}
            </h2>
            <p className="text-slate-500 mb-8">
              最终比分 {score.player} : {score.opponent}
            </p>
            
            <div className={cn(
              "p-6 rounded-3xl mb-10 border",
              theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-lg"
            )}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">获得奖励</span>
                <span className="text-emerald-500 font-black">+{score.player > score.opponent ? 200 : 50} 金币</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">经验值</span>
                <span className="text-accent font-black">+{score.player * 20} EXP</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  setScore({ player: 0, opponent: 0 });
                  setGameState('subject-selection');
                }}
                className="w-full py-5 rounded-3xl bg-accent hover:opacity-90 text-white font-black text-lg transition-all shadow-xl shadow-accent/20"
              >
                再来一局
              </button>
              <button 
                onClick={onBack}
                className={cn(
                  "w-full py-4 rounded-3xl border font-bold transition-all",
                  theme === 'dark' ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"
                )}
              >
                返回大厅
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
