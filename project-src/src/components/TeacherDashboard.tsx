import React, { useState, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  X,
  Search,
  Filter,
  ChevronRight,
  BarChart3,
  MessageSquare,
  Calendar,
  Trash2,
  MoreVertical,
  Zap,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  progress: number;
  lastActive: string;
  status: 'online' | 'offline';
  completedTasks: number;
  totalTasks: number;
  mastery: Record<string, 'unlearned' | 'familiar' | 'mastered'>;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  deadline: string;
  assignedTo: string[]; // student IDs or 'all'
  submissions: number;
  total: number;
  status: 'active' | 'expired';
}

interface TeacherDashboardProps {
  theme: 'dark' | 'light';
  tasks: any[];
  onAddTask: (task: any) => void;
  onDeleteTask: (id: string) => void;
  masteryState: Record<string, any>;
  submissions: Submission[];
  onUpdateSubmissions: (submissions: Submission[]) => void;
  onAddStudent: (username: string) => void;
  classes: {id: string, name: string, password?: string, headTeacherId?: string}[];
  activeClassId: string;
  onSetActiveClass: (id: string) => void;
  onAddClass: (name: string, password?: string, isHeadTeacher?: boolean) => void;
  unlockedClasses: string[];
  onUnlockClass: (id: string) => void;
  currentTeacherId?: string;
  teacherSubject?: 'math' | 'chinese' | 'english';
}

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  homeworkId: string;
  homeworkTitle: string;
  subject: 'math' | 'chinese' | 'english';
  photoUrl: string;
  timestamp: string;
  status: 'pending' | 'graded';
  grade?: number;
  comment?: string;
}

