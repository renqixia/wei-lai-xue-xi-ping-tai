import React, { useState, useMemo, useRef, useEffect } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity,
  Zap,
  Wind,
  Search,
  Plus,
  X,
  BookOpen, 
  RotateCw, 
  RotateCcw, 
  TrendingUp,
  TrendingDown,
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Info,
  ChevronRight,
  GraduationCap,
  Layers,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  BarChart3,
  Filter,
  ChevronDown,
  Sun,
  Moon,
  Type,
  Compass,
  Target,
  Layout,
  User,
  Users,
  Settings,
  LogOut,
  Home,
  Palette,
  Cloud,
  Languages,
  Pencil,
  Sparkles,
  Swords,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Calculator,
  Shapes,
  PieChart,
  BookText,
  ClipboardList,
  Star,
  Camera,
  Check,
  Clock,
  History,
  Brain
} from 'lucide-react';
import { ChineseKnowledgeBanner } from './components/ChineseKnowledgeBanner';
import { ChineseKnowledgeModal } from './components/ChineseKnowledgeModal';
import { colorSchemes, ColorScheme } from './lib/themes';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';
import { forceZ } from 'd3-force-3d';
import { mathData, Node, Link } from './data';
import TodoManager from './components/TodoManager';
import KnowledgeMarket from './components/KnowledgeMarket';
import TeacherDashboard from './components/TeacherDashboard';
import MathPK from './components/MathPK';
import ThreeScene from './components/ThreeScene';
import DailySummary from './components/DailySummary';
import { LearningEngineApp } from './components/LearningEngineApp';
import { ReviewWindow } from './components/ReviewWindow';
import { FocusTimer } from './components/FocusTimer';
import { EnglishModule } from './components/EnglishModule';
import { MindMap } from './components/MindMap';
import { Math3DGraph } from './components/Math3DGraph';
import { VipModal } from './components/VipModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { GradeRegistration } from './components/GradeRegistration';
import AIAssistant from './components/AIAssistant';
import { UserSettings } from './components/UserSettings';
import { GrowthTutorial } from './components/GrowthTutorial';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RADIAL_GRADIENT = 'radial-gradient(ellipse at top, var(--app-bg) 0%, #050505 100%)';
const RADIAL_GRADIENT_LIGHT = 'radial-gradient(ellipse at top, #FFFFFF 0%, var(--app-bg) 100%)';

const HighlightText = ({ text, highlight, theme }: { text: string; highlight: string; theme: 'dark' | 'light' }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className={cn(
            "rounded px-0.5",
            theme === 'dark' ? "text-accent bg-accent/20" : "text-accent bg-accent/10"
          )}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const TutorialOverlay = ({ 
  step, 
  onNext, 
  onSkip, 
  targetRef,
  theme 
}: { 
  step: number, 
  onNext: () => void, 
  onSkip: () => void, 
  targetRef: React.RefObject<HTMLElement>,
  theme: 'light' | 'dark'
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      if (targetRef && targetRef.current) {
        setRect(targetRef.current.getBoundingClientRect());
      }
    };
    
    updateRect();
    // Small delay to ensure layout has settled
    const timeoutId = setTimeout(updateRect, 100);
    
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      clearTimeout(timeoutId);
    };
  }, [targetRef, step]);

  if (!rect) return null;

  const tutorialSteps = [
    { title: "切换探索模式", content: "你可以根据主题领域、年级阶段或中考冲刺模式来查看知识点，帮助你从不同维度掌握数学。" },
    { title: "精准筛选", content: "利用筛选功能，你可以快速定位未掌握的知识点或不同难度的考点，制定更有针对性的复习计划。" },
    { title: "3D全景交互", content: "在这里你可以自由旋转、缩放。每一个球体都是一个核心考点，点击它们可以查看深度解析。" },
    { title: "目标中心", content: "在这里设置你的每日学习目标。完成目标不仅能提升能力，还能获得成就奖励哦！" },
    { title: "深度解析", content: "点击知识点后，这里会展示详细的解析、考点陷阱、典型例题以及即时测评。" }
  ];

  const currentStep = tutorialSteps[step];

  // Tooltip positioning logic
  const isRightHalf = rect.left + rect.width / 2 > window.innerWidth / 2;
  const isBottomHalf = rect.top + rect.height / 2 > window.innerHeight / 2;
  
  const tooltipX = isRightHalf ? rect.left - 320 : rect.right + 20;
  const tooltipY = isBottomHalf ? rect.top - 150 : rect.top;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop with hole */}
      <div 
        className="absolute inset-0 bg-black/60" 
        style={{ 
          clipPath: `polygon(0% 0%, 0% 100%, ${rect.left}px 100%, ${rect.left}px ${rect.top}px, ${rect.right}px ${rect.top}px, ${rect.right}px ${rect.bottom}px, ${rect.left}px ${rect.bottom}px, ${rect.left}px 100%, 100% 100%, 100% 0%)` 
        }} 
      />

      {/* Golden Highlight Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
        key={`ring-${step}`}
        style={{
          position: 'absolute',
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: '16px',
          border: '2px solid #fbbf24',
          boxShadow: '0 0 20px #fbbf24, inset 0 0 20px #fbbf24',
        }}
      >
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-yellow-400/10 rounded-[14px]"
        />
      </motion.div>

      {/* Tooltip Window */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={`tooltip-${step}`}
        className={cn(
          "absolute pointer-events-auto w-72 p-6 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl",
          theme === 'dark' ? "bg-slate-900/90 border-yellow-500/30" : "bg-white/90 border-yellow-500/30"
        )}
        style={{ 
          left: Math.max(20, Math.min(window.innerWidth - 300, tooltipX)), 
          top: Math.max(20, Math.min(window.innerHeight - 250, tooltipY)) 
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-widest">{currentStep.title}</h4>
        </div>
        <p className={cn(
          "text-xs leading-relaxed mb-6",
          theme === 'dark' ? "text-slate-300" : "text-slate-600"
        )}>
          {currentStep.content}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500">{step + 1} / {tutorialSteps.length}</span>
          <div className="flex gap-2">
            <button 
              onClick={onSkip}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              跳过
            </button>
            <button 
              onClick={onNext}
              className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-yellow-500/20"
            >
              {step === tutorialSteps.length - 1 ? '开始探索' : '下一步'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

type GradeFilter = 7 | 8 | 9 | 'all';
type DifficultyFilter = 'easy' | 'medium' | 'hard' | 'all';
type MasteryFilter = 'unlearned' | 'familiar' | 'mastered' | 'all';
type MasteryStatus = 'unlearned' | 'familiar' | 'mastered';
type ExplorationMode = 'grade' | 'topic' | 'exam';
type AppView = 'home' | 'graph' | 'grades' | 'todo' | 'settings' | 'pk' | 'summary' | 'games' | 'subjects' | 'chinese' | 'english' | 'timer' | 'ai';
type AccentColor = 'sierra-blue' | 'purple' | 'russet' | 'pink' | 'sunlight';
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
  deletedAt?: string; // For recycle bin
  classId?: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  photo: string;
  role: 'student' | 'teacher';
  level: number;
  exp: number;
  classId?: string;
  subject?: 'math' | 'chinese' | 'english';
  isVip?: boolean;
  vipExpiry?: string;
}

interface MarketStock {
  id: string;
  name: string;
  price: number;
  change: number;
  history: { time: string; open: number; close: number; high: number; low: number }[];
  category: string;
}

interface MarketEvent {
  id: string;
  title: string;
  description: string;
  type: 'bull' | 'bear';
  impact: number;
  timestamp: string;
}

const GoalItem = React.memo(({ task, theme, onToggle }: { task: Task; theme: 'dark' | 'light'; onToggle: (id: string) => void }) => {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border group transition-all",
      task.completed 
        ? "bg-emerald-500/10 border-emerald-500/20 opacity-60" 
        : "bg-accent/10 text-accent border border-accent/20"
    )}>
      <button 
        onClick={() => onToggle(task.id)}
        className={cn(
          "w-4 h-4 rounded border flex items-center justify-center transition-all",
          task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-600"
        )}
      >
        {task.completed && <CheckCircle2 className="w-3 h-3" />}
      </button>
      <span className={cn(
        "text-xs flex-grow",
        theme === 'dark' ? "text-slate-300" : "text-slate-700",
        task.completed && "line-through"
      )}>{task.title}</span>
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        task.priority === 'high' ? "bg-red-500" : 
        task.priority === 'medium' ? "bg-amber-500" : 
        task.priority === 'low' ? "bg-accent text-white" : "bg-slate-500"
      )} />
    </div>
  );
});

import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { auth } from './lib/firebase';

