import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Trophy, 
  Clock, 
  ChevronRight, 
  Rocket, 
  Star, 
  CheckCircle2, 
  Target,
  Sparkles,
  Award,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GrowthTutorialProps {
  onComplete: () => void;
  language: 'zh' | 'en';
}

const steps = [
  {
    id: 'intro',
    title: { zh: '开启成长之旅', en: 'Start Your Growth Journey' },
    desc: { 
      zh: '欢迎来到全新升级的智慧学习系统！让我们花一分钟了解如何快速提升自己。', 
      en: 'Welcome to the upgraded learning system! Let\'s spend a minute learning how to improve faster.' 
    },
    icon: Rocket,
    color: 'text-accent',
    bg: 'bg-accent text-white/10'
  },
  {
    id: 'level',
    title: { zh: '成长与等级', en: 'Leveling & Growth' },
    desc: { 
      zh: '完成任务、通过考试和完成专注计时都能获得经验值 (EXP)。每次升级都会解锁更高级的学习徽章和界面主题。', 
      en: 'Earn EXP by completing tasks, exams, and focus sessions. Each level unlocks new badges and themes.' 
    },
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    id: 'focus',
    title: { zh: '深度专注', en: 'Deep Focus' },
    desc: { 
      zh: '使用「专注计时器」能有效提升你的专注时长。系统会记录你的累计学习时间，并在你达成里程碑时给予丰厚奖励。', 
      en: 'Use the "Focus Timer" to boost your concentration. The system tracks your time and rewards your milestones.' 
    },
    icon: Clock,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    id: 'ability',
    title: { zh: '能力图谱', en: 'Ability Chart' },
    desc: { 
      zh: '完成不同学科的挑战。你的整体能力将在「能力雷达图」中实时反馈，助你查漏补缺，全面均衡发展。', 
      en: 'Complete challenges across subjects. Your skills are reflected in the Ability Chart, helping you balance your growth.' 
    },
    icon: Target,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10'
  },
  {
    id: 'ready',
    title: { zh: '准备就绪', en: 'Ready to Go' },
    desc: { 
      zh: '你的成长轨迹将被真实记录。现在，开启你的学霸模式吧！', 
      en: 'Your progress will be real and tracked. Now, let\'s unlock your full potential!' 
    },
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  }
];

export const GrowthTutorial: React.FC<GrowthTutorialProps> = ({ onComplete, language }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 p-1">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-full flex-grow rounded-full transition-all duration-500",
                i <= currentStep ? "bg-accent text-white" : "bg-white/5"
              )}
            />
          ))}
        </div>

        <div className="p-12 pt-16 flex flex-col items-center text-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <div className={cn("p-8 rounded-[2.5rem] mb-8", step.bg, step.color)}>
                <step.icon className="w-16 h-16" />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-4 italic tracking-tight uppercase">
                {step.title[language]}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                {step.desc[language]}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center gap-6 w-full">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
              >
                {language === 'zh' ? '上一步' : 'Back'}
              </button>
            )}
            <button 
              onClick={next}
              className="flex-grow flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-accent text-white text-white font-black shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all"
            >
              <span>{currentStep === steps.length - 1 ? (language === 'zh' ? '立即开启' : 'Get Started') : (language === 'zh' ? '下一步' : 'Next')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={onComplete}
            className="mt-6 text-xs text-slate-500 font-bold hover:text-slate-400 transition-colors uppercase tracking-[0.2em]"
          >
             {language === 'zh' ? '跳过所有' : 'Skip Everything'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