export default function TeacherDashboard({ 
  theme, 
  tasks, 
  onAddTask, 
  onDeleteTask, 
  masteryState,
  submissions,
  onUpdateSubmissions,
  onAddStudent,
  classes,
  activeClassId,
  onSetActiveClass,
  onAddClass,
  unlockedClasses,
  onUnlockClass,
  currentTeacherId,
  teacherSubject,
  students: initialStudents = [],
  onToggleView
}: TeacherDashboardProps & { students?: any[], onToggleView?: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'homework' | 'submissions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingHomework, setIsAddingHomework] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isHeadTeacher, setIsHeadTeacher] = useState(false);
  const [classPassword, setClassPassword] = useState('');
  const [isUnlockingClass, setIsUnlockingClass] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [students, setStudents] = useState<Student[]>(initialStudents);

  // Update students if prop changes
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);
  const [newHomework, setNewHomework] = useState({ title: '', description: '', deadline: '' });
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState(100);
  const [gradeComment, setGradeComment] = useState('');

  const handleGrade = () => {
    if (!gradingSubmission) return;
    onUpdateSubmissions(submissions.map(s => 
      s.id === gradingSubmission.id 
        ? { ...s, status: 'graded', grade: gradeValue, comment: gradeComment } 
        : s
    ));
    setGradingSubmission(null);
    setGradeValue(100);
    setGradeComment('');
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.name.includes(searchQuery));
  }, [students, searchQuery]);

  const handleAddStudent = () => {
    if (!newStudentId) return;
    onAddStudent(newStudentId);
    setNewStudentId('');
    setIsAddingStudent(false);
  };

  const handleAddTask = () => {
    if (!newHomework.title) return;
    onAddTask({
      id: Math.random().toString(36).substr(2, 9),
      ...newHomework,
      completed: false,
      priority: 'medium',
      classId: activeClassId,
      subject: teacherSubject
    });
    setNewHomework({ title: '', description: '', deadline: '' });
    setIsAddingHomework(false);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => !teacherSubject || s.subject === teacherSubject);
  }, [submissions, teacherSubject]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => !teacherSubject || t.subject === teacherSubject);
  }, [tasks, teacherSubject]);

  const stats = useMemo(() => {
    const avgProgress = students.reduce((acc, s) => acc + s.progress, 0) / (students.length || 1);
    const totalSubmissions = filteredSubmissions.length;
    return {
      avgProgress: Math.round(avgProgress),
      totalSubmissions,
      activeStudents: students.filter(s => s.status === 'online').length
    };
  }, [students, filteredSubmissions]);

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden pt-20",
      "text-[var(--app-text)]"
    )} style={{ background: 'var(--app-bg-gradient, var(--app-bg))' }}>
      {/* Header */}
      <div className="p-4 md:p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1 md:mb-2">教师控制台</h1>
            <p className="text-slate-500 text-xs md:text-sm">管理班级进度、布置作业并监控学生表现。</p>
          </div>
          
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border",
              theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
            )}>
              <Users className="w-4 h-4 text-accent" />
              <select 
                value={activeClassId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  const targetClass = classes.find(c => c.id === targetId);
                  
                  // If class has password and teacher is not head teacher and not unlocked
                  if (targetClass?.password && targetClass.headTeacherId !== currentTeacherId && !unlockedClasses.includes(targetId)) {
                    setIsUnlockingClass(targetId);
                    setUnlockPassword('');
                    setUnlockError('');
                  } else {
                    onSetActiveClass(targetId);
                  }
                }}
                className="bg-transparent text-sm font-bold outline-none cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.headTeacherId ? `(${c.headTeacherId} 班主任)` : ''}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setIsAddingClass(true)}
              className={cn(
                "p-2 rounded-xl border transition-all",
                theme === 'dark' ? "bg-slate-900 border-white/10 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
              )}
              title="创建新班级"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={onToggleView}
            className={cn(
              "flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
              theme === 'dark' ? "bg-slate-900 border-white/10 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
            )}
          >
            <Zap className="w-4 h-4" />
            查看学生图谱
          </button>
          <button 
            onClick={() => setIsAddingHomework(true)}
            className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-accent text-white hover:bg-accent text-white text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent/20"
          >
            <Plus className="w-4 h-4" />
            布置新作业
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 flex gap-4 md:gap-8 border-b border-slate-500/10 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {[
          { id: 'overview', label: '概览', icon: BarChart3 },
          { id: 'students', label: '学生管理', icon: Users },
          { id: 'homework', label: '作业列表', icon: BookOpen },
          { id: 'submissions', label: '作业批改', icon: CheckCircle2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 py-4 text-sm font-bold transition-all relative flex-shrink-0",
              activeTab === tab.id ? "text-accent" : "text-slate-500 hover:text-slate-400"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="teacher-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent text-white"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: '班级平均进度', value: `${stats.avgProgress}%`, icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10 border border-accent/20' },
                  { label: '作业提交总数', value: stats.totalSubmissions, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: '当前在线人数', value: stats.activeStudents, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                ].map((stat, i) => (
                  <div key={i} className={cn(
                    "p-6 rounded-3xl border flex items-center gap-4",
                    theme === 'dark' ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-100 shadow-sm"
                  )}>
                    <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-black">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Class Progress Overview */}
              <div className={cn(
                "p-8 rounded-[2.5rem] border",
                theme === 'dark' ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-lg">班级学习进度概览</h3>
                </div>
                <div className="space-y-6">
                  {students.slice(0, 3).map(student => (
                    <div key={student.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{student.name}</span>
                        <span>{student.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-500/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${student.progress}%` }}
                          className="h-full bg-accent text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="space-y-4">
                <h3 className="font-black text-lg">待办提醒</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.filter(s => s.status === 'pending').length > 0 ? (
                    <div className={cn(
                      "p-4 rounded-2xl border flex items-start gap-3",
                      theme === 'dark' ? "bg-red-500/5 border-red-500/20" : "bg-red-50/50 border-red-100"
                    )}>
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{submissions.filter(s => s.status === 'pending').length} 份作业待批改</p>
                        <p className="text-xs text-slate-500 mt-1">请及时处理学生的提交，给予反馈。</p>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "p-4 rounded-2xl border flex items-start gap-3",
                      theme === 'dark' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-100"
                    )}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">当前无待批改作业</p>
                        <p className="text-xs text-slate-500 mt-1">所有提交已处理完毕，保持良好节奏！</p>
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-start gap-3",
                    theme === 'dark' ? "bg-accent text-white/5 border-accent/20" : "bg-blue-50/50 border-blue-100"
                  )}>
                    <MessageSquare className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">收到学生互动</p>
                      <p className="text-xs text-slate-500 mt-1">点击查看最近的学习图谱波动与互动疑问。</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="搜索学生姓名..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 rounded-2xl border text-sm transition-all focus:ring-2 focus:ring-accent/20 outline-none",
                      theme === 'dark' ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-100"
                    )}
                  />
                </div>
                <button 
                  onClick={() => setIsAddingStudent(true)}
                  className="px-6 py-3 bg-accent text-white text-white rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-accent/20"
                >
                  <Plus className="w-4 h-4" />
                  添加学生
                </button>
                <button className={cn(
                  "p-3 rounded-2xl border flex items-center gap-2 text-sm font-bold",
                  theme === 'dark' ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-white border-slate-100 text-slate-600"
                )}>
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredStudents.map(student => (
                  <div key={student.id} className={cn(
                    "p-4 rounded-3xl border flex items-center gap-4 group hover:border-accent/50 transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-100 shadow-sm"
                  )}>
                    <div className="relative">
                      <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-2xl bg-slate-100" />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        student.status === 'online' ? "bg-emerald-500" : "bg-slate-300"
                      )} />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm">{student.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">最后活跃: {student.lastActive}</p>
                    </div>
                    <div className="hidden md:block px-8 border-x border-slate-500/10">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">学习进度</p>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-slate-500/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${student.progress}%` }}
                            className="h-full bg-accent text-white"
                          />
                        </div>
                        <span className="text-xs font-black">{student.progress}%</span>
                      </div>
                    </div>
                    <div className="hidden md:block px-8">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">作业完成</p>
                      <p className="text-sm font-black">{student.completedTasks} / {student.totalTasks}</p>
                    </div>
                    <button className={cn(
                      "p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all",
                      theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-100"
                    )}>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'homework' && (
            <motion.div
              key="homework"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTasks.map((hw, i) => (
                  <div key={hw.id} className={cn(
                    "p-6 rounded-[2.5rem] border flex flex-col gap-4 relative overflow-hidden",
                    theme === 'dark' ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-100 shadow-sm"
                  )}>
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-2xl bg-accent/10 text-accent border border-accent/20">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <button 
                        onClick={() => onDeleteTask(hw.id)}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{hw.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        截止: {hw.deadline || '未设置'}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-500/10">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <span>提交进度</span>
                        <span>{submissions.filter(s => s.homeworkId === hw.id).length}/{students.length}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-500/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(submissions.filter(s => s.homeworkId === hw.id).length / (students.length || 1)) * 100}%` }}
                          className="h-full bg-accent text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 font-bold">暂无作业，点击右上角布置新作业</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'submissions' && (
            <motion.div
              key="submissions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4">
                {filteredSubmissions.map(sub => (
                  <div 
                    key={sub.id}
                    className={cn(
                      "p-6 rounded-3xl border flex items-center justify-between",
                      theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-lg"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-800 cursor-pointer" onClick={() => setGradingSubmission(sub)}>
                        <img src={sub.photoUrl} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">{sub.studentName}</h4>
                        <p className="text-sm text-slate-500">{sub.homeworkTitle}</p>
                        <p className="text-[10px] text-slate-600 uppercase font-bold mt-1">提交时间: {sub.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {sub.status === 'graded' ? (
                        <div className="text-right">
                          <div className="text-2xl font-black text-emerald-500">{sub.grade}分</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">已批改</div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setGradingSubmission(sub)}
                          className="px-6 py-3 bg-accent text-white text-white rounded-2xl font-bold text-sm shadow-lg shadow-accent/20"
                        >
                          立即批改
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Class Creation Modal */}
      <AnimatePresence>
        {isAddingClass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={cn(
                "max-w-md w-full p-8 rounded-[2.5rem] border shadow-premium",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <h3 className="text-xl font-black mb-6">创建新班级</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">班级名称</label>
                  <input 
                    type="text"
                    placeholder="例如：初三二班"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-500/5">
                  <input 
                    type="checkbox"
                    id="isHeadTeacher"
                    checked={isHeadTeacher}
                    onChange={(e) => setIsHeadTeacher(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  <label htmlFor="isHeadTeacher" className="text-sm font-bold cursor-pointer">
                    我是该班班主任 (需要设置进入密码)
                  </label>
                </div>

                {isHeadTeacher && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">班级进入密码</label>
                    <input 
                      type="password"
                      placeholder="设置其他老师进入时的密码"
                      value={classPassword}
                      onChange={(e) => setClassPassword(e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20",
                        theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}
                    />
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setIsAddingClass(false);
                      setIsHeadTeacher(false);
                      setClassPassword('');
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-2xl font-bold text-sm",
                      theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      if (newClassName.trim()) {
                        onAddClass(newClassName, isHeadTeacher ? classPassword : undefined, isHeadTeacher);
                        setNewClassName('');
                        setClassPassword('');
                        setIsHeadTeacher(false);
                        setIsAddingClass(false);
                      }
                    }}
                    className="flex-1 py-3 bg-accent text-white text-white rounded-2xl font-bold text-sm shadow-lg shadow-accent/20"
                  >
                    创建班级
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Unlock Modal */}
      <AnimatePresence>
        {isUnlockingClass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={cn(
                "max-w-md w-full p-8 rounded-[2.5rem] border shadow-2xl",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black">班级已锁定</h3>
                  <p className="text-slate-500 text-xs">该班级由班主任管理，请输入密码进入。</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">访问密码</label>
                  <input 
                    type="password"
                    placeholder="请输入班级访问密码"
                    value={unlockPassword}
                    onChange={(e) => {
                      setUnlockPassword(e.target.value);
                      setUnlockError('');
                    }}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                  {unlockError && <p className="text-red-500 text-[10px] font-bold mt-2">{unlockError}</p>}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsUnlockingClass(null)}
                    className={cn(
                      "flex-1 py-3 rounded-2xl font-bold text-sm",
                      theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      const targetClass = classes.find(c => c.id === isUnlockingClass);
                      if (targetClass?.password === unlockPassword) {
                        onUnlockClass(isUnlockingClass!);
                        onSetActiveClass(isUnlockingClass!);
                        setIsUnlockingClass(null);
                      } else {
                        setUnlockError('密码错误，请重新输入');
                      }
                    }}
                    className="flex-1 py-3 bg-accent text-white text-white rounded-2xl font-bold text-sm shadow-lg shadow-accent/20"
                  >
                    验证并进入
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grading Modal */}
      <AnimatePresence>
        {gradingSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={cn(
                "max-w-4xl w-full rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col md:flex-row",
                theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
              )}
            >
              <div className="md:w-1/2 h-96 md:h-auto bg-black">
                <img src={gradingSubmission.photoUrl} className="w-full h-full object-contain" />
              </div>
              <div className="md:w-1/2 p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">作业批改</h2>
                    <p className="text-slate-500 text-sm">{gradingSubmission.studentName} - {gradingSubmission.homeworkTitle}</p>
                  </div>
                  <button onClick={() => setGradingSubmission(null)} className="p-2 hover:bg-slate-800 rounded-xl">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">评分 (0-100)</label>
                  <input 
                    type="number" 
                    value={gradeValue || 0}
                    onChange={(e) => setGradeValue(Number(e.target.value))}
                    className={cn(
                      "w-full p-4 rounded-2xl border text-2xl font-black outline-none",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">批语</label>
                  <textarea 
                    value={gradeComment || ''}
                    onChange={(e) => setGradeComment(e.target.value)}
                    placeholder="输入批改意见..."
                    className={cn(
                      "w-full p-4 rounded-2xl border text-sm h-32 outline-none resize-none",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>

                <button 
                  onClick={handleGrade}
                  className="w-full py-5 bg-accent text-white text-white rounded-3xl font-black text-lg shadow-xl shadow-accent/20"
                >
                  提交批改结果
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isAddingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={cn(
                "max-w-md w-full p-10 rounded-[3rem] border shadow-2xl",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tight">添加学生</h2>
                <button onClick={() => setIsAddingStudent(false)} className="p-2 hover:bg-slate-800 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">学号 (Student ID)</label>
                  <input 
                    type="text" 
                    placeholder="输入学生学号..."
                    value={newStudentId || ''}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className={cn(
                      "w-full p-4 rounded-2xl border outline-none",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>
                <button 
                  onClick={handleAddStudent}
                  className="w-full py-4 bg-accent text-white text-white rounded-2xl font-bold shadow-lg shadow-accent/20"
                >
                  确认添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Homework Modal */}
      <AnimatePresence>
        {isAddingHomework && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingHomework(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-lg p-8 rounded-[3rem] border shadow-2xl",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              )}
            >
              <h2 className="text-2xl font-black mb-6">布置新作业</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">作业标题</label>
                  <input 
                    type="text"
                    placeholder="例如：二次函数基础练习"
                    value={newHomework.title}
                    onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">作业描述</label>
                  <textarea 
                    placeholder="详细说明作业要求..."
                    rows={3}
                    value={newHomework.description}
                    onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">截止日期</label>
                    <input 
                      type="date"
                      value={newHomework.deadline}
                      onChange={(e) => setNewHomework({ ...newHomework, deadline: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20 transition-all",
                        theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">关联知识点</label>
                    <select className={cn(
                      "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}>
                      <option>选择知识点...</option>
                      <option>二次函数</option>
                      <option>勾股定理</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setIsAddingHomework(false)}
                  className={cn(
                    "flex-grow py-4 rounded-2xl font-bold transition-all",
                    theme === 'dark' ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"
                  )}
                >
                  取消
                </button>
                <button 
                  onClick={handleAddTask}
                  className="flex-grow py-4 rounded-2xl bg-accent text-white hover:bg-accent text-white text-white font-bold transition-all shadow-lg shadow-accent/20"
                >
                  确认布置
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