function LearningEngine() {
  const { profile, logout, updateProfile, resetAccount, clearReviewsOnly } = useAuth();
  const [view, setView] = useState<AppView>('home');
  const user = profile;
  const setUser = (updater: any) => {
    const newData = typeof updater === 'function' ? updater(profile || {}) : updater;
    if (newData) {
      updateProfile(newData).catch(err => console.error('Failed to update profile:', err));
    }
  };

  const isVip = useMemo(() => user?.isVip && new Date(user.vipExpiry || 0) > new Date(), [user]);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [showVipModal, setShowVipModal] = useState(false);
  
  const handleGraphAccess = (forceAccess: boolean = false) => {
    const username = user?.name || 'anonymous';
    const lastAccess = localStorage.getItem(`last_graph_access_${username}`);
    const isVipUser = isVip || (user?.role === 'teacher'); // Teachers should have full access
    
    console.log('Access attempted for:', username, 'VIP:', isVip, 'Last access:', lastAccess, 'Today:', today);

    // Beta version: Allow all access without showing VipModal
    localStorage.setItem(`last_graph_access_${username}`, today);
    setView('graph');
  };

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('learning_app_settings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.accentColor || 'sierra-blue';
      } catch(e) {}
    }
    return 'sierra-blue';
  });

  const [language, setLanguage] = useState<'zh' | 'en'>(() => {
    const saved = localStorage.getItem('learning_app_settings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.language || 'zh';
      } catch (e) { return 'zh'; }
    }
    return 'zh';
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', phone: '', subject: 'math' as 'math' | 'chinese' | 'english' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleSelection, setRoleSelection] = useState<'student' | 'teacher' | null>(null);
  
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [masteryState, setMasteryState] = useState<Record<string, MasteryStatus>>({});
  const [quizState, setQuizState] = useState<Record<string, { answered: boolean; correct: boolean }>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [credits, setCredits] = useState(0);
  const [checkInHistory, setCheckInHistory] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [marketIndex, setMarketIndex] = useState<number[]>([0, 0, 0, 0, 0]);
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number[]>>({});
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('topic');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeSchemeId, setActiveSchemeId] = useState<number>(1);

  const APP_VERSION = '2.0.0-clean';
  const [showTutorial, setShowTutorial] = useState(false);
  const [showKnowledgeMap, setShowKnowledgeMap] = useState(false);
  const [showGrowthTutorial, setShowGrowthTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [showBetaNotice, setShowBetaNotice] = useState(false);

  // Check for beta notice on mount
  useEffect(() => {
    const hasSeenNotice = localStorage.getItem('has_seen_beta_notice');
    if (!hasSeenNotice && user) {
      const timer = setTimeout(() => {
        setShowBetaNotice(true);
      }, 1000); // 延迟1秒弹出，体验更好
      return () => clearTimeout(timer);
    }
  }, [user]);

  const closeBetaNotice = () => {
    setShowBetaNotice(false);
    localStorage.setItem('has_seen_beta_notice', 'true');
  };

  // Version-based state reset
  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem('app_version', APP_VERSION);
      // Reset critical states to force clean start without reload loop
      setRegisteredUsers([]);
      setTasks([]);
      setClasses([]);
      setUser(null);
      setCredits(0);
      setPortfolio({});
    }
  }, []);

  // Apply colors to root element
  useEffect(() => {
    if (user) {
      localStorage.setItem('learning_app_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('learning_app_user');
    }
  }, [user]);

  useEffect(() => {
    const scheme = colorSchemes.find(s => s.id === activeSchemeId) || colorSchemes[0];
    const colors = theme === 'dark' ? scheme.dark : scheme.light;
    
    document.documentElement.style.setProperty('--app-bg', colors.bg);
    document.documentElement.style.setProperty('--app-text', colors.text);
    document.documentElement.style.setProperty('--accent', colors.accent);
    
    // Add subtle gradient for dark mode
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--app-bg-gradient', RADIAL_GRADIENT);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.style.setProperty('--app-bg-gradient', RADIAL_GRADIENT_LIGHT);
      document.documentElement.classList.remove('dark');
    }
  }, [theme, activeSchemeId]);

  useEffect(() => {
    localStorage.setItem('learning_app_settings', JSON.stringify({ 
      theme, 
      accentColor, 
      activeSchemeId,
      language,
      showTutorial,
      appVersion: APP_VERSION
    }));
  }, [theme, accentColor, activeSchemeId, language, showTutorial]);

  // Growth Tutorial Check
  useEffect(() => {
    if (user) {
      const savedSettings = localStorage.getItem('learning_app_settings');
      let needsTutorial = false;
      
      if (!savedSettings) {
        needsTutorial = true;
      } else {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.appVersion !== APP_VERSION) {
            needsTutorial = true;
          }
        } catch(e) {
          needsTutorial = true;
        }
      }

      if (needsTutorial) {
        // Delay slightly for smooth entrance
        const timer = setTimeout(() => {
          setShowGrowthTutorial(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const [showLabels, setShowLabels] = useState(true);
  const [graphSearchQuery, setGraphSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isPhysicsOpen, setIsPhysicsOpen] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);

  // Refs for Tutorial
  const modeSwitcherRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const goalCenterRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenMathTutorial');
    if (!hasSeenTutorial && view === 'graph') {
      setShowTutorial(true);
    }
  }, [view]);

  const [showPassword, setShowPassword] = useState(false);

  const handleNextStep = () => {
    if (tutorialStep < 4) {
      // If moving to step 4 (sidebar), we need a node selected
      if (tutorialStep === 3 && !selectedNode) {
        setSelectedNode(mathData.nodes[0] as Node);
      }
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('hasSeenMathTutorial', 'true');
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenMathTutorial', 'true');
  };
  const [isGoalPanelOpen, setIsGoalPanelOpen] = useState(false);
  const [isSubmittingHomework, setIsSubmittingHomework] = useState(false);
  const [submissionSubject, setSubmissionSubject] = useState<'math' | 'chinese' | 'english'>('math');
  const [isShowingMySubmissions, setIsShowingMySubmissions] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showHomeworkAlert, setShowHomeworkAlert] = useState(false);
  const [hasSeenHomeworkAlert, setHasSeenHomeworkAlert] = useState(() => {
    return sessionStorage.getItem('hasSeenHomeworkAlert') === 'true';
  });
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<any>(null);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState('');
  const [homeworkPhoto, setHomeworkPhoto] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<any[]>(() => {
    return [];
  });

  // Statistics calculation for UserSettings
  const stats = useMemo(() => {
    // 1. Total Study Time from Focus Sessions
    const savedSessions = localStorage.getItem('focus_sessions');
    let totalMinutes = 0;
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions);
        totalMinutes = sessions.reduce((acc: number, s: any) => acc + (s.completed ? s.duration : 0), 0);
      } catch(e) {}
    }
    
    // 2. Tasks completed
    const completedTasksCount = tasks.filter(t => t.completed).length;

    // 3. Submissions count
    const submissionsCount = submissions.filter(s => s.studentId === user?.name).length;

    return {
      studyHours: (totalMinutes / 60).toFixed(1),
      completedTasks: completedTasksCount + submissionsCount
    };
  }, [tasks, submissions, user]);

  useEffect(() => {
    if (user && roleSelection === 'student' && view === 'home') {
      let timer: any;
      if (!hasSeenHomeworkAlert) {
        timer = setTimeout(() => {
          setShowHomeworkAlert(true);
          setHasSeenHomeworkAlert(true);
          sessionStorage.setItem('hasSeenHomeworkAlert', 'true');
        }, 1000);
      }
      
      // Check for new feedback
      const gradedSubmissions = submissions.filter(s => s.studentId === user.name && s.status === 'graded');
      if (gradedSubmissions.length > 0) {
        const latest = gradedSubmissions[0];
        // Check if we've already shown this feedback
        const lastShownId = localStorage.getItem(`last_feedback_shown_${user.name}`);
        if (lastShownId !== latest.id) {
          setLatestFeedback(latest);
          setShowFeedbackPopup(true);
          localStorage.setItem(`last_feedback_shown_${user.name}`, latest.id);
        }
      }
      
      return () => clearTimeout(timer);
    }
  }, [user, roleSelection, view, submissions]);
  const [graphDimensions, setGraphDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1280, 
    height: typeof window !== 'undefined' ? window.innerHeight : 720 
  });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update graph dimensions on resize using ResizeObserver for robustness
  useEffect(() => {
    // Only set up observer if we are in graph view
    if (view !== 'graph') return;

    const container = graphContainerRef.current;
    if (!container) return;
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width || container.clientWidth;
      const h = rect.height || container.clientHeight;
      
      if (w > 0 && h > 0) {
        setGraphDimensions({ width: w, height: h });
      }
    };

    // Immediate measure
    updateSize();

    // Use ResizeObserver for continuous monitoring
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || !entries.length) return;
      
      // Get the last entry
      const entry = entries[entries.length - 1];
      let width, height;
      
      if (entry.contentRect) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
      } else {
        width = container.clientWidth;
        height = container.clientHeight;
      }
      
      if (width > 0 && height > 0) {
        setGraphDimensions({ width, height });
      }
    });
    
    resizeObserver.observe(container);
    
    // Additional safeguard: check after a short delay for late-rendering containers
    const timer = setTimeout(updateSize, 100);
    
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [view]);

  // Handle re-mounts and selected node changes that might affect layout
  useEffect(() => {
    if (view === 'graph' && graphContainerRef.current) {
      const container = graphContainerRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0 && (w !== graphDimensions.width || h !== graphDimensions.height)) {
        setGraphDimensions({ width: w, height: h });
      }
    }
  }, [selectedNode, view]);

  const [physicsParams, setPhysicsParams] = useState({
    gravity: -150,
    spring: 15,
    damping: 0.7,
    massScale: 2
  });
  const fgRef = useRef<ForceGraphMethods>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const prevNodeCount = useRef<number>(0);
  const [showTeacherDashboard, setShowTeacherDashboard] = useState(() => {
    const saved = localStorage.getItem('learning_app_data');
    if (saved) {
      const data = JSON.parse(saved);
      return data.showTeacherDashboard !== undefined ? data.showTeacherDashboard : true;
    }
    return true;
  });

  const [classes, setClasses] = useState<{id: string, name: string, password?: string, headTeacherId?: string}[]>([]);
  const [activeClassId, setActiveClassId] = useState('');

  const [unlockedClasses, setUnlockedClasses] = useState<string[]>([]);

  const [registeredUsers, setRegisteredUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      const userDataKey = `user_data_${user.name}`;
      const savedData = localStorage.getItem(userDataKey);
      const today = new Date().toISOString().split('T')[0];
      
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Daily Reset Logic
        if (data.lastLoginDate !== today) {
          // Reset daily progress but keep mastery and portfolio
          setMasteryState(data.masteryState || {});
          setQuizState(data.quizState || {});
          
          // Tasks Daily Logic: Move expired/completed tasks to recycle bin
          const currentTasks = data.tasks || [];
          const updatedTasks = currentTasks.map((task: any) => {
            const isExpired = task.deadline && new Date(task.deadline) < new Date();
            if ((task.completed || isExpired) && !task.deletedAt) {
              return { ...task, deletedAt: new Date().toISOString() };
            }
            return task;
          });
          setTasks(updatedTasks);
          
          setCredits(data.credits || 0);
          setCheckInHistory(data.checkInHistory || []);
          setPortfolio(data.portfolio || {});
          setStockPrices(data.stockPrices || {});
          setMarketIndex(data.marketIndex || [0, 0, 0, 0, 0]);
          setMarketEvents(data.marketEvents || []);
        } else {
          if (data.masteryState) setMasteryState(data.masteryState);
          if (data.quizState) setQuizState(data.quizState);
          if (data.tasks) setTasks(data.tasks);
          if (data.credits !== undefined) setCredits(data.credits);
          if (data.checkInHistory) setCheckInHistory(data.checkInHistory);
          if (data.portfolio) setPortfolio(data.portfolio);
          if (data.stockPrices) setStockPrices(data.stockPrices);
          if (data.marketIndex) setMarketIndex(data.marketIndex);
          if (data.marketEvents) setMarketEvents(data.marketEvents);
        }
      } else {
        // Initial values for new user
        setMasteryState({});
        setQuizState({});
        setTasks([{ id: 't1', title: '一元一次方程的应用实验', description: '', completed: false, priority: 'high', subject: 'math', deadline: new Date().toISOString(), createdAt: new Date().toISOString() }]);
        setCheckInHistory([]);
        setPortfolio({});
        setStockPrices({});
        setMarketIndex([0, 0, 0, 0, 0]);
        setMarketEvents([]);
      }
    } else {
      // Clear state when logged out
      setMasteryState({});
      setQuizState({});
      setTasks([]);
      setCredits(0);
      setCheckInHistory([]);
      setPortfolio({});
      setStockPrices({});
      setMarketIndex([0, 0, 0, 0, 0]);
      setMarketEvents([]);
    }
  }, [user]);

  // Save user data
  useEffect(() => {
    if (user) {
      const userDataKey = `user_data_${user.name}`;
      const today = new Date().toISOString().split('T')[0];
      const data = {
        masteryState,
        quizState,
        tasks,
        credits,
        checkInHistory,
        portfolio,
        stockPrices,
        marketIndex,
        marketEvents,
        lastLoginDate: today
      };
      localStorage.setItem(userDataKey, JSON.stringify(data));
    }
  }, [masteryState, quizState, tasks, credits, checkInHistory, portfolio, stockPrices, marketIndex, marketEvents, user]);

  useEffect(() => {
    const saved = localStorage.getItem('learning_app_settings');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.theme) setTheme(data.theme);
      if (data.accentColor) setAccentColor(data.accentColor);
      if (data.physicsParams) setPhysicsParams(data.physicsParams);
      if (data.showTeacherDashboard !== undefined) setShowTeacherDashboard(data.showTeacherDashboard);
    }
  }, []);

  useEffect(() => {
    const settings = {
      theme,
      accentColor,
      physicsParams,
      showTeacherDashboard,
      classes,
      activeClassId
    };
    localStorage.setItem('learning_app_settings', JSON.stringify(settings));
  }, [theme, accentColor, physicsParams, showTeacherDashboard, classes, activeClassId]);

  // Auth Listener
  useEffect(() => {
    // One-time clear for user testing as requested
    // localStorage.removeItem('registered_users'); 
    // Commented out to prevent accidental repeated clearing, 
    // but the button below is now available.
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_SUCCESS') {
        setUser(event.data.user);
        setView('home');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // AI Command Listener
  useEffect(() => {
    const handleAiCommand = (e: any) => {
      const { action, value } = e.detail || {};
      if (action === 'change_theme' && (value === 'dark' || value === 'light')) {
        setTheme(value);
      } else if (action === 'navigate') {
        if (['home', 'subjects', 'ai', 'grades', 'timer', 'pk', 'todo', 'settings', 'english', 'chinese'].includes(value)) {
          setView(value);
        }
      } else if (action === 'toggle_goal_panel') {
        setIsGoalPanelOpen(value === 'open');
      } else if (action === 'logout') {
        handleLogout();
      }
    };
    window.addEventListener('ai_command', handleAiCommand as EventListener);
    return () => window.removeEventListener('ai_command', handleAiCommand as EventListener);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (isRegistering) {
      if (!loginForm.username || !loginForm.password || !loginForm.phone || !roleSelection) {
        setAuthError('请填写所有必填项并选择身份');
        return;
      }
      
      const userExists = registeredUsers.find((u: any) => u.username === loginForm.username);
      if (userExists) {
        setAuthError('用户名已存在');
        return;
      }

      const newUser = {
        username: loginForm.username,
        password: loginForm.password,
        phone: loginForm.phone,
        role: roleSelection,
        classId: roleSelection === 'teacher' ? 'c1' : undefined,
        subject: roleSelection === 'teacher' ? loginForm.subject : undefined
      };

      setRegisteredUsers([...registeredUsers, newUser]);
      setIsRegistering(false);
      setAuthError('注册成功，请登录');
      // Clear password for security
      setLoginForm({ ...loginForm, password: '' });
      return;
    }

    // Login logic
    if (!loginForm.username || !loginForm.password) {
      setAuthError('请输入用户名 and 密码');
      return;
    }

    const userMatch = registeredUsers.find((u: any) => u.username === loginForm.username && u.password === loginForm.password);

    if (userMatch) {
      const profile: UserProfile = {
        name: userMatch.username,
        email: `${userMatch.username}@example.com`,
        phone: userMatch.phone,
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userMatch.username,
        role: userMatch.role,
        level: 1,
        exp: 0,
        classId: userMatch.classId,
        subject: userMatch.subject
      };
      setUser(profile);
      setRoleSelection(userMatch.role);
      setView('home');
    } else {
      const usernameExists = registeredUsers.find((u: any) => u.username === loginForm.username);
      if (usernameExists) {
        setAuthError('密码错误');
      } else {
        setAuthError('用户不存在，请先注册');
      }
    }
  };

  const handleLogout = () => {
    logout();
    setRoleSelection(null);
    setView('home');
    setLoginForm({ username: '', password: '', phone: '', subject: 'math' } as unknown as any);
    localStorage.clear();
    sessionStorage.clear();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter data based on grade and difficulty
  const filteredData = useMemo(() => {
    let nodes = mathData.nodes;
    
    if (gradeFilter !== 'all') {
      nodes = nodes.filter(n => n.grade === gradeFilter);
    }
    
    if (difficultyFilter !== 'all') {
      nodes = nodes.filter(n => n.difficulty === difficultyFilter);
    }

    if (masteryFilter !== 'all') {
      nodes = nodes.filter(n => (masteryState[n.id] || 'unlearned') === masteryFilter);
    }
    
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = mathData.links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    
    return { nodes, links };
  }, [gradeFilter, difficultyFilter, masteryFilter, masteryState]);

  const progress = useMemo(() => {
    const total = mathData.nodes.length;
    const mastered = Object.values(masteryState).filter(s => s === 'mastered').length;
    const familiar = Object.values(masteryState).filter(s => s === 'familiar').length;
    
    // Grade specific progress
    const gradeStats = [7, 8, 9].map(g => {
      const gradeNodes = mathData.nodes.filter(n => n.grade === g);
      const gradeMastered = gradeNodes.filter(n => masteryState[n.id] === 'mastered').length;
      const gradeFamiliar = gradeNodes.filter(n => masteryState[n.id] === 'familiar').length;
      return {
        grade: g,
        percent: Math.round(((gradeMastered + gradeFamiliar * 0.5) / gradeNodes.length) * 100),
        mastered: gradeMastered,
        total: gradeNodes.length
      };
    });

    return {
      percent: Math.round(((mastered + familiar * 0.5) / total) * 100),
      mastered,
      total,
      gradeStats
    };
  }, [masteryState]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleMastery = (nodeId: string, status: MasteryStatus) => {
    setMasteryState(prev => ({
      ...prev,
      [nodeId]: status
    }));
  };

  // Get prerequisite nodes for highlighting
  const highlightedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const set = new Set<string>();
    set.add(selectedNode.id);
    if (selectedNode.prerequisites) {
      selectedNode.prerequisites.forEach(id => set.add(id));
    }
    return set;
  }, [selectedNode]);

  // Handle rotation and forces with Newtonian physics
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      try {
        if (isRotating) {
          (fgRef.current.controls() as any).autoRotate = true;
          (fgRef.current.controls() as any).autoRotateSpeed = 0.5;
        } else {
          (fgRef.current.controls() as any).autoRotate = false;
        }

        // Hexagonal Layout Logic - More aggregated and stable
        const R_CORE = 250; 
        
        // Define 6 hexagonal anchor points
        const hexPoints = Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI) / 3;
          return { x: Math.cos(angle) * R_CORE, y: Math.sin(angle) * R_CORE, z: 0 };
        });

        // Helper to assign a node to a hexagonal vertex
        const getTargetPoint = (node: any) => {
          if (node.val < 3) return { x: 0, y: 0, z: 0 }; 
          
          const categoryMap: Record<string, number[]> = {
            '数与代数': [0, 1, 2],
            '图形与几何': [3, 4],
            '统计与概率': [5]
          };
          
          const indices = categoryMap[node.category] || [0];
          const gradeIdx = Math.min(node.grade - 7, indices.length - 1);
          const index = indices[gradeIdx];
          
          return hexPoints[index];
        };

        // Apply forces with balanced strength
        fgRef.current.d3Force('x', (d3 as any).forceX((node: any) => getTargetPoint(node).x).strength((node: any) => {
          return node.val === 3 ? 0.5 : 0.15;
        }));
        fgRef.current.d3Force('y', (d3 as any).forceY((node: any) => getTargetPoint(node).y).strength((node: any) => {
          return node.val === 3 ? 0.5 : 0.15;
        }));
        fgRef.current.d3Force('z', (forceZ as any)(0).strength(0.1));

        // Configure links - more stable distance calculation
        const linkForce = fgRef.current.d3Force('link');
        if (linkForce) {
          (linkForce as any).distance((link: any) => {
            const s = typeof link.source === 'object' ? link.source : { val: 1, id: '' };
            const t = typeof link.target === 'object' ? link.target : { val: 1, id: '' };
            
            // Base distance + scaled spring factor
            let baseDist = physicsParams.spring;
            
            if (s.val === 3 && t.val === 3) return baseDist * 3; 
            return baseDist * 1.5; 
          }).strength((link: any) => {
            const s = typeof link.source === 'object' ? link.source : { val: 1 };
            const t = typeof link.target === 'object' ? link.target : { val: 1 };
            // Key concepts have stronger elastic connections
            return (s.val === 3 || t.val === 3) ? 0.8 : 0.4;
          }); 
        }
        
        // Charge force - repulsion proportional to gravity setting but capped
        fgRef.current.d3Force('charge')?.strength((node: any) => {
          const baseGravity = physicsParams.gravity * 2;
          return node.val === 3 ? baseGravity * 5 : baseGravity;
        });

        // Center force - keeps the whole system from drifting
        fgRef.current.d3Force('center')?.strength(0.8);
        
        // Radial force - keeps it circular and aggregated
        fgRef.current.d3Force('radial', (d3 as any).forceRadial((node: any) => {
          return node.val === 3 ? R_CORE : 0;
        }).strength(0.4));

        // Collision force - prevents nodes from being "too close"
        fgRef.current.d3Force('collision', (d3 as any).forceCollide((node: any) => {
          // Use base val for collision to keep layout stable even if mastery changes
          const val = explorationMode === 'exam' ? (node.val === 3 ? 6 : 1) : (node.val * 2.5);
          const radius = Math.sqrt(val) * 10; 
          return radius + 15; 
        }).iterations(2));

        // Re-heat simulation only if node count changed or it's initial load
        const nodeCount = filteredData.nodes.length;
        if (fgRef.current && (prevNodeCount.current !== nodeCount)) {
          fgRef.current.d3ReheatSimulation();
          prevNodeCount.current = nodeCount;
        }

        // Small timeout for initial settle if needed
        const timeoutId = setTimeout(() => {
          if (fgRef.current && prevNodeCount.current === 0) {
            fgRef.current.d3ReheatSimulation();
            prevNodeCount.current = nodeCount;
          }
        }, 200);
        return () => clearTimeout(timeoutId);
      } catch (err) {
        console.error('Error applying graph forces:', err);
      }
    }
  }, [isRotating, filteredData, physicsParams]);

  // Close overlays when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as any;
      if (legendRef.current && !legendRef.current.contains(target)) {
        setIsLegendOpen(false);
      }
      if (physicsRef.current && !physicsRef.current.contains(target)) {
        setIsPhysicsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyImpulse = () => {
    if (fgRef.current) {
      const { nodes } = (fgRef.current as any).graphData();
      nodes.forEach((node: any) => {
        // Apply random acceleration vector
        node.vx = (Math.random() - 0.5) * 30;
        node.vy = (Math.random() - 0.5) * 30;
        node.vz = (Math.random() - 0.5) * 30;
      });
      try {
        fgRef.current.d3ReheatSimulation();
      } catch (e) {
        console.warn('D3 simulation not ready for impulse:', e);
      }
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node as Node);
    // Aim at node from outside it
    const distance = 100;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    fgRef.current?.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );
  };

  const getCategoryColor = (category: string) => {
    if (explorationMode === 'grade') return '#94a3b8'; // Default if in grade mode (will be overridden)
    switch (category) {
      case '数与代数': return '#3b82f6'; // blue
      case '图形与几何': return '#ef4444'; // red
      case '统计与概率': return '#10b981'; // green
      default: return '#94a3b8';
    }
  };

  const getNodeColor = (node: any) => {
    // Priority 1: Selected and Highlighted (Prerequisites)
    if (selectedNode && highlightedNodes.has(node.id)) {
      return node.id === selectedNode.id ? '#eab308' : '#fde047';
    }
    
    // Priority 2: Mastery Status
    const status = masteryState[node.id] || 'unlearned';
    if (status === 'mastered') return '#10b981'; // Emerald
    if (status === 'familiar') return '#f59e0b'; // Amber
    
    // Add a pulsing effect for unlearned nodes in exam mode
    if (explorationMode === 'exam' && status === 'unlearned' && node.val === 3) {
      return '#ef4444'; // Red for high-priority unlearned
    }
    
    // Priority 3: Exploration Mode / Category
    if (explorationMode === 'grade') {
      switch (node.grade) {
        case 7: return '#60a5fa'; // blue-400
        case 8: return '#fbbf24'; // amber-400
        case 9: return '#f87171'; // red-400
        default: return '#94a3b8';
      }
    }
    if (explorationMode === 'exam') {
      return node.val === 3 ? '#f59e0b' : (theme === 'dark' ? '#1e293b' : '#e2e8f0');
    }
    return getCategoryColor(node.category);
  };

  const getGradeTitle = (grade: GradeFilter) => {
    switch (grade) {
      case 7: return '七年级知识球';
      case 8: return '八年级知识球';
      case 9: return '九年级知识球';
      case 'all': return '中考全景球';
    }
  };

  const students = useMemo(() => {
    return registeredUsers
      .filter(u => u.role === 'student')
      .map(u => ({ id: u.username, name: u.username, classId: u.classId }));
  }, [registeredUsers]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.classId === activeClassId || !t.classId);
  }, [tasks, activeClassId]);

  const graphSearchResults = useMemo(() => {
    if (!graphSearchQuery.trim()) return [];
    const q = graphSearchQuery.toLowerCase();
    return filteredData.nodes.filter(n => n.name.toLowerCase().includes(q) || (n.category && n.category.toLowerCase().includes(q))).slice(0, 5);
  }, [graphSearchQuery, filteredData]);

  const hasUnsubmittedHomework = useMemo(() => {
    if (!user || user.role !== 'student') return false;
    return tasks.some(t => {
      const isForMyClass = t.classId === user.classId || !t.classId;
      if (!isForMyClass || t.deletedAt || t.completed) return false;
      const hasSubmission = submissions.some(s => s.homeworkId === t.id && s.studentId === user.name);
      return !hasSubmission;
    });
  }, [tasks, submissions, user]);

  return (
    <div 
      className={cn(
        "relative w-full h-screen overflow-hidden font-sans transition-colors duration-500",
        "app-theme-bg",
        `accent-${accentColor}`
      )}
    >
      {/* Decoration layer */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden opacity-[0.05]" style={{ userSelect: 'none' }}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent text-white/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <ChineseKnowledgeModal isOpen={showKnowledgeMap} onClose={() => setShowKnowledgeMap(false)} theme={theme} />

      <div className="relative z-[10] w-full h-full">

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center app-theme-bg"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full mb-6"
            />
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white font-mono text-sm tracking-[0.3em] uppercase"
            >
              Initializing Knowledge Graph...
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Selection Overlay */}
      {/* Login / Registration Screen */}
      {!user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 app-theme-bg overflow-y-auto"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent text-white rounded-full blur-[120px] animate-pulse opacity-[0.05] z-0" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px] animate-pulse delay-700 opacity-[0.05] z-0" />
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "relative max-w-md w-full p-8 md:p-12 rounded-[3rem] border shadow-premium backdrop-blur-xl",
              theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
            )}
          >
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-accent text-white rounded-3xl shadow-2xl shadow-accent/20 mb-6">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">
                {isRegistering ? '创建新账号' : '欢迎回来'}
              </h2>
              <p className="text-slate-500 text-sm">
                {isRegistering ? '加入智能学习中心，开启你的知识之旅' : '请输入您的凭据以访问您的学习空间'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl text-xs font-bold text-center",
                    authError.includes('成功') ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}
                >
                  {authError}
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">用户名</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    required
                    placeholder="请输入用户名"
                    value={loginForm.username || ''}
                    onChange={(e) => {
                      setLoginForm({...loginForm, username: e.target.value});
                      setAuthError(null);
                    }}
                    className={cn(
                      "w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="请输入密码"
                    value={loginForm.password || ''}
                    onChange={(e) => {
                      setLoginForm({...loginForm, password: e.target.value});
                      setAuthError(null);
                    }}
                    className={cn(
                      "w-full pl-12 pr-12 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">手机号</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="tel"
                      required
                      placeholder="请输入手机号"
                      value={loginForm.phone || ''}
                      onChange={(e) => {
                        setLoginForm({...loginForm, phone: e.target.value});
                        setAuthError(null);
                      }}
                      className={cn(
                        "w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20 transition-all",
                        theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">身份选择</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoleSelection('student')}
                    className={cn(
                      "py-3 rounded-2xl border font-bold text-xs transition-all",
                      roleSelection === 'student' 
                        ? "bg-accent text-white border-accent text-white shadow-lg shadow-accent/20" 
                        : theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                    )}
                  >
                    我是学者
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleSelection('teacher')}
                    className={cn(
                      "py-3 rounded-2xl border font-bold text-xs transition-all",
                      roleSelection === 'teacher' 
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20" 
                        : theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                    )}
                  >
                    我是导师
                  </button>
                </div>
              </div>

              {isRegistering && roleSelection === 'teacher' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">教授科目</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['math', 'chinese', 'english'] as const).map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setLoginForm({...loginForm, subject: sub})}
                        className={cn(
                          "py-2 rounded-xl border font-bold text-[10px] uppercase transition-all",
                          loginForm.subject === sub 
                            ? "bg-purple-500 border-purple-400 text-white shadow-md shadow-purple-500/20" 
                            : theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        {sub === 'math' ? '数学' : sub === 'chinese' ? '语文' : '英语'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-accent text-white hover:opacity-90 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-accent/25 mt-4"
              >
                {isRegistering ? '立即注册' : '登录系统'}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError(null);
                }}
                className="text-sm font-bold text-accent hover:text-accent transition-colors"
              >
                {isRegistering ? '已有账号？立即登录' : '没有账号？立即注册'}
              </button>

              <button 
                onClick={() => {
                  localStorage.removeItem('registered_users');
                  localStorage.removeItem('learning_app_data');
                  localStorage.removeItem('hasSeenMathTutorial');
                  setRegisteredUsers([]);
                  setTasks([{ id: 't1', title: '一元一次方程的应用实验', description: '', completed: false, priority: 'high', subject: 'math', deadline: new Date().toISOString(), createdAt: new Date().toISOString() }]);
                  setSubmissions([]);
                  setClasses([{id: 'c1', name: '初三一班'}]);
                  setActiveClassId('c1');
                  setUnlockedClasses([]);
                  setUser(null);
                  setRoleSelection(null);
                  setMasteryState({});
                  setQuizState({});
                  setPortfolio({});
                  setMarketIndex([0, 0, 0, 0, 0]);
                  setMarketEvents([]);
                  setStockPrices({});
                  setCredits(0);
                  setCheckInHistory([]);
                  setAuthError('所有系统数据已清空');
                }}
                className="text-[10px] font-bold text-slate-600 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                清空系统用户数据 (测试用)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {user && !roleSelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 app-theme-bg"
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent text-white rounded-full blur-[120px] animate-pulse opacity-[0.05] z-0" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px] animate-pulse delay-700 opacity-[0.05] z-0" />
            </div>

            <div className="relative max-w-4xl w-full text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <div className="inline-block p-4 bg-accent text-white rounded-3xl shadow-2xl shadow-accent/20 mb-6">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-white mb-4">欢迎来到智能学习中心</h1>
                <p className="text-slate-400 text-lg">请选择您的身份以开启个性化学习之旅</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRoleSelection('student')}
                  className="group relative p-10 rounded-[3rem] bg-slate-900 border border-slate-800 hover:border-accent/50 transition-all text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <User className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-accent/10 text-accent border border-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                      <User className="w-8 h-8 text-accent group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">我是学者 (Student)</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">探索 3D 知识图谱，参与知识市场交易，攻克数学难关，成就股神之路。</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRoleSelection('teacher')}
                  className="group relative p-10 rounded-[3rem] bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Settings className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
                      <Settings className="w-8 h-8 text-purple-500 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">我是导师 (Teacher)</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">管理班级进度，发布学习任务，引领学生攀登数学高峰。</p>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        {showMindMap && (
          <MindMap onClose={() => setShowMindMap(false)} theme={theme} />
        )}
        {isReviewOpen && (
          <ReviewWindow onClose={() => setIsReviewOpen(false)} theme={theme} />
        )}
      </AnimatePresence>
      {/* Header UI - Only in Home View */}
      {view === 'home' && (
        <div className="absolute top-0 left-0 w-full z-[60] p-6 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setView('home')}
            >
              <div className="p-2 bg-accent text-white rounded-lg shadow-lg shadow-accent/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className={cn(
                  "text-xl font-bold tracking-tight",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>智能学习中心</h1>
                <p className={cn(
                  "text-[10px] font-medium uppercase tracking-widest",
                  theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>AI-POWERED KNOWLEDGE GRAPH</p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView('settings')}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-2xl border backdrop-blur-md transition-all group",
                    theme === 'dark' ? "bg-slate-900/50 border-white/10 hover:bg-slate-800" : "bg-white/50 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className={cn("text-xs font-black tracking-tight leading-none", theme === 'dark' ? "text-white" : "text-slate-900")}>{user.name}</span>
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">Lv.{user.level || 0}</span>
                  </div>
                  <div className="relative">
                    <img 
                      src={user.photo} 
                      alt={user.name} 
                      className="w-9 h-9 rounded-xl border border-white/20 group-hover:scale-110 transition-transform object-cover shadow-lg" 
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-sm shadow-emerald-500/50" />
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className={cn(
                    "p-2 rounded-xl border backdrop-blur-md transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800 hover:text-red-400" : "bg-white/50 border-slate-200 hover:text-red-500"
                  )}
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsReviewOpen(true)}
                  className={cn(
                    "p-2 rounded-xl border backdrop-blur-md transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800 hover:text-emerald-400" : "bg-white/50 border-slate-200 hover:text-emerald-500"
                  )}
                  title="查看复盘"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsRegistering(false)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-accent/20"
              >
                <User className="w-4 h-4" />
                <span>登录</span>
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {roleSelection === 'student' && view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 z-20 flex flex-col bg-gradient-to-b from-transparent to-slate-950/20 overflow-y-auto custom-scrollbar pt-24 pb-20"
          >
            <div className="max-w-4xl w-full mx-auto p-8 space-y-12 text-center min-h-full flex flex-col justify-center">
              <div className="space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl font-black tracking-tighter sm:text-7xl"
                >
                  探索<span className="text-accent italic">知识</span>的维度
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-500 text-lg max-w-2xl mx-auto"
                >
                  通过 3D 知识图谱，以前所未有的方式理解学科关联，精准定位薄弱环节。
                </motion.p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Course Learning Card */}
                <motion.div
                  whileHover={{ y: -10 }}
                  onClick={() => setView('subjects')}
                  className={cn(
                    "group relative p-8 rounded-[2rem] border cursor-pointer overflow-hidden transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800 hover:border-[#0EA5E9]/50" : "bg-white border-slate-200 hover:border-[#0EA5E9]/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <BookOpen className="w-24 h-24" stroke="#0EA5E9" />
                  </div>
                  <div className="relative z-[10] space-y-6 pointer-events-auto">
                    <div className="w-16 h-16 bg-[#0EA5E9] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#0EA5E9]/20">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">课程学习</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Course Learning</p>
                    </div>
                  </div>
                </motion.div>

                {/* Grade Registration Card */}
                <motion.div
                  whileHover={{ y: -10 }}
                  onClick={() => setView('grades')}
                  className={cn(
                    "group relative p-8 rounded-[2rem] border cursor-pointer overflow-hidden transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800 hover:border-[#EC4899]/50" : "bg-white border-slate-200 hover:border-[#EC4899]/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <ClipboardList className="w-24 h-24" stroke="#EC4899" />
                  </div>
                  <div className="relative z-[10] space-y-6 pointer-events-auto">
                    <div className="w-16 h-16 bg-[#EC4899] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#EC4899]/20">
                      <ClipboardList className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">成绩登记</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Grade Registration</p>
                    </div>
                  </div>
                </motion.div>

                {/* Math PK Card */}
                <motion.div
                  whileHover={{ y: -10 }}
                  onClick={() => setView('pk')}
                  className={cn(
                    "group relative p-8 rounded-[2rem] border cursor-pointer overflow-hidden transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800 hover:border-[#F43F5E]/50" : "bg-white border-slate-200 hover:border-[#F43F5E]/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <Swords className="w-24 h-24" stroke="#F43F5E" />
                  </div>
                  <div className="relative z-[10] space-y-6 pointer-events-auto">
                    <div className="w-16 h-16 bg-[#F43F5E] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#F43F5E]/20">
                      <Swords className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">数学 PK</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Math Battle</p>
                    </div>
                  </div>
                </motion.div>

                {/* Daily Summary Card */}
                <motion.div
                  whileHover={{ y: -10 }}
                  onClick={() => setView('summary')}
                  className={cn(
                    "group relative p-8 rounded-[2rem] border cursor-pointer overflow-hidden transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800 hover:border-[#A855F7]/50" : "bg-white border-slate-200 hover:border-[#A855F7]/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <Calendar className="w-24 h-24" stroke="#A855F7" />
                  </div>
                  <div className="relative z-[10] space-y-6 pointer-events-auto">
                    <div className="w-16 h-16 bg-[#A855F7] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#A855F7]/20">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">学习总结</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Daily Summary</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Goal Management Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setView('todo')}
                  className={cn(
                    "group relative overflow-hidden rounded-[2rem] border p-8 cursor-pointer transition-all duration-500 flex flex-col items-center gap-6",
                    theme === 'dark' ? "bg-slate-900/40 border-slate-800 hover:border-[#3B82F6]/50" : "bg-white border-slate-200 hover:border-[#3B82F6]/50 shadow-xl shadow-slate-200/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <Target className="w-24 h-24" stroke="#3B82F6" />
                  </div>
                  <div className="relative z-[10] w-16 h-16 bg-[#3B82F6] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#3B82F6]/20 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-auto">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center relative z-[10] pointer-events-auto">
                    <h3 className="text-xl font-bold mb-2">目标管理</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">制定学习计划，管理每日任务。</p>
                  </div>
                </motion.div>

                {/* Homework Submission Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setIsSubmittingHomework(true)}
                  className={cn(
                    "group relative overflow-hidden rounded-[2rem] border p-8 cursor-pointer transition-all duration-500 flex flex-col items-center gap-6",
                    theme === 'dark' ? "bg-slate-900/40 border-slate-800 hover:border-[#8B5CF6]/50" : "bg-white border-slate-200 hover:border-[#8B5CF6]/50 shadow-xl shadow-slate-200/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <BookOpen className="w-24 h-24" stroke="#8B5CF6" />
                  </div>
                  {hasUnsubmittedHomework && (
                    <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)] z-[20]" />
                  )}
                  <div className="relative z-[10] w-16 h-16 bg-[#8B5CF6] rounded-2xl flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-auto">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center relative z-[10] pointer-events-auto">
                    <h3 className="text-xl font-bold mb-2">提交作业</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">拍照上传作业，获取导师批改。</p>
                  </div>
                </motion.div>

                {/* My Submissions Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  onClick={() => setIsShowingMySubmissions(true)}
                  className={cn(
                    "group relative overflow-hidden rounded-[2rem] border p-8 cursor-pointer transition-all duration-500 flex flex-col items-center gap-6",
                    theme === 'dark' ? "bg-slate-900/40 border-slate-800 hover:border-[#10B981]/50" : "bg-white border-slate-200 hover:border-[#10B981]/50 shadow-xl shadow-slate-200/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <ClipboardList className="w-24 h-24" stroke="#10B981" />
                  </div>
                  <div className="relative z-[10] w-16 h-16 bg-[#10B981] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#10B981]/20 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-auto">
                    <ClipboardList className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center relative z-[10] pointer-events-auto">
                    <h3 className="text-xl font-bold mb-2">我的提交</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">查看已提交的作业及导师评价。</p>
                  </div>
                </motion.div>



                {/* Game Center Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setView('games')}
                  className={cn(
                    "group relative overflow-hidden rounded-[2rem] border p-8 cursor-pointer transition-all duration-500 flex flex-col items-center gap-6",
                    theme === 'dark' ? "bg-slate-900/40 border-slate-800 hover:border-[#F59E0B]/50" : "bg-white border-slate-200 hover:border-[#F59E0B]/50 shadow-xl shadow-slate-200/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <Zap className="w-24 h-24" stroke="#F59E0B" />
                  </div>
                  <div className="relative z-[10] w-16 h-16 bg-[#F59E0B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#F59E0B]/20 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-auto">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center relative z-[10] pointer-events-auto">
                    <h3 className="text-xl font-bold mb-2">游戏中心</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">消耗金币开启趣味小游戏。</p>
                  </div>
                </motion.div>

                {/* Focus Timer Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  onClick={() => setView('timer')}
                  className={cn(
                    "group relative overflow-hidden rounded-[2rem] border p-8 cursor-pointer transition-all duration-500 flex flex-col items-center gap-6",
                    theme === 'dark' ? "bg-slate-900/40 border-slate-800 hover:border-[#6366F1]/50" : "bg-white border-slate-200 hover:border-[#6366F1]/50 shadow-xl shadow-slate-200/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <Clock className="w-24 h-24" stroke="#6366F1" />
                  </div>
                  <div className="relative z-[10] w-16 h-16 bg-[#6366F1] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-auto">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center relative z-[10] pointer-events-auto">
                    <h3 className="text-xl font-bold mb-2">专注计时</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">番茄工作法，深度学习利器。</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 max-w-6xl mx-auto w-full"
          >
            <div className="flex justify-between items-center mb-12">
              <div>
                <h1 className="text-4xl font-black tracking-tighter mb-2">游戏中心 (Game Center)</h1>
                <p className="text-slate-500">消耗金币，开启你的趣味学习之旅</p>
              </div>
              <button 
                onClick={() => setView('home')}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { id: 'g1', name: '数学消消乐', cost: 100, icon: Zap, color: 'bg-accent text-white', desc: '快速计算，消除数字方块。' },
                { id: 'g2', name: '几何大冒险', cost: 150, icon: Compass, color: 'bg-purple-600', desc: '利用几何知识解开谜题。' },
                { id: 'g3', name: '单词接龙', cost: 80, icon: Languages, color: 'bg-emerald-600', desc: '挑战你的词汇量极限。' },
              ].map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ y: -10 }}
                  className={cn(
                    "p-8 rounded-[2.5rem] border relative overflow-hidden group",
                    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl"
                  )}
                >
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg", game.color)}>
                    <game.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">{game.name}</h3>
                  <p className="text-slate-500 text-sm mb-8">{game.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-500 font-black">{game.cost} 金币 / 次</span>
                    <button 
                      onClick={() => {
                        if (credits >= game.cost) {
                          setCredits(credits - game.cost);
                          window.open('https://www.google.com/search?q=math+games', '_blank');
                        }
                      }}
                      className={cn(
                        "px-6 py-3 rounded-xl font-bold text-sm transition-all",
                        credits >= game.cost ? "bg-accent text-white text-white shadow-lg shadow-accent/20" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      立即开启
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'todo' && (
          <motion.div
            key="todo"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute inset-0 z-50 overflow-y-auto app-theme-bg"
          >
            <TodoManager 
              tasks={tasks}
              setTasks={setTasks}
              theme={theme}
              accentColor={accentColor}
              onBack={() => setView('home')}
            />
          </motion.div>
        )}

        {view === 'settings' && user && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-8 backdrop-blur-xl bg-slate-950/40 overflow-y-auto custom-scrollbar"
          >
            <UserSettings 
              user={user}
              theme={theme}
              setTheme={setTheme}
              activeSchemeId={activeSchemeId}
              setActiveSchemeId={setActiveSchemeId}
              language={language}
              setLanguage={setLanguage}
              stats={stats}
              onClose={() => setView('home')}
              onLogout={handleLogout}
              onResetAccount={resetAccount}
              onClearReviews={clearReviewsOnly}
              onUpdateUser={(newData) => {
                setUser(prev => {
                  if (!prev) return null;
                  const updated = { ...prev, ...newData };
                  setRegisteredUsers(reg => reg.map(u => u.username === prev.name ? { ...u, ...newData, username: newData.name || u.username } : u));
                  return updated;
                });
              }}
            />
          </motion.div>
        )}

        {roleSelection === 'teacher' && view === 'home' && showTeacherDashboard && (
          <motion.div
            key="teacher-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 z-40 app-theme-bg"
          >
              <TeacherDashboard 
                theme={theme}
                tasks={filteredTasks}
                onAddTask={(task) => setTasks([...tasks, { ...task, classId: activeClassId }])}
                onDeleteTask={(id) => setTasks(tasks.filter(t => t.id !== id))}
                masteryState={masteryState}
                submissions={submissions.filter(s => {
                  const student = students.find(st => st.id === s.studentId);
                  return student?.classId === activeClassId;
                })}
                onUpdateSubmissions={setSubmissions}
                onAddStudent={(username) => {
                  const newUser = { username, password: '123', role: 'student', classId: activeClassId };
                  setRegisteredUsers([...registeredUsers, newUser]);
                }}
                students={students}
                onToggleView={() => {
                  setShowTeacherDashboard(false);
                  handleGraphAccess();
                }}
                classes={classes}
                activeClassId={activeClassId}
                onSetActiveClass={setActiveClassId}
                onAddClass={(name, password, isHeadTeacher) => {
                  const newClass = { 
                    id: 'c' + Date.now(), 
                    name, 
                    password, 
                    headTeacherId: isHeadTeacher ? user?.name : undefined 
                  };
                  setClasses([...classes, newClass]);
                  setActiveClassId(newClass.id);
                  if (isHeadTeacher) {
                    setUnlockedClasses([...unlockedClasses, newClass.id]);
                  }
                }}
                unlockedClasses={unlockedClasses}
                onUnlockClass={(id) => setUnlockedClasses([...unlockedClasses, id])}
                currentTeacherId={user?.name}
                teacherSubject={user?.subject}
              />
          </motion.div>
        )}

        {roleSelection === 'teacher' && view === 'home' && !showTeacherDashboard && (
          <button 
            onClick={() => setShowTeacherDashboard(true)}
            className="fixed bottom-8 left-8 z-50 px-6 py-3 bg-accent text-white text-white rounded-2xl font-bold shadow-2xl shadow-accent/20 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Layout className="w-5 h-5" />
            <span>返回教师控制台</span>
          </button>
        )}

        {roleSelection === 'teacher' && view === 'graph' && (
          <button 
            onClick={() => {
              setView('home');
              setShowTeacherDashboard(true);
            }}
            className="fixed bottom-8 left-8 z-50 px-6 py-3 bg-accent text-white text-white rounded-2xl font-bold shadow-2xl shadow-accent/20 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Layout className="w-5 h-5" />
            <span>返回教师控制台</span>
          </button>
        )}

        {user && roleSelection === 'student' && !user.classId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
               "fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl",
               theme === 'dark' ? "bg-slate-900/95" : "bg-white/95"
            )}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={cn(
                "max-w-md w-full p-10 rounded-[3rem] border shadow-2xl",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="w-16 h-16 bg-accent text-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-2">选择您的班级</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">欢迎加入！请选择您所在的班级以同步学习任务和进度。加入后，您的导师将能看到您的表现。</p>
              
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {classes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      const updatedUser = { ...user, classId: c.id };
                      setUser(updatedUser);
                      setRegisteredUsers(prev => prev.map(u => u.username === user.name ? { ...u, classId: c.id } : u));
                    }}
                    className={cn(
                      "w-full p-5 rounded-2xl border text-left font-bold transition-all hover:scale-[1.02] flex items-center justify-between group",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 hover:border-accent" : "bg-slate-50 border-slate-200 hover:border-accent"
                    )}
                  >
                    <span>{c.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-accent transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {view === 'pk' && (
          <motion.div
            key="pk"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-50 overflow-y-auto custom-scrollbar app-theme-bg"
          >
            <MathPK 
              theme={theme}
              credits={credits}
              setCredits={setCredits}
              onBack={() => setView('home')}
            />
          </motion.div>
        )}

        {view === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute inset-0 z-50 overflow-y-auto custom-scrollbar app-theme-bg"
          >
            <LearningEngineApp theme={theme} />
          </motion.div>
        )}

        {view === 'timer' && (
          <motion.div
            key="focus-timer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-50 overflow-y-auto custom-scrollbar app-theme-bg"
          >
            <FocusTimer 
              theme={theme}
              onBack={() => setView('home')}
              tasks={tasks}
              onToggleTask={toggleTask}
            />
          </motion.div>
        )}

        {view === 'subjects' && (
          <motion.div
            key="subjects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "absolute inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto custom-scrollbar",
              theme === 'dark' ? "bg-slate-900/80" : "bg-white/80"
            )}
          >
            <div className="max-w-5xl w-full space-y-12 text-center">
              <div className="space-y-4">
                <h2 className={cn(
                  "text-4xl md:text-5xl font-black tracking-tight",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  选择<span className="text-accent">学习科目</span>
                </h2>
                <p className={cn(
                  "text-lg max-w-2xl mx-auto",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>
                  选择你想要学习的科目，进入专属的沉浸式学习空间。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Math */}
                <motion.div
                  whileHover={{ y: -10 }}
                  onClick={() => handleGraphAccess()}
                  className={cn(
                    "group relative p-8 rounded-[2rem] border cursor-pointer overflow-hidden transition-all",
                    theme === 'dark' ? "bg-slate-900/80 border-slate-700 hover:border-[#0EA5E9]/50" : "bg-white border-slate-200 hover:border-[#0EA5E9]/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <Calculator className="w-24 h-24" stroke="#0EA5E9" />
                  </div>
                  <div className="relative z-[10] space-y-6 pointer-events-auto">
                    <div className="w-16 h-16 bg-[#0EA5E9] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#0EA5E9]/20">
                      <Calculator className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className={cn("text-xl font-bold mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>数学</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Mathematics</p>
                    </div>
                  </div>
                </motion.div>

                {/* Chinese */}
                <motion.div
                  whileHover={{ y: -10 }}
                  onClick={() => setView('chinese')}
                  className={cn(
                    "group relative p-8 rounded-[2rem] border cursor-pointer overflow-hidden transition-all",
                    theme === 'dark' ? "bg-slate-900/80 border-slate-700 hover:border-[#F59E0B]/50" : "bg-white border-slate-200 hover:border-[#F59E0B]/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <BookText className="w-24 h-24" stroke="#F59E0B" />
                  </div>
                  <div className="relative z-[10] space-y-6 pointer-events-auto">
                    <div className="w-16 h-16 bg-[#F59E0B] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#F59E0B]/20">
                      <BookText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className={cn("text-xl font-bold mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>语文</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Chinese</p>
                    </div>
                  </div>
                </motion.div>

                {/* English */}
                <motion.div
                  whileHover={{ y: -10 }}
                  onClick={() => setView('english')}
                  className={cn(
                    "group relative p-8 rounded-[2rem] border cursor-pointer overflow-hidden transition-all",
                    theme === 'dark' ? "bg-slate-900/80 border-slate-700 hover:border-[#10B981]/50" : "bg-white border-slate-200 hover:border-[#10B981]/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 pointer-events-none select-none z-[1]" style={{ opacity: 0.05 }}>
                    <Languages className="w-24 h-24" stroke="#10B981" />
                  </div>
                  <div className="relative z-[10] space-y-6 pointer-events-auto">
                    <div className="w-16 h-16 bg-[#10B981] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#10B981]/20">
                      <Languages className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className={cn("text-xl font-bold mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>英语</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">English</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <button 
                onClick={() => setView('home')}
                className="mt-8 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-colors"
              >
                返回主页
              </button>
            </div>
          </motion.div>
        )}

        {view === 'chinese' && (
          <motion.div
            key="chinese"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 app-theme-bg"
          >
            <ThreeScene onBack={() => setView('subjects')} theme={theme} onShowKnowledgeMap={() => setShowKnowledgeMap(true)} />
          </motion.div>
        )}

        {view === 'english' && (
          <motion.div
            key="english"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto custom-scrollbar app-theme-bg"
          >
            <EnglishModule 
              onBack={() => setView('subjects')} 
              theme={theme} 
              setTheme={setTheme} 
              userName={user?.name}
            />
          </motion.div>
        )}



        {view === 'grades' && (
          <motion.div
            key="grades"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute inset-0 z-[80] flex items-center justify-center p-8 backdrop-blur-sm overflow-y-auto custom-scrollbar"
          >
            <GradeRegistration 
              theme={theme} 
              onClose={() => setView('home')} 
            />
          </motion.div>
        )}

        {view === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 h-full w-full overflow-hidden"
          >
            {/* 3D Graph Container (Full background) */}
            <div className="absolute inset-0 z-0">
              <div 
                ref={graphContainerRef}
                className="w-full h-full relative overflow-hidden"
              >
                {/* Top Navigation Bar */}
                <div className="absolute top-0 left-0 w-full z-40 p-4 md:p-6 flex justify-between pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto flex-wrap">
                    <button 
                      onClick={() => setView('home')}
                      className={cn(
                        "p-3 md:px-5 rounded-full border backdrop-blur-3xl transition-all flex items-center gap-2 shadow-2xl group",
                        theme === 'dark' ? "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white" : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold hidden md:inline">返回首页</span>
                    </button>

                    <button 
                      onClick={() => setShowMindMap(true)}
                      className={cn(
                        "p-3 md:px-5 rounded-full border backdrop-blur-3xl transition-all flex items-center gap-2 shadow-2xl group",
                        theme === 'dark' ? "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white" : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <Layers className="w-5 h-5 group-hover:rotate-12 transition-transform text-accent" />
                      <span className="text-sm font-bold hidden md:inline">知识思维导图</span>
                    </button>

                    {/* Progress Bar (Integrated into top bar) */}
                    <div className={cn(
                      "hidden sm:flex items-center gap-4 px-5 py-2.5 rounded-full border backdrop-blur-3xl shadow-2xl",
                      theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
                    )}>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">中考全景进度: {progress.percent}%</span>
                        <div className="w-24 md:w-32 h-1.5 bg-slate-800/50 rounded-full overflow-hidden mt-1">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percent}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graph Controls Overlay */}
                <div className="absolute top-6 right-6 z-40 flex items-center gap-3 pointer-events-none transition-all duration-500" ref={filterRef}>
                  <div className="relative pointer-events-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      placeholder="搜索核心考点..."
                      value={graphSearchQuery}
                      onChange={(e) => setGraphSearchQuery(e.target.value)}
                      className={cn(
                        "w-48 border rounded-full py-2 pl-9 pr-3 text-sm outline-none transition-all shadow-2xl backdrop-blur-3xl focus:w-64",
                        theme === 'dark' 
                          ? "bg-slate-900/80 border-slate-800 focus:border-accent/50 text-white placeholder:text-slate-600" 
                          : "bg-white/80 border-slate-200 focus:border-accent text-slate-900 placeholder:text-slate-400"
                      )}
                    />
                    <AnimatePresence>
                      {graphSearchResults.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={cn("absolute top-full right-0 mt-3 border rounded-2xl shadow-2xl overflow-hidden z-[70] backdrop-blur-3xl w-64", theme === 'dark' ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200")}
                        >
                          {graphSearchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => {
                                setGraphSearchQuery('');
                                handleNodeClick(result);
                              }}
                              className={cn("w-full px-4 py-3 flex items-start gap-3 transition-colors border-b last:border-0 text-left", theme === 'dark' ? "hover:bg-accent/20 border-white/5" : "hover:bg-blue-50 border-slate-100")}
                            >
                              <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent border border-accent/20 flex items-center justify-center mt-0.5">
                                <Search className="w-4 h-4 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={cn("text-sm font-bold mb-0.5 truncate", theme === 'dark' ? "text-white" : "text-slate-800")}>{result.name}</div>
                                <div className="text-[10px] text-slate-500 line-clamp-1 uppercase tracking-tight italic">
                                  {result.category || '核心考点'}
                                </div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={cn(
                      "p-2.5 rounded-full border transition-all duration-300 backdrop-blur-3xl shadow-2xl pointer-events-auto",
                      theme === 'dark' 
                        ? "bg-slate-900/80 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800" 
                        : "bg-white/80 border-slate-200 text-amber-600 hover:text-amber-700 hover:bg-slate-100"
                    )}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setShowLabels(!showLabels)}
                    className={cn(
                      "p-2.5 rounded-full border transition-all duration-300 backdrop-blur-3xl shadow-2xl pointer-events-auto",
                      showLabels 
                        ? "bg-accent text-white border-accent text-white" 
                        : theme === 'dark' 
                          ? "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white" 
                          : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <Type className="w-5 h-5" />
                  </button>

                  <div 
                    ref={modeSwitcherRef}
                    className={cn(
                      "flex items-center gap-1 p-1 rounded-full border backdrop-blur-3xl shadow-2xl pointer-events-auto",
                      theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
                    )}
                  >
                    {(['topic', 'grade', 'exam'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setExplorationMode(mode)}
                        className={cn(
                          "p-2 rounded-full transition-all duration-200 flex items-center gap-2",
                          explorationMode === mode
                            ? "bg-accent text-white text-white shadow-lg"
                            : theme === 'dark' ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {mode === 'topic' && <Layout className="w-4 h-4" />}
                        {mode === 'grade' && <Compass className="w-4 h-4" />}
                        {mode === 'exam' && <Target className="w-4 h-4" />}
                        <span className="text-[10px] font-bold uppercase hidden xl:block px-1">
                          {mode === 'topic' ? '领域' : mode === 'grade' ? '年级' : '考点'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <button
                      ref={filterButtonRef}
                      onClick={() => {
                        setIsFilterOpen(!isFilterOpen);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 backdrop-blur-md shadow-2xl pointer-events-auto",
                        isFilterOpen 
                          ? "bg-accent text-white border-accent text-white" 
                          : theme === 'dark'
                            ? "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                            : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-semibold">筛选</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isFilterOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isFilterOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className={cn(
                            "absolute top-full right-0 mt-2 flex flex-col gap-3 p-3 backdrop-blur-xl border rounded-2xl shadow-2xl z-50 w-64 pointer-events-auto",
                            theme === 'dark' ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
                          )}
                        >
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">年级筛选</span>
                            <div className="flex gap-1">
                              {[7, 8, 9, 'all'].map((g) => (
                                <button
                                  key={g}
                                  onClick={() => setGradeFilter(g as GradeFilter)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                    gradeFilter === g 
                                      ? "bg-accent text-white text-white shadow-lg shadow-blue-900/40" 
                                      : theme === 'dark'
                                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                  )}
                                >
                                  {g === 'all' ? '全部' : `${g}年`}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className={cn(
                            "h-px mx-1",
                            theme === 'dark' ? "bg-slate-800" : "bg-slate-100"
                          )} />

                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">掌握程度</span>
                            <div className="flex gap-1">
                              {(['all', 'unlearned', 'familiar', 'mastered'] as const).map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setMasteryFilter(m)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                    masteryFilter === m 
                                      ? m === 'mastered' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" :
                                        m === 'familiar' ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40" :
                                        m === 'unlearned' ? "bg-slate-600 text-white shadow-lg shadow-slate-900/40" :
                                        "bg-accent text-white text-white shadow-lg shadow-blue-900/40"
                                      : theme === 'dark'
                                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                  )}
                                >
                                  {m === 'all' ? '全部' : m === 'unlearned' ? '未学' : m === 'familiar' ? '模糊' : '掌握'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className={cn(
                            "h-px mx-1",
                            theme === 'dark' ? "bg-slate-800" : "bg-slate-100"
                          )} />

                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">难度筛选</span>
                            <div className="flex gap-1">
                              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                                <button
                                  key={d}
                                  onClick={() => setDifficultyFilter(d)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                    difficultyFilter === d 
                                      ? d === 'easy' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" :
                                        d === 'medium' ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40" :
                                        d === 'hard' ? "bg-red-600 text-white shadow-lg shadow-red-900/40" :
                                        "bg-accent text-white text-white shadow-lg shadow-blue-900/40"
                                      : theme === 'dark'
                                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                  )}
                                >
                                  {d === 'all' ? '全部' : d === 'easy' ? '基础' : d === 'medium' ? '进阶' : '挑战'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className={cn(
                            "h-px mx-1",
                            theme === 'dark' ? "bg-slate-800" : "bg-slate-100"
                          )} />

                          <button
                            onClick={() => {
                              setMasteryState({});
                              setQuizState({});
                            }}
                            className={cn(
                              "w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                              theme === 'dark' ? "bg-slate-800 text-slate-400 hover:bg-red-900/20 hover:text-red-400" : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            )}
                          >
                            重置所有进度
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <Math3DGraph
          ref={fgRef}
          theme={theme}
          searchQuery={graphSearchQuery}
          width={graphDimensions.width}
          height={graphDimensions.height}
          graphData={filteredData}
          nodeLabel={(node: any) => `
            <div class="${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border p-2 rounded shadow-xl">
              <div class="font-bold text-accent">${node.name}</div>
              <div class="text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}">${node.category} | ${node.grade}年级</div>
              <div class="text-[10px] mt-1 ${
                node.difficulty === 'easy' ? 'text-emerald-500' :
                node.difficulty === 'medium' ? 'text-amber-500' : 'text-red-500'
              }">${node.difficulty === 'easy' ? '基础' : node.difficulty === 'medium' ? '进阶' : '挑战'}</div>
            </div>
          `}
          nodeColor={getNodeColor}
          nodeRelSize={7}
          nodeVal={(node: any) => {
            const status = masteryState[node.id] || 'unlearned';
            let baseVal = explorationMode === 'exam' ? (node.val === 3 ? 6 : 1) : (node.val * 2.5);
            if (status === 'mastered') return baseVal * 1.3;
            return baseVal;
          }}
          nodeThreeObject={(node: any) => {
            const status = masteryState[node.id] || 'unlearned';
            const group = new THREE.Group();
            
            if (showLabels) {
              const sprite = new SpriteText(node.name) as any;
              sprite.color = theme === 'dark' ? '#ffffff' : '#0f172a';
              sprite.textHeight = 6;
              sprite.fontWeight = 'bold';
              sprite.backgroundColor = theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)';
              sprite.padding = [3, 2];
              sprite.borderRadius = 4;
              sprite.renderOrder = 10;
              
              const val = explorationMode === 'exam' ? (node.val === 3 ? 6 : 1) : (node.val * 2.5);
              const radius = Math.sqrt(val) * 7;
              sprite.position.y = -(radius + 10); 
              group.add(sprite);
            }
            
            if (status === 'mastered') {
              const glowMesh = new THREE.Mesh(
                new THREE.SphereGeometry(12, 16, 16),
                new THREE.MeshBasicMaterial({ 
                  color: 0x10b981, 
                  transparent: true, 
                  opacity: 0.15,
                  blending: THREE.AdditiveBlending 
                })
              );
              group.add(glowMesh);
            }

            const searchHighlight = new THREE.Mesh(
              new THREE.SphereGeometry(14, 16, 16),
              new THREE.MeshBasicMaterial({ 
                color: 0xeab308, // amber-500
                transparent: true, 
                opacity: 0.4,
                blending: THREE.AdditiveBlending 
              })
            );
            searchHighlight.name = 'searchHighlight';
            searchHighlight.visible = false;
            group.add(searchHighlight);

            // Add a subtle ring for high-priority nodes in exam mode
            if (explorationMode === 'exam' && node.val === 3) {
              const ring = new THREE.Mesh(
                new THREE.RingGeometry(14, 15, 32),
                new THREE.MeshBasicMaterial({ 
                  color: 0xf59e0b, 
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.4
                })
              );
              ring.rotation.x = Math.PI / 2;
              group.add(ring);
            }

            // Hover highlight ring
            if (hoveredNode && node.id === hoveredNode.id) {
              const hoverRing = new THREE.Mesh(
                new THREE.RingGeometry(16, 18, 32),
                new THREE.MeshBasicMaterial({ 
                  color: 0xeab308, 
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.8,
                  blending: THREE.AdditiveBlending
                })
              );
              hoverRing.rotation.x = Math.PI / 2;
              
              // Add a pulsing animation effect to the hover ring
              const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
              hoverRing.scale.set(pulseScale, pulseScale, pulseScale);
              
              group.add(hoverRing);
            }
            
            return group;
          }}
          nodeThreeObjectExtend={true}
          linkColor={(link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (selectedNode && highlightedNodes.has(sourceId) && highlightedNodes.has(targetId)) {
              return '#eab308';
            }

            if (explorationMode === 'exam') {
              const source = typeof link.source === 'object' ? link.source : filteredData.nodes.find(n => n.id === link.source);
              const target = typeof link.target === 'object' ? link.target : filteredData.nodes.find(n => n.id === link.target);
              if (source?.val === 3 && target?.val === 3) return '#f59e0b';
              return theme === 'dark' ? '#1e293b' : '#f1f5f9';
            }
            if (theme === 'light') {
              switch (link.type) {
                case 'core': return '#d97706'; // amber-600
                case 'derivative': return '#7c3aed'; // violet-600
                default: return '#94a3b8'; // slate-400
              }
            }
            switch (link.type) {
              case 'core': return '#fbbf24'; // Brighter amber (amber-400)
              case 'derivative': return '#a78bfa'; // Brighter violet (violet-400)
              default: return '#64748b'; // Brighter slate (slate-500)
            }
          }}
          linkWidth={(link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            let width = link.type === 'core' ? 4 : 2;
            
            if (selectedNode && highlightedNodes.has(sourceId) && highlightedNodes.has(targetId)) {
              width = 6;
            }
            
            return width;
          }}
          linkDirectionalParticles={(link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            let particles = 3;
            if (selectedNode && highlightedNodes.has(sourceId) && highlightedNodes.has(targetId)) {
              particles = 6;
            }
            
            return particles;
          }}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={(link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            let speed = 0.006;
            return speed;
          }}
          onNodeClick={handleNodeClick}
          onNodeHover={(node: any) => {
            setHoveredNode(node as Node | null);
          }}
          backgroundColor={theme === 'dark' ? "#020617" : "#f8fafc"}
          showNavInfo={false}
          cooldownTicks={100}
          d3VelocityDecay={physicsParams.damping}
          onEngineStop={() => {
            if (fgRef.current && isRotating) {
              (fgRef.current.controls() as any).autoRotate = true;
            }
          }}
        />

        {/* Controls Overlay (Inside resizing container) */}
        <div className="absolute bottom-10 left-10 z-40 flex flex-col gap-3 pointer-events-none transition-all duration-500">
          <div className={cn(
            "backdrop-blur-3xl p-2 rounded-2xl border shadow-2xl flex flex-col items-center gap-1 pointer-events-auto",
            theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
          )}>
            <button 
              onClick={() => setIsRotating(!isRotating)}
              className={cn(
                "p-2.5 rounded-full transition-all duration-200",
                isRotating ? "bg-accent text-white text-white" : theme === 'dark' ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
              )}
              title={isRotating ? "停止旋转" : "开始旋转"}
            >
              <RotateCw className={cn("w-5 h-5", isRotating && "animate-spin-slow")} />
            </button>
            <button 
              onClick={() => fgRef.current?.zoomToFit(400)}
              className={cn(
                "p-2.5 rounded-full transition-all",
                theme === 'dark' ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
              )}
              title="自适应视角"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay 
            step={tutorialStep}
            onNext={handleNextStep}
            onSkip={handleSkipTutorial}
            theme={theme}
            targetRef={
              tutorialStep === 0 ? modeSwitcherRef :
              tutorialStep === 1 ? filterButtonRef :
              tutorialStep === 2 ? graphContainerRef :
              tutorialStep === 3 ? goalCenterRef :
              null
            }
          />
        )}
      </AnimatePresence>

      {/* Info Panel Floating Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            ref={sidebarRef}
            className={cn(
              "absolute top-24 right-6 bottom-6 z-50 w-[400px] md:w-[480px] max-w-[calc(100vw-3rem)] flex flex-col overflow-hidden rounded-[2.5rem] border backdrop-blur-xl shadow-2xl transition-all duration-500",
              theme === 'dark' 
                ? "bg-slate-900/90 border-slate-800" 
                : "bg-white/90 border-slate-200"
            )}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedNode(null)}
              className={cn(
                "absolute top-6 right-6 z-[60] p-2 rounded-full border transition-all",
                theme === 'dark' ? "bg-slate-800 border-white/10 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
              )}
            >
              <X className="w-5 h-5" />
            </button>
        {/* Sidebar Background Accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={cn(
            "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-[0.05] z-0",
            theme === 'dark' ? "bg-accent text-white" : "bg-accent text-white"
          )} />
          <div className={cn(
            "absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-[0.05] z-0",
            theme === 'dark' ? "bg-purple-600" : "bg-purple-400"
          )} />
        </div>


          <div className="relative flex-1 flex flex-col h-full overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/5 flex flex-col justify-center">
              <h2 className={cn(
                "text-2xl font-black tracking-tight",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>{selectedNode.name}</h2>
              <div className="flex gap-2 mt-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm",
                  selectedNode.category === '数与代数' ? "bg-accent/20 text-accent border border-accent/20" :
                  selectedNode.category === '图形与几何' ? "bg-red-500/20 text-red-500 border border-red-500/20" :
                  "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                )}>
                  {selectedNode.category === '数与代数' && <Calculator className="w-3 h-3" />}
                  {selectedNode.category === '图形与几何' && <Shapes className="w-3 h-3" />}
                  {selectedNode.category === '统计与概率' && <PieChart className="w-3 h-3" />}
                  {selectedNode.category}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  selectedNode.difficulty === 'easy' ? "bg-emerald-500/20 text-emerald-500" :
                  selectedNode.difficulty === 'medium' ? "bg-amber-500/20 text-amber-500" :
                  "bg-red-500/20 text-red-500"
                )}>
                  {selectedNode.difficulty === 'easy' ? '基础' : selectedNode.difficulty === 'medium' ? '进阶' : '挑战'}
                </span>
              </div>
            </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                  <p className={cn(
                    "text-sm leading-relaxed",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                  )}>
                    这是{selectedNode.grade}年级数学的核心知识点。通过掌握该知识点，你将能够更好地理解后续相关内容。
                  </p>

                  <div className="space-y-8">
                    {/* Mastery Status Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-accent">
                        <Target className="w-5 h-5" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">掌握状态</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {(['unlearned', 'familiar', 'mastered'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => toggleMastery(selectedNode.id, status)}
                            className={cn(
                              "py-3 rounded-2xl text-xs font-bold transition-all border-2",
                              (masteryState[selectedNode.id] || 'unlearned') === status
                                ? status === 'mastered' ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20" :
                                  status === 'familiar' ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20" :
                                  "bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-900/20"
                                : theme === 'dark' ? "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            {status === 'unlearned' ? '未学' : status === 'familiar' ? '模糊' : '掌握'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prerequisites */}
                    {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-violet-500">
                          <Compass className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">前置知识</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedNode.prerequisites.map(id => {
                            const preNode = mathData.nodes.find(n => n.id === id);
                            return (
                              <button
                                key={id}
                                onClick={() => {
                                  const node = mathData.nodes.find(n => n.id === id);
                                  if (node) setSelectedNode(node as Node);
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-xs border transition-all",
                                  theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-accent hover:text-accent" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-accent hover:text-accent"
                                )}
                              >
                                {preNode?.name || id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* AI Advisor Sync - New Feature */}
                    <div className="space-y-4 pt-4">
                      <button
                        onClick={() => setView('ai')}
                        className={cn(
                          "flex items-center gap-3 w-full p-5 rounded-[2rem] border transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden",
                          theme === 'dark' 
                            ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-accent/30 text-white" 
                            : "bg-gradient-to-r from-blue-500 to-indigo-600 border-accent text-white shadow-lg shadow-accent/20"
                        )}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform relative z-10">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left relative z-10">
                          <div className="text-xs font-black uppercase tracking-widest leading-none mb-1">同步 AI 专家解析</div>
                          <div className="text-[10px] opacity-80 font-medium">唤起智能导师，针对本知识点开启 1:1 指导</div>
                        </div>
                        <Sparkles className="w-4 h-4 ml-auto animate-pulse relative z-10" />
                      </button>
                    </div>

                    {/* Detailed Explanation */}
                    {selectedNode.explanation && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-accent">
                          <BookOpen className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">知识点详解</h3>
                        </div>
                        <div className={cn(
                          "text-base leading-relaxed p-6 rounded-[2rem] border shadow-inner transition-colors",
                          theme === 'dark' 
                            ? "text-slate-100 bg-slate-800/50 border-slate-700/50" 
                            : "text-slate-800 bg-blue-50/50 border-blue-100"
                        )}>
                          {selectedNode.explanation}
                        </div>
                      </div>
                    )}

                    {/* Traps */}
                    {selectedNode.traps && selectedNode.traps.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-500">
                          <AlertCircle className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">易错陷阱</h3>
                        </div>
                        <div className={cn(
                          "p-6 rounded-[2rem] border",
                          theme === 'dark' ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-100"
                        )}>
                          <ul className="space-y-3">
                            {selectedNode.traps.map((trap, i) => (
                              <li key={i} className={cn(
                                "text-sm flex gap-3",
                                theme === 'dark' ? "text-slate-300" : "text-slate-600"
                              )}>
                                <span className="text-amber-500 font-bold">•</span>
                                {trap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Example */}
                    {selectedNode.example && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-accent">
                          <HelpCircle className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">典型例题</h3>
                        </div>
                        <div className={cn(
                          "p-6 rounded-[2rem] border text-base italic leading-relaxed shadow-lg",
                          theme === 'dark'
                            ? "bg-slate-900 border-slate-800 text-slate-200"
                            : "bg-white border-slate-100 text-slate-700"
                        )}>
                          <div className="text-accent font-bold mb-2">Q:</div>
                          {selectedNode.example}
                        </div>
                      </div>
                    )}

                    {/* Analysis */}
                    {selectedNode.analysis && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500">
                          <CheckCircle2 className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">详细解析</h3>
                        </div>
                        <div className={cn(
                          "text-base leading-relaxed p-6 rounded-[2rem] border",
                          theme === 'dark' ? "bg-emerald-50/5 border-emerald-500/10 text-slate-300" : "bg-emerald-50 border-emerald-100 text-slate-600"
                        )}>
                          {selectedNode.analysis}
                        </div>
                      </div>
                    )}

                    {/* Quiz Section */}
                    {selectedNode.quiz && selectedNode.quiz.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Zap className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">知识点速测</h3>
                        </div>
                        <div className={cn(
                          "p-6 rounded-[2rem] border space-y-6 shadow-xl",
                          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                        )}>
                          <p className="text-sm font-bold leading-tight">{selectedNode.quiz[0].question}</p>
                          <div className="grid grid-cols-1 gap-3">
                            {selectedNode.quiz[0].options.map((opt, idx) => {
                              const state = quizState[selectedNode.id];
                              const isCorrect = idx === selectedNode.quiz![0].answer;
                              
                              return (
                                <button
                                  key={idx}
                                  disabled={state?.answered}
                                  onClick={() => {
                                    const correct = idx === selectedNode.quiz![0].answer;
                                    setQuizState(prev => ({ ...prev, [selectedNode.id]: { answered: true, correct } }));
                                    if (correct) toggleMastery(selectedNode.id, 'mastered');
                                  }}
                                  className={cn(
                                    "text-left px-4 py-3 rounded-2xl text-xs transition-all border-2",
                                    state?.answered
                                      ? isCorrect ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-slate-800/50 border-slate-700 text-slate-600"
                                      : theme === 'dark' ? "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-accent" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-accent"
                                  )}
                                >
                                  <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {quizState[selectedNode.id]?.answered && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "text-sm font-bold p-4 rounded-xl text-center",
                                quizState[selectedNode.id].correct ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                              )}
                            >
                              {quizState[selectedNode.id].correct ? "回答正确！知识点掌握度提升。" : "回答错误，再复习一下吧。"}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className={cn(
                        "flex items-center gap-4 p-4 rounded-[2rem] border transition-colors",
                        theme === 'dark' ? "bg-slate-900 border-slate-800 hover:border-accent/40" : "bg-slate-50 border-slate-100 hover:border-accent/40"
                      )}>
                        <div className={cn(
                          "p-3 rounded-2xl flex items-center justify-center shadow-sm",
                          selectedNode.val === 3 ? "bg-accent text-white" :
                          selectedNode.val === 2 ? "bg-accent/20 text-accent" :
                          "bg-accent/10 text-accent/60"
                        )}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">关联权重</div>
                          <div className={cn(
                            "text-base font-black flex items-center gap-2",
                            theme === 'dark' ? "text-slate-200" : "text-slate-700"
                          )}>
                            {selectedNode.val === 3 ? '核心' : selectedNode.val === 2 ? '重要' : '基础'}
                            {selectedNode.val === 3 && <Sparkles className="w-3 h-3 text-amber-500" />}
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "flex items-center gap-4 p-4 rounded-[2rem] border",
                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className={cn(
                          "p-3 rounded-2xl",
                          selectedNode.difficulty === 'easy' ? "bg-emerald-500/20" :
                          selectedNode.difficulty === 'medium' ? "bg-amber-500/20" :
                          "bg-red-500/20"
                        )}>
                          <BarChart3 className={cn(
                            "w-5 h-5",
                            selectedNode.difficulty === 'easy' ? "text-emerald-500" :
                            selectedNode.difficulty === 'medium' ? "text-amber-500" :
                            "text-red-500"
                          )} />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">难度等级</div>
                          <div className={cn(
                            "text-base font-black",
                            selectedNode.difficulty === 'easy' ? "text-emerald-500" :
                            selectedNode.difficulty === 'medium' ? "text-amber-500" :
                            "text-red-500"
                          )}>
                            {selectedNode.difficulty === 'easy' ? '基础' : selectedNode.difficulty === 'medium' ? '进阶' : '挑战'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Homework Button in Sidebar */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2 text-purple-500">
                        <BookOpen className="w-5 h-5" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">作业提交</h3>
                      </div>
                      <button
                        onClick={() => setIsSubmittingHomework(true)}
                        className={cn(
                          "w-full py-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group",
                          theme === 'dark' ? "border-slate-800 text-slate-500 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-500/5" : "border-slate-200 text-slate-400 hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50"
                        )}
                      >
                        <div className="p-3 bg-slate-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold tracking-widest uppercase">上传该知识点作业</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Goal Center moved to global section */}


      {/* Physics Controls removed */}

      <div className="absolute bottom-12 right-24 md:bottom-8 md:right-32 z-50 flex flex-col items-end gap-3" ref={legendRef}>
        <AnimatePresence>
          {isLegendOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "backdrop-blur-md p-4 rounded-2xl border shadow-2xl w-48",
                theme === 'dark' ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
              )}
            >
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                {explorationMode === 'topic' ? '领域图例' : explorationMode === 'grade' ? '年级图例' : '考点图例'}
              </h3>
              <div className="flex flex-col gap-2">
                {explorationMode === 'topic' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent text-white" />
                      <span className={cn("text-xs", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>数与代数</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className={cn("text-xs", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>图形与几何</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className={cn("text-xs", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>统计与概率</span>
                    </div>
                  </>
                )}
                {explorationMode === 'grade' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent text-white" />
                      <span className={cn("text-xs", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>七年级</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className={cn("text-xs", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>八年级</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className={cn("text-xs", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>九年级</span>
                    </div>
                  </>
                )}
                {explorationMode === 'exam' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                      <span className={cn("text-xs font-bold", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>核心考点</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", theme === 'dark' ? "bg-slate-800" : "bg-slate-200")} />
                      <span className={cn("text-xs", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>次要关联</span>
                    </div>
                  </>
                )}
                <div className={cn(
                  "mt-2 pt-2 border-t flex flex-col gap-2",
                  theme === 'dark' ? "border-slate-800" : "border-slate-100"
                )}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-[2px] bg-amber-500" />
                    <span className="text-[10px] text-slate-500">核心关联</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-violet-500" />
                    <span className="text-[10px] text-slate-500">衍生关联</span>
                  </div>
                </div>

                <div className={cn(
                  "mt-2 pt-2 border-t flex flex-col gap-2",
                  theme === 'dark' ? "border-slate-800" : "border-slate-100"
                )}>
                  <h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">掌握状态</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-500">已掌握</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-slate-500">模糊</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className={cn(
            "p-3 rounded-2xl backdrop-blur-md border shadow-2xl transition-all duration-300",
            isLegendOpen 
              ? "bg-accent text-white text-white border-accent" 
              : theme === 'dark' 
                ? "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800" 
                : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
          title="图例说明"
        >
          <Info className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Navigation Bar */}
      {/* Removed from here and moved to global student navigation section */}


      {/* Grade & Mode Indicator */}
      <div className="absolute top-24 left-8 z-10 flex flex-col gap-2">
        <motion.div 
          key={gradeFilter}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "flex items-center gap-2 font-bold text-sm",
            theme === 'dark' ? "text-accent" : "text-accent"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>{getGradeTitle(gradeFilter)}</span>
        </motion.div>

        <motion.div 
          key={explorationMode}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border",
            theme === 'dark' ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-white/50 border-slate-200 text-slate-500"
          )}
        >
          {explorationMode === 'topic' && <Layout className="w-3 h-3" />}
          {explorationMode === 'grade' && <Compass className="w-3 h-3" />}
          {explorationMode === 'exam' && <Target className="w-3 h-3" />}
          <span>
            {explorationMode === 'topic' ? '主题领域模式' : explorationMode === 'grade' ? '年级阶段模式' : '中考冲刺模式'}
          </span>
        </motion.div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Global Student Navigation & UI */}
      {roleSelection === 'student' && !['english', 'chinese', 'ai'].includes(view) && (
        <>
          {/* Quick Navigation Bar (Moved to bottom to avoid overlap) */}
          <div className="fixed bottom-6 w-full px-6 pointer-events-none flex justify-center z-[60]">
            <div className={cn(
              "flex items-center gap-1 p-1.5 rounded-full backdrop-blur-3xl border shadow-2xl pointer-events-auto",
              theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
            )}>
              {[
                { id: 'home', icon: Home, label: language === 'zh' ? '首页' : 'Home' },
                { id: 'subjects', icon: BookOpen, label: language === 'zh' ? '课程' : 'Courses' },
                { id: 'ai', icon: Sparkles, label: language === 'zh' ? 'AI教练' : 'AI Coach' },
                { id: 'grades', icon: ClipboardList, label: language === 'zh' ? '成绩' : 'Grades' },
                { id: 'timer', icon: Clock, label: language === 'zh' ? '计时' : 'Timer' },
                { id: 'pk', icon: Swords, label: language === 'zh' ? '竞技' : 'Arena' },
                { id: 'todo', icon: Layout, label: language === 'zh' ? '计划' : 'Planner' },
              ].map((item) => {
                const isActive = (view === item.id || (item.id === 'subjects' && ['graph', 'chinese', 'english'].includes(view)));
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id as AppView)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300",
                      isActive
                        ? "text-white shadow-[0_8px_20px_-6px_var(--accent)] bg-accent text-white" 
                        : theme === 'dark'
                          ? "text-slate-400 hover:text-white hover:bg-slate-800"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive && "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]")} />
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Center (Global Access) */}
          <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-2 pointer-events-none">
            <AnimatePresence>
              {isGoalPanelOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className={cn(
                    "backdrop-blur-2xl p-5 rounded-2xl border shadow-2xl w-64 md:w-72 space-y-4 pointer-events-auto mb-2 origin-bottom-left",
                    theme === 'dark' ? "bg-slate-900/80 border-slate-700" : "bg-white/90 border-slate-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">今日学习目标</h3>
                      <p className="text-[9px] text-slate-400">完成目标可获得学分奖励</p>
                    </div>
                    <div className="p-2 rounded-full bg-accent text-white/20">
                      <Target className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {tasks.filter(t => t.subject === 'math' && !t.deletedAt).length === 0 ? (
                      <div className="text-[10px] text-slate-600 italic text-center py-4">
                        尚未制定数学目标，前往目标商城规划吧
                      </div>
                    ) : (
                      tasks.filter(t => t.subject === 'math' && !t.deletedAt).map((task) => (
                        <GoalItem key={task.id} task={task} theme={theme} onToggle={toggleTask} />
                      ))
                    )}
                  </div>

                  <button 
                    onClick={() => { setIsGoalPanelOpen(false); setView('todo'); }}
                    className="w-full py-2 bg-accent text-white/80 hover:bg-accent text-white text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow shadow-accent/20"
                  >
                    前往目标商城
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              ref={goalCenterRef}
              onClick={() => setIsGoalPanelOpen(!isGoalPanelOpen)}
              className={cn(
                "p-3 md:px-5 rounded-2xl md:rounded-full backdrop-blur-3xl border shadow-2xl transition-all duration-300 flex items-center gap-2 pointer-events-auto group",
                isGoalPanelOpen 
                  ? "bg-accent text-white text-white border-accent shadow-lg shadow-accent/40" 
                  : theme === 'dark' 
                    ? "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white" 
                    : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900"
              )}
              title="目标中心"
            >
              <Target className={cn("w-5 h-5", isGoalPanelOpen ? "" : "group-hover:rotate-45 transition-transform duration-300")} />
              <span className="text-xs font-bold hidden md:inline">目标中心</span>
            </button>
          </div>
        </>
      )}
      
      {user && (
        <AIAssistant 
          user={user} 
          theme={theme} 
          accentColor={accentColor} 
          isFullScreen={view === 'ai'} 
          onClose={() => setView('home')} 
          knowledgeContext={selectedNode ? `【知识点同步】\n名称：${selectedNode.name}\n难度：${selectedNode.difficulty}\n简介：${selectedNode.explanation || '暂无详细背景'}\n考点：${selectedNode.traps?.join('、') || '常规考点'}` : undefined}
        />
      )}

      {/* Beta Announcement Modal */}
      <AnimatePresence>
        {showBetaNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className={cn(
                "w-full max-w-sm relative overflow-hidden rounded-[3rem] border shadow-2xl",
                theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
              )}
            >
              {/* Background Decor */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent/20 to-transparent opacity-50" />
              
              <div className="p-10 relative z-10 text-center space-y-6">
                <div className="inline-flex p-4 rounded-3xl bg-accent/20 text-accent mb-2">
                  <Zap className="w-10 h-10 fill-current" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">{language === 'zh' ? '正式测试版上线' : 'Beta Version Live'}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {language === 'zh' 
                      ? '为了回馈首批内测用户，当前正式测试版本所有 VIP 尊享功能及 3D 知识图谱均可免费体验，无需支付即可解锁全部模块！'
                      : 'To reward our first beta users, all VIP features and 3D graphics are currently FREE to use. No payment required!'}
                  </p>
                </div>

                <div className="py-4 px-6 bg-accent/10 rounded-2xl border border-accent/20">
                  <span className="text-accent font-black text-lg">
                    {language === 'zh' ? '全功能免费开放' : 'All Features Free'}
                  </span>
                </div>

                <button
                  onClick={closeBetaNotice}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors shadow-lg"
                >
                  {language === 'zh' ? '立即体验' : 'Get Started'}
                </button>
                
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black opacity-50 italic">
                  Innovation for Learning
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VipModal 
        isOpen={showVipModal} 
        onClose={() => setShowVipModal(false)} 
        onAccessAnyway={() => { handleGraphAccess(true); setShowVipModal(false); }}
        language={language} 
        theme={theme} 
      />

      <AnimatePresence>
        {showGrowthTutorial && (
          <GrowthTutorial 
            language={language} 
            onComplete={() => setShowGrowthTutorial(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHomeworkAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm",
              theme === 'dark' ? "bg-slate-900/80" : "bg-white/80"
            )}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={cn(
                "max-w-md w-full p-10 rounded-[3rem] border shadow-2xl relative overflow-hidden",
                theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
              )}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BookOpen className="w-32 h-32 text-accent" />
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-accent text-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-accent" />
                </div>
                
                <h2 className="text-3xl font-black tracking-tight mb-4">今日作业提醒</h2>
                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                    <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">作业内容</p>
                    <p className="text-lg font-bold">一元一次方程的应用实验</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">注意事项</p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      请务必在实验过程中记录关键步骤，并拍摄清晰的实验过程照片进行上传。重点关注方程建立的逻辑过程。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowHomeworkAlert(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    稍后再说
                  </button>
                  <button 
                    onClick={() => {
                      setShowHomeworkAlert(false);
                      setIsSubmittingHomework(true);
                    }}
                    className="flex-1 py-4 bg-accent text-white text-white rounded-2xl font-bold shadow-xl shadow-accent/20"
                  >
                    立即提交
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Homework Submission Modal */}
        <AnimatePresence>
          {isSubmittingHomework && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-sm",
                theme === 'dark' ? "bg-slate-900/80" : "bg-white/80"
              )}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={cn(
                  "max-w-md w-full p-10 rounded-[3rem] border shadow-2xl",
                  theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
                )}
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black tracking-tight">上传作业</h2>
                  <button onClick={() => setIsSubmittingHomework(false)} className="p-2 hover:bg-slate-800 rounded-xl">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">选择科目</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['math', 'chinese', 'english'] as const).map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setSubmissionSubject(sub)}
                            className={cn(
                              "py-2 rounded-xl border font-bold text-[10px] uppercase transition-all",
                              submissionSubject === sub 
                                ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20" 
                                : theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                            )}
                          >
                            {sub === 'math' ? '数学' : sub === 'chinese' ? '语文' : '英语'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">选择作业</label>
                      <select 
                        value={selectedHomeworkId}
                        onChange={(e) => setSelectedHomeworkId(e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-accent/20",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                        )}
                      >
                        <option value="">请选择作业...</option>
                        {tasks.filter(t => (t.classId === (user as any)?.classId || !t.classId) && t.subject === submissionSubject).map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>

                  <div 
                    className={cn(
                      "w-full h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-accent transition-all overflow-hidden relative",
                      theme === 'dark' ? "border-slate-800 bg-slate-800/50" : "border-slate-200 bg-slate-50"
                    )}
                    onClick={() => document.getElementById('homework-upload')?.click()}
                  >
                    <input 
                      id="homework-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setHomeworkPhoto)}
                    />
                    {homeworkPhoto ? (
                      <img src={homeworkPhoto} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="p-4 bg-accent/10 text-accent border border-accent/20 rounded-2xl">
                          <Plus className="w-8 h-8 text-accent" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">点击上传作业照片</p>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      if (homeworkPhoto && selectedHomeworkId) {
                        const homework = tasks.find(t => t.id === selectedHomeworkId);
                        const newSubmission = {
                          id: `sub-${Date.now()}`,
                          studentId: user?.name || 'me',
                          studentName: user?.name || '我',
                          homeworkId: selectedHomeworkId,
                          homeworkTitle: homework?.title || '未知作业',
                          subject: submissionSubject,
                          photoUrl: homeworkPhoto,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          status: 'pending'
                        };
                        setSubmissions([newSubmission, ...submissions]);
                        setIsSubmittingHomework(false);
                        setHomeworkPhoto(null);
                        setSelectedHomeworkId('');
                      }
                    }}
                    disabled={!homeworkPhoto || !selectedHomeworkId}
                    className={cn(
                      "w-full py-5 rounded-3xl font-black text-lg transition-all shadow-xl",
                      (homeworkPhoto && selectedHomeworkId) ? "bg-accent text-white text-white shadow-accent/20" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    )}
                  >
                    提交作业
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Submissions Modal */}
        <AnimatePresence>
          {isShowingMySubmissions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm",
                theme === 'dark' ? "bg-slate-900/80" : "bg-white/80"
              )}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={cn(
                  "relative w-full max-w-4xl rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
                  theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
                )}
              >
                <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">我的提交</h2>
                      <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">My Submissions</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsShowingMySubmissions(false)}
                    className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {submissions.filter(s => s.studentId === user?.name).length === 0 ? (
                      <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <ClipboardList className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-bold">暂无提交记录</p>
                      </div>
                    ) : (
                      submissions.filter(s => s.studentId === user?.name).map((sub) => (
                        <div 
                          key={sub.id}
                          className={cn(
                            "p-6 rounded-3xl border transition-all",
                            theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                          )}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block",
                                sub.subject === 'math' ? "bg-accent text-white/20 text-accent" : 
                                sub.subject === 'chinese' ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400"
                              )}>
                                {sub.subject === 'math' ? '数学' : sub.subject === 'chinese' ? '语文' : '英语'}
                              </span>
                              <h4 className="font-bold text-lg">{sub.homeworkTitle}</h4>
                              <p className="text-[10px] text-slate-500 mt-1">{sub.timestamp}</p>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              sub.status === 'graded' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            )}>
                              {sub.status === 'graded' ? '已批改' : '待批改'}
                            </div>
                          </div>

                          <div className="aspect-video rounded-2xl overflow-hidden mb-4 border border-slate-700">
                            <img src={sub.photoUrl} alt="Submission" className="w-full h-full object-cover" />
                          </div>

                          {sub.status === 'graded' && (
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">导师评分</span>
                                <span className="text-2xl font-black text-emerald-400">{sub.grade}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">导师评语</span>
                                <p className="text-xs text-slate-300 leading-relaxed italic">"{sub.comment}"</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Popup */}
        <AnimatePresence>
          {showFeedbackPopup && latestFeedback && (
            <motion.div 
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="fixed top-24 right-8 z-[120] w-80"
            >
              <div className={cn(
                "p-6 rounded-3xl border shadow-2xl overflow-hidden relative",
                theme === 'dark' ? "bg-slate-900 border-emerald-500/30" : "bg-white border-emerald-500/30"
              )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                <button 
                  onClick={() => setShowFeedbackPopup(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">新作业批改反馈</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">New Feedback</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{latestFeedback.homeworkTitle}</span>
                    <span className="text-xl font-black text-emerald-500">{latestFeedback.grade}分</span>
                  </div>
                  <p className="text-xs text-slate-300 italic line-clamp-2">"{latestFeedback.comment}"</p>
                  <button 
                    onClick={() => {
                      setShowFeedbackPopup(false);
                      setIsShowingMySubmissions(true);
                    }}
                    className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

    <style>{`
        .spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#1e293b' : '#e2e8f0'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#334155' : '#cbd5e1'};
        }
      `}</style>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, signIn, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-12 rounded-[3.5rem] bg-slate-900/80 border border-white/10 shadow-2xl text-center space-y-10 relative z-10 backdrop-blur-3xl"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-accent to-purple-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-accent/40 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">智学引擎</h1>
            <p className="text-slate-400 font-medium">登录以开启您的 AI 个性化学习复盘之旅</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={signIn}
              className="w-full py-5 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
              使用 Google 账号登录
            </button>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered by Gemini 3.1 Pro</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <LearningEngine />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

