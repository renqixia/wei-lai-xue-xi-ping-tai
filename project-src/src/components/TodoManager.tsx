import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  X,
  Clock,
  BarChart3,
  ArrowLeft,
  Edit2,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TaskPriority = 'high' | 'medium' | 'low' | 'none';
type TaskSubject = 'math' | 'chinese' | 'english' | 'other';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  subject: TaskSubject;
  deadline: string;
  createdAt: string;
  deletedAt?: string;
}

interface TodoManagerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  theme: 'dark' | 'light';
  accentColor: string;
  onBack: () => void;
}

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export default function TodoManager({ tasks, setTasks, theme, accentColor, onBack }: TodoManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [subject, setSubject] = useState<TaskSubject>('math');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  // Auto-cleanup recycle bin (30 days)
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setTasks(prev => prev.filter(task => {
      if (!task.deletedAt) return true;
      return new Date(task.deletedAt) > thirtyDaysAgo;
    }));
  }, []);

  const activeTasks = useMemo(() => tasks.filter(t => !t.deletedAt), [tasks]);
  const deletedTasks = useMemo(() => tasks.filter(t => !!t.deletedAt), [tasks]);

  const filteredTasks = useMemo(() => {
    const source = showRecycleBin ? deletedTasks : activeTasks;
    return source.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && !task.completed) || 
                           (filterStatus === 'completed' && task.completed);
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1, none: 0 };
      if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [activeTasks, deletedTasks, searchQuery, filterStatus, showRecycleBin]);

  const stats = useMemo(() => {
    const total = activeTasks.length;
    const completed = activeTasks.filter(t => t.completed).length;
    const high = activeTasks.filter(t => t.priority === 'high').length;
    return {
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      total,
      completed,
      high
    };
  }, [activeTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入任务标题');
      return;
    }
    if (deadline && new Date(deadline) < new Date()) {
      setError('截止时间不能早于当前时间');
      return;
    }

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title,
        description,
        priority,
        subject,
        deadline
      } : t));
      setEditingTask(null);
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        completed: false,
        priority,
        subject,
        deadline,
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('none');
    setSubject('math');
    setDeadline('');
    setError('');
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setSubject(task.subject);
    setDeadline(task.deadline);
    setShowRecycleBin(false);
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t));
  };

  const handleRestore = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, deletedAt: undefined } : t));
  };

  const handlePermanentDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getRemainingTime = (deadline: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    if (diff < 0) return { text: '已过期', color: 'text-red-500' };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return { text: `剩余 ${days} 天`, color: 'text-slate-500' };
    if (hours > 0) return { text: `剩余 ${hours} 小时`, color: 'text-amber-500' };
    return { text: '即将到期', color: 'text-red-400' };
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex flex-col",
      "text-[var(--app-text)]"
    )} style={{ background: 'var(--app-bg-gradient, var(--app-bg))' }}>
      {/* Header */}
      <header className={cn(
        "p-6 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md",
        theme === 'dark' ? "bg-slate-900/80 border-white/10" : "bg-white/80 border-slate-200"
      )}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={cn(
              "p-2 rounded-xl border transition-all",
              theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-100"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">目标商城</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Goal Management Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">完成进度</span>
              <span className="text-xs font-black text-accent">{stats.percent}%</span>
            </div>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.percent}%` }}
                className="h-full bg-accent text-white"
              />
            </div>
          </div>
          <button 
            onClick={() => setShowRecycleBin(!showRecycleBin)}
            className={cn(
              "p-2.5 rounded-xl border transition-all relative",
              showRecycleBin 
                ? "bg-accent text-white text-white border-accent shadow-lg shadow-accent/20" 
                : theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
            )}
          >
            <Trash2 className="w-5 h-5" />
            {deletedTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {deletedTasks.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Form */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className={cn(
            "p-6 rounded-3xl border sticky top-28",
            theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          )}>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              {editingTask ? <Edit2 className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />}
              {editingTask ? '编辑任务' : '添加新任务'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">任务标题</label>
                <div 
                  className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm"
                  style={{ borderColor: 'var(--accent)44' }}
                >
                  <input 
                    type="text"
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：完成二次函数练习"
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">任务描述</label>
                <div 
                  className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm"
                  style={{ borderColor: 'var(--accent)44' }}
                >
                  <textarea 
                    value={description || ''}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="添加更多细节..."
                    rows={3}
                    className="w-full bg-transparent outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">优先级</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl border outline-none transition-all text-xs appearance-none",
                      theme === 'dark' ? "bg-slate-950 border-slate-800 focus:border-accent" : "bg-slate-50 border-slate-200 focus:border-accent"
                    )}
                  >
                    <option value="none">无</option>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">科目</label>
                  <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as TaskSubject)}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl border outline-none transition-all text-xs appearance-none",
                      theme === 'dark' ? "bg-slate-950 border-slate-800 focus:border-accent" : "bg-slate-50 border-slate-200 focus:border-accent"
                    )}
                  >
                    <option value="math">数学</option>
                    <option value="chinese">语文</option>
                    <option value="english">英语</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">截止时间</label>
                <input 
                  type="datetime-local"
                  value={deadline || ''}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-xs",
                    theme === 'dark' ? "bg-slate-950 border-slate-800 focus:border-accent" : "bg-slate-50 border-slate-200 focus:border-accent"
                  )}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold bg-red-500/10 p-2 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                {editingTask && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingTask(null);
                      setTitle('');
                      setDescription('');
                      setPriority('none');
                      setSubject('math');
                      setDeadline('');
                    }}
                    className={cn(
                      "flex-grow py-3 rounded-xl font-bold text-xs transition-all border",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    取消
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-grow py-3 bg-accent text-white text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-accent/20 hover:opacity-90"
                >
                  {editingTask ? '更新任务' : '创建任务'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="flex-grow space-y-6">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all",
              theme === 'dark' ? "bg-slate-900/50 border-slate-800 focus-within:border-accent" : "bg-white border-slate-200 focus-within:border-accent shadow-sm"
            )}>
              <Search className="w-5 h-5 text-slate-500" />
              <input 
                type="text"
                placeholder="搜索任务标题或描述..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                      filterStatus === s 
                        ? "bg-accent text-white border-accent text-white shadow-lg shadow-accent/20" 
                        : theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {s === 'all' ? '全部' : s === 'active' ? '进行中' : '已完成'}
                  </button>
                ))}
              </div>
              
              {showRecycleBin && deletedTasks.length > 0 && (
                <button 
                  onClick={() => setTasks(prev => prev.filter(t => !t.deletedAt))}
                  className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  清空回收站
                </button>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-slate-800/20 rounded-full flex items-center justify-center mx-auto">
                    {showRecycleBin ? <Trash2 className="w-8 h-8 text-slate-700" /> : <CheckCircle2 className="w-8 h-8 text-slate-700" />}
                  </div>
                  <p className="text-slate-500 text-sm">
                    {showRecycleBin ? '回收站是空的' : '没有找到相关任务'}
                  </p>
                </motion.div>
              ) : (
                filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group p-5 rounded-3xl border transition-all flex items-start gap-4",
                      theme === 'dark' ? "bg-slate-900/40 border-slate-800 hover:bg-slate-900/60" : "bg-white border-slate-200 hover:shadow-md",
                      task.priority === 'high' ? "border-l-4 border-l-red-500" : 
                      task.priority === 'medium' ? "border-l-4 border-l-amber-500" : 
                      task.priority === 'low' ? "border-l-4 border-l-blue-500" : "",
                      task.completed && "opacity-60"
                    )}
                  >
                    {!showRecycleBin && (
                      <button 
                        onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                        className={cn(
                          "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                          task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-700 hover:border-emerald-500"
                        )}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    )}

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                          task.subject === 'math' ? "bg-accent/10 text-accent border border-accent/20" :
                          task.subject === 'chinese' ? "bg-red-500/10 text-red-500" :
                          task.subject === 'english' ? "bg-violet-500/10 text-violet-500" : "bg-slate-500/10 text-slate-500"
                        )}>
                          {task.subject === 'math' ? '数学' : task.subject === 'chinese' ? '语文' : task.subject === 'english' ? '英语' : '其他'}
                        </span>
                        <h3 className={cn(
                          "font-bold text-sm truncate",
                          task.completed && "line-through text-slate-500"
                        )}>{task.title}</h3>
                      </div>
                      <p className={cn(
                        "text-xs text-slate-500 line-clamp-2 mb-3",
                        task.completed && "line-through"
                      )}>{task.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        {task.deadline && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span className={cn("text-[10px] font-bold", getRemainingTime(task.deadline)?.color)}>
                              {getRemainingTime(task.deadline)?.text}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          <span className="text-[10px] text-slate-600 font-medium">
                            创建于 {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {showRecycleBin && task.deletedAt && (
                          <div className="flex items-center gap-1.5 text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-bold">
                              将在 {Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(task.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))} 天后清理
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {showRecycleBin ? (
                        <>
                          <button 
                            onClick={() => handleRestore(task.id)}
                            className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="恢复任务"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePermanentDelete(task.id)}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="永久删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEdit(task)}
                            className="p-2 text-slate-500 hover:text-accent hover:bg-accent text-white/10 rounded-lg transition-all"
                            title="编辑任务"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(task.id)}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="移至回收站"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
