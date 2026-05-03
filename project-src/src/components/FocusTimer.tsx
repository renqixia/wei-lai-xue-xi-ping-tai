import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain, 
  ChevronLeft, 
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  History,
  TrendingUp,
  Clock,
  CheckCircle2,
  ListTodo,
  X,
  Sliders,
  ChevronRight,
  Target
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
}

interface FocusSession {
  id: string;
  duration: number;
  timestamp: string;
  type: TimerMode;
  completed: boolean;
  taskId?: string;
  taskTitle?: string;
}

export const FocusTimer: React.FC<{
  theme: 'light' | 'dark';
  onBack: () => void;
  tasks: any[];
  onToggleTask: (id: string) => void;
}> = ({ theme, onBack, tasks, onToggleTask }) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const saved = localStorage.getItem('focus_timer_settings');
    return saved ? JSON.parse(saved) : {
      work: 25,
      shortBreak: 5,
      longBreak: 15
    };
  });

  const [timeLeft, setTimeLeft] = useState(settings[mode] * 60);

  const [sessions, setSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('focus_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(settings[mode] * 60);
  }, [mode, settings]);

  useEffect(() => {
    resetTimer();
  }, [mode, settings, resetTimer]);

  useEffect(() => {
    localStorage.setItem('focus_timer_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (isActive) {
        const selectedTask = tasks.find(t => t.id === selectedTaskId);
        const newSession: FocusSession = {
          id: Date.now().toString(),
          duration: settings[mode],
          timestamp: new Date().toISOString(),
          type: mode,
          completed: true,
          taskId: selectedTaskId || undefined,
          taskTitle: selectedTask?.title
        };
        const updatedSessions = [newSession, ...sessions].slice(0, 50);
        setSessions(updatedSessions);
        localStorage.setItem('focus_sessions', JSON.stringify(updatedSessions));
        
        if (!isMuted) {
           const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
           audio.play().catch(() => {});
        }
      }
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, settings, sessions, isMuted, selectedTaskId, tasks]);

  const toggleTimer = () => setIsActive(!isActive);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (settings[mode] * 60)) * 100;
  const currentTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col pt-20 pb-24 overflow-y-auto custom-scrollbar",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-[#F4FBF7] text-slate-900"
    )}>
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/50 via-transparent to-[#6366F1]/50 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }} />

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-transparent z-40">
        <button 
          onClick={onBack}
          className={cn(
            "p-3 rounded-2xl border backdrop-blur-xl transition-all flex items-center gap-2",
            theme === 'dark' ? "bg-slate-900/50 border-slate-800 text-white" : "bg-white/80 border-slate-200 text-slate-900"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold text-sm">返回</span>
        </button>

        <div className="flex gap-2">
           <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-3 rounded-2xl border backdrop-blur-xl transition-all",
              theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white/80 border-slate-200"
            )}
            title={isMuted ? "开启声音" : "静音"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-accent" />}
          </button>
           <button 
            onClick={() => setShowSettings(true)}
            className={cn(
              "p-3 rounded-2xl border backdrop-blur-xl transition-all",
              theme === 'dark' ? "bg-slate-900/50 border-slate-800 text-white" : "bg-white/80 border-slate-200 text-slate-900"
            )}
            title="计时器设置"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start max-w-4xl mx-auto w-full px-6 pt-10 relative z-10 pointer-events-auto">
        
        {/* Active Task Status */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 w-full max-w-[400px]"
        >
          <button
            onClick={() => setShowTaskPicker(true)}
            className={cn(
              "w-full p-4 rounded-3xl border backdrop-blur-md flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
              theme === 'dark' ? "bg-slate-900/40 border-slate-800" : "bg-white/50 border-slate-200"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              selectedTaskId ? "bg-accent/20 text-accent border border-accent/20" : "bg-slate-500/10 text-slate-400"
            )}>
              {selectedTaskId ? <Target className="w-6 h-6" /> : <ListTodo className="w-6 h-6" />}
            </div>
            <div className="flex-1 text-left">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">
                正在执行的任务
              </div>
              <div className="text-sm font-bold truncate">
                {currentTask ? currentTask.title : "未选择当前目标任务"}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>

        {/* Timer UI */}
        <div className="relative w-full aspect-square max-w-[360px] flex items-center justify-center mb-12">
          {/* Progress Ring Background */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              strokeWidth="16"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="16"
              strokeLinecap="round"
              initial={{ strokeDasharray: "283% 283%", strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: `${283 - (progress / 100) * 283}%` }}
              transition={{ duration: 0.5, ease: "linear" }}
              style={{
                strokeDasharray: "283% 283%",
                transformOrigin: "center",
                filter: "drop-shadow(0 0 8px var(--accent))"
              }}
            />
          </svg>

          {/* Timer Display */}
          <div className="relative z-10 text-center">
            <motion.div 
              key={mode}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <div className={cn(
                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                mode === 'work' ? "bg-accent/20 text-accent border border-accent/20" : "bg-slate-500/20 text-slate-500"
              )}>
                {mode === 'work' ? '专注学习中' : mode === 'shortBreak' ? '短时间休息' : '深度休息'}
              </div>
            </motion.div>
            <div className="text-7xl font-black font-display tracking-tighter mb-1 tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <div className="text-slate-500 font-bold text-[10px] tracking-widest uppercase opacity-60">
              剩余时间
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8 w-full mb-16">
          <div className="flex items-center gap-6">
            <button 
              onClick={resetTimer}
              className={cn(
                "p-5 rounded-[2rem] border transition-all hover:scale-110 active:scale-95",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <RotateCcw className="w-6 h-6 text-slate-500" />
            </button>

            <button 
              onClick={toggleTimer}
              className="w-24 h-24 rounded-[3rem] bg-accent text-white text-white flex items-center justify-center shadow-premium shadow-accent/40 hover:scale-105 active:scale-95 transition-all"
            >
              {isActive ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
            </button>

            <button 
              onClick={() => {
                const modes: TimerMode[] = ['work', 'shortBreak', 'longBreak'];
                const nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
                setMode(nextMode);
              }}
              className={cn(
                "p-5 rounded-[2rem] border transition-all hover:scale-110 active:scale-95",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <Sparkles className="w-6 h-6 text-accent" />
            </button>
          </div>

          <div className="flex gap-2 p-1.5 bg-slate-900/10 dark:bg-slate-950/80 rounded-[2.5rem] border border-transparent dark:border-slate-800">
            {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-8 py-3 rounded-3xl text-xs font-bold transition-all",
                  mode === m 
                    ? "bg-accent text-white text-white shadow-xl shadow-accent/20" 
                    : "text-slate-500 hover:text-slate-400"
                )}
              >
                {m === 'work' ? '专注' : m === 'shortBreak' ? '短休' : '长休'}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics & History Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pb-32">
          {/* History */}
          <div className={cn(
            "p-8 rounded-[2.5rem] border backdrop-blur-md",
            theme === 'dark' ? "bg-slate-900/40 border-slate-800" : "bg-white/60 border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-sm">
                  <History className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-black text-lg">最近专注</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-10 opacity-30">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xs font-bold font-mono">NO RECORDS FOUND</p>
                </div>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center gap-4 group">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 shadow-sm",
                      session.type === 'work' 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                        : "bg-accent/10 border-accent/20 text-accent"
                    )}>
                      {session.type === 'work' ? <Brain className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold truncate">
                        {session.taskTitle || (session.type === 'work' ? '深度学习' : '精力恢复')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">{session.duration} 分钟 • {new Date(session.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 tabular-nums">
                      {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className={cn(
            "p-8 rounded-[2.5rem] border backdrop-blur-md",
            theme === 'dark' ? "bg-slate-900/40 border-slate-800" : "bg-white/60 border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shadow-sm">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-black text-lg">专注数据</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "p-5 rounded-3xl border flex flex-col items-center justify-center gap-1",
                theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <div className="text-2xl font-black">{sessions.length}</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">完成回合<br/>ROUNDS</div>
              </div>
              <div className={cn(
                "p-5 rounded-3xl border flex flex-col items-center justify-center gap-1",
                theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <div className="text-2xl font-black">
                  {Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / 60 * 10) / 10}
                </div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">累计小时<br/>HOURS</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-md p-8 rounded-[3rem] border shadow-3xl",
                theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-sm">
                    <Sliders className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold">自定义计时</h3>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-3 bg-slate-500/10 rounded-2xl hover:bg-slate-500/20 text-slate-500 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {(['work', 'shortBreak', 'longBreak'] as const).map((m) => (
                  <div key={m} className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                        {m === 'work' ? '专注学习时长' : m === 'shortBreak' ? '短休时长' : '长休时长'}
                      </label>
                      <span className="text-sm font-bold text-accent">{settings[m]} 分钟</span>
                    </div>
                    <input 
                      type="range" 
                      min={m === 'work' ? 10 : 1} 
                      max={m === 'work' ? 120 : 60} 
                      value={settings[m]}
                      onChange={(e) => setSettings({ ...settings, [m]: parseInt(e.target.value) })}
                      className="w-full accent-accent bg-slate-500/10 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  resetTimer();
                }}
                className="w-full mt-10 py-4 bg-accent text-white text-white rounded-[1.5rem] font-bold shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                应用并保存设置
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Picker Overlay */}
      <AnimatePresence>
        {showTaskPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-md max-h-[80vh] flex flex-col p-8 rounded-[3rem] border shadow-3xl",
                theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-sm">
                    <ListTodo className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold">关联任务</h3>
                </div>
                <button 
                  onClick={() => setShowTaskPicker(false)}
                  className="p-3 bg-slate-500/10 rounded-2xl hover:bg-slate-500/20 text-slate-500 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mb-6">
                <button
                  onClick={() => {
                    setSelectedTaskId(null);
                    setShowTaskPicker(false);
                  }}
                  className={cn(
                    "w-full p-5 rounded-3xl border text-left transition-all",
                    !selectedTaskId ? "bg-accent/10 border-accent/30 shadow-inner" : "bg-slate-500/5 border-transparent"
                  )}
                >
                    <div className={cn("font-bold text-sm", !selectedTaskId ? "text-accent" : (theme === 'dark' ? "text-white" : "text-slate-900"))}>不关联任务</div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Clear Task Selection</div>
                </button>

                {tasks.filter(t => !t.completed && !t.deletedAt).map(task => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setShowTaskPicker(false);
                    }}
                    className={cn(
                      "w-full p-5 rounded-3xl border text-left transition-all flex items-center gap-4",
                      selectedTaskId === task.id ? "bg-accent/10 border-accent/30 shadow-inner" : "bg-slate-500/5 border-transparent"
                    )}
                  >
                    <div className="flex-1">
                      <div className={cn("font-bold text-sm line-clamp-1", selectedTaskId === task.id ? "text-accent" : (theme === 'dark' ? "text-white" : "text-slate-900"))}>{task.title}</div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{task.priority || 'NORMAL'} PRIORITY</div>
                    </div>
                    {selectedTaskId === task.id && <CheckCircle2 className="w-5 h-5 text-accent" />}
                  </button>
                ))}

                {tasks.filter(t => !t.completed && !t.deletedAt).length === 0 && (
                  <div className="text-center py-20 opacity-40">
                    <Sparkles className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-bold">没有待办任务，去目标商城规划吧</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
