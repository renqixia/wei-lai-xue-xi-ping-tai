import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Award, 
  ShieldCheck, 
  LogOut, 
  X, 
  Camera, 
  ChevronRight, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Star,
  Palette,
  Bell,
  Languages,
  Monitor,
  Smartphone,
  Info,
  Pencil,
  Plus,
  QrCode,
  CreditCard
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { colorSchemes, ColorScheme } from '../lib/themes';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserProfile {
  name: string;
  email: string;
  photo: string;
  role: 'student' | 'teacher';
  level: number;
  exp: number;
  bio?: string;
  isVip?: boolean;
  vipExpiry?: string;
}

interface UserSettingsProps {
  user: UserProfile;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  activeSchemeId: number;
  setActiveSchemeId: (id: number) => void;
  language: 'zh' | 'en';
  setLanguage: (lang: 'zh' | 'en') => void;
  stats: {
    studyHours: string;
    completedTasks: number;
  };
  onClose: () => void;
  onLogout: () => void;
  onUpdateUser: (newData: Partial<UserProfile>) => void;
  onResetAccount: () => Promise<void>;
  onClearReviews: () => Promise<void>;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ 
  user, 
  theme, 
  setTheme, 
  activeSchemeId, 
  setActiveSchemeId, 
  language,
  setLanguage,
  stats,
  onClose, 
  onLogout,
  onUpdateUser,
  onResetAccount,
  onClearReviews
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'app' | 'achievement' | 'security' | 'vip'>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearReviewsConfirm, setShowClearReviewsConfirm] = useState(false);
  const [showPurchaseVip, setShowPurchaseVip] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const t = {
    zh: {
      profile: '个人资料',
      app: '应用配置',
      achievement: '我的成就',
      security: '安全中心',
      vip: 'VIP会员',
      logout: '退出登录',
      hub: '设置中心',
      lang: '语言设置',
      theme: '显示模式',
      accent: '主亮色选择',
      secTitle: '安全与隐私保障',
      secDesc: '您的数据安全是我们的最高优先级',
    },
    en: {
      profile: 'Profile',
      app: 'App Config',
      achievement: 'Awards',
      security: 'Security',
      vip: 'VIP Membership',
      logout: 'Sign Out',
      hub: 'Settings',
      lang: 'Language',
      theme: 'Display Mode',
      accent: 'Accent Color',
      secTitle: 'Security & Privacy',
      secDesc: 'Your data security is our top priority',
    }
  }[language];

  const tabs = [
    { id: 'profile', label: t.profile, icon: UserIcon },
    { id: 'app', label: t.app, icon: Palette },
    { id: 'achievement', label: t.achievement, icon: Award },
    { id: 'security', label: t.security, icon: ShieldCheck },
    { id: 'vip', label: t.vip, icon: Star },
  ];

  const handleUpdateName = () => {
    onUpdateUser({ name: tempName });
    setIsEditingName(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn(
      "w-full max-w-5xl h-[80vh] flex overflow-hidden rounded-[3rem] border shadow-2xl relative",
      theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
    )}>
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarUpload} 
        className="hidden" 
        accept="image/*" 
      />

      {/* Sidebar */}
      <div className={cn(
        "w-64 border-r flex flex-col p-8 pt-12",
        theme === 'dark' ? "bg-slate-950/50 border-white/5" : "bg-slate-50 border-slate-100"
      )}>
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black italic tracking-tight flex items-center gap-2">
            <div className="w-2 h-8 bg-accent text-white rounded-full" />
            {t.hub}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mt-1">Control Hub</p>
        </div>

        <nav className="flex-grow space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group",
                activeTab === tab.id 
                  ? "bg-accent/20 text-accent font-bold border border-accent/20" 
                  : "text-slate-500 hover:bg-slate-500/5 hover:text-slate-400"
              )}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-tab-glow"
                  className="absolute left-0 w-1 h-6 bg-accent text-white rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                />
              )}
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-accent" : "text-slate-500 group-hover:scale-110 transition-transform")} />
              <span className="text-sm">{tab.label}</span>
              <ChevronRight className={cn("w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all", activeTab === tab.id && "opacity-100")} />
            </button>
          ))}
        </nav>

        <button 
          onClick={onLogout}
          className="mt-auto flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-bold group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">{t.logout}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col relative overflow-hidden bg-pattern-dot">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 rounded-2xl hover:bg-slate-500/10 transition-colors z-20 group"
        >
          <X className="w-6 h-6 text-slate-500 group-rotate-90 transition-transform" />
        </button>

        <div className="flex-grow overflow-y-auto p-12 pt-16 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                {/* Header Profile */}
                <div className="flex items-center gap-10">
                  <div className="relative group">
                    <img 
                      src={user.photo} 
                      alt={user.name} 
                      className="w-32 h-32 rounded-[2.5rem] border-4 border-accent/20 object-cover shadow-2xl group-hover:scale-105 transition-transform"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-3 bg-accent text-white rounded-2xl shadow-xl hover:scale-110 transition-all text-white border-2 border-slate-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3 flex-grow">
                    {isEditingName ? (
                      <div className="flex items-center gap-4">
                        <input 
                          autoFocus
                          type="text" 
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={handleUpdateName}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                          className="text-4xl font-black bg-slate-500/10 border-b-2 border-accent outline-none px-2 py-1 w-full"
                        />
                      </div>
                    ) : (
                      <h3 className="text-4xl font-black group flex items-center gap-4">
                        {user.name}
                        {user.isVip && <Star className="w-6 h-6 text-amber-500 fill-amber-500" />}
                        <button onClick={() => setIsEditingName(true)}>
                          <Pencil className="w-5 h-5 text-slate-500 hover:text-accent cursor-pointer transition-colors" />
                        </button>
                      </h3>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-black uppercase tracking-widest border border-amber-500/20">
                        {language === 'zh' ? '智慧学者' : 'Scholar'} LV.{user.level}
                      </span>
                      <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">
                        ID: {user.name.slice(0, 3).toUpperCase()}-2026
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={cn(
                    "p-6 rounded-[2rem] border relative overflow-hidden",
                    theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-blue-50/50 border-blue-100"
                  )}>
                    <Zap className="w-8 h-8 text-amber-500 mb-4" />
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{language === 'zh' ? '学习经验值' : 'Experience Points'}</div>
                    <div className="text-2xl font-black mt-1">{user.exp} / 5000</div>
                    <div className="w-full h-1.5 bg-slate-500/10 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(user.exp / 5000) * 100}%` }} />
                    </div>
                  </div>
                  <div className={cn(
                    "p-6 rounded-[2rem] border relative overflow-hidden",
                    theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-emerald-50/50 border-emerald-100"
                  )}>
                    <Clock className="w-8 h-8 text-emerald-500 mb-4" />
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{language === 'zh' ? '累计专注时长' : 'Total Focus Time'}</div>
                    <div className="text-2xl font-black mt-1">{stats.studyHours}h</div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                      {language === 'zh' ? '超越了 92% 的同龄人' : 'Top 8% of all users'}
                    </p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-[2rem] border relative overflow-hidden",
                    theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-indigo-50/50 border-indigo-100"
                  )}>
                    <CheckCircle2 className="w-8 h-8 text-indigo-500 mb-4" />
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{language === 'zh' ? '已完成任务' : 'Tasks Completed'}</div>
                    <div className="text-2xl font-black mt-1">{stats.completedTasks} {language === 'zh' ? '项' : 'Tasks'}</div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2">{language === 'zh' ? '点击查看详细战报' : 'View detailed reports'}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'app' && (
              <motion.div
                key="app"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-8">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{language === 'zh' ? '个性化展示' : 'Personalization'}</h4>
                  
                  {/* Theme Switcher */}
                  <div className="flex items-center justify-between p-8 rounded-[2rem] border bg-slate-500/5 border-slate-500/10">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/5 transition-transform hover:scale-105">
                        <Monitor className="w-8 h-8 text-accent" />
                      </div>
                      <div>
                        <div className="text-lg font-bold">{t.theme}</div>
                        <p className="text-xs text-slate-500 mt-1">{language === 'zh' ? '保护视力的学习界面' : 'Eye-protection modes'}</p>
                      </div>
                    </div>
                    <div className="flex p-1 bg-slate-500/10 rounded-2xl">
                      <button 
                        onClick={() => setTheme('light')}
                        className={cn(
                          "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                          theme === 'light' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500"
                        )}
                      >
                        {language === 'zh' ? '亮色' : 'Light'}
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                        className={cn(
                          "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                          theme === 'dark' ? "bg-[#0f172a] text-white shadow-xl" : "text-slate-500"
                        )}
                      >
                        {language === 'zh' ? '暗色' : 'Dark'}
                      </button>
                    </div>
                  </div>

                  {/* Accent Color Selection */}
                  <div className="space-y-6">
                    <div className="text-lg font-bold px-2">{t.accent}</div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {colorSchemes.map(scheme => (
                        <button
                          key={scheme.id}
                          onClick={() => setActiveSchemeId(scheme.id)}
                          className={cn(
                            "group p-3 rounded-2xl border transition-all relative overflow-hidden",
                            activeSchemeId === scheme.id 
                              ? "border-accent ring-4 ring-accent/10" 
                              : "border-slate-500/10 hover:border-slate-500/30"
                          )}
                        >
                          <div 
                            className="w-full h-8 rounded-lg mb-2 shadow-sm flex"
                          >
                            <div className="flex-1" style={{ backgroundColor: theme === 'dark' ? scheme.dark.accent : scheme.light.accent }} />
                            <div className="flex-1" style={{ backgroundColor: theme === 'dark' ? scheme.dark.bg : scheme.light.bg }} />
                          </div>
                          <div className="text-[10px] font-black text-center truncate">{scheme.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center justify-between p-8 rounded-[2rem] border bg-slate-500/5 border-slate-500/10">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-indigo-500/10 rounded-2xl">
                        <Languages className="w-8 h-8 text-indigo-500" />
                      </div>
                      <div>
                        <div className="text-lg font-bold">{t.lang}</div>
                        <p className="text-xs text-slate-500 mt-1">{language === 'zh' ? '全局界面语言切换' : 'Switch interface language'}</p>
                      </div>
                    </div>
                    <div className="flex p-1 bg-slate-500/10 rounded-2xl">
                      <button 
                        onClick={() => setLanguage('zh')}
                        className={cn(
                          "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                          language === 'zh' ? "bg-accent text-white text-white shadow-xl" : "text-slate-500"
                        )}
                      >
                        中文
                      </button>
                      <button 
                        onClick={() => setLanguage('en')}
                        className={cn(
                          "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                          language === 'en' ? "bg-accent text-white text-white shadow-xl" : "text-slate-500"
                        )}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6 mb-8">
                  <div className="p-5 bg-emerald-500/10 rounded-[2rem]">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{t.secTitle}</h3>
                    <p className="text-slate-500 text-sm">{t.secDesc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={cn("p-6 rounded-[2rem] border", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100")}>
                    <h4 className="font-bold flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      端到端加密
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      您的所有学习进度和个人笔记均采用 AES-256 位军事级加密技术存储。即使是开发团队也无法在未授权的情况下读取您的私人文档。
                    </p>
                  </div>
                  <div className={cn("p-6 rounded-[2rem] border", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100")}>
                    <h4 className="font-bold flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-accent text-white" />
                      账号完整性
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      我们集成了双重身份验证 (2FA) 和异常登录检测系统。如果您的账号在陌生设备登录，我们会立即通过邮件为您发送安全提醒。
                    </p>
                  </div>
                  <div className={cn("p-6 rounded-[2rem] border", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100")}>
                    <h4 className="font-bold flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      隐私合规
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      本应用严格遵守 GDPR 与 CCPA 隐私协议。我们承诺绝不向第三方广告商出售您的学习行为数据，让您能百分百专注于学业。
                    </p>
                  </div>
                  <div className={cn("p-6 rounded-[2rem] border", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100")}>
                    <h4 className="font-bold flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      生物识别
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      支持使用 FaceID 或指纹解锁高敏学习资料库，为您的期末突击资料保驾护航。
                    </p>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-slate-500/5 border border-slate-500/10 text-center">
                  <p className="text-xs text-slate-500 mb-4 italic">“知识是个人的财富，保护它是我们的使命。”</p>
                  <button className="px-8 py-3 bg-accent text-white rounded-2xl font-bold text-sm shadow-xl shadow-accent/20">
                    下载完整安全报告 (PDF)
                  </button>
                </div>

                  <div className="p-8 rounded-[2rem] border border-red-500/20 bg-red-500/5 mt-12">
                  <h4 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    危险区域
                  </h4>
                  <p className="text-xs text-slate-500 mb-6">
                    清空数据将永久删除您的复盘记录并可能重置账号等级。此操作无法撤销。
                  </p>
                  
                  <div className="flex flex-col gap-4">
                    {!showResetConfirm ? (
                      <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        清空所有数据 (LV.1 重置)
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-[10px] font-bold text-red-500 mb-3 text-center uppercase tracking-widest">确认要重置整个账号吗？</p>
                        <div className="flex gap-2">
                          <button 
                            disabled={isResetting}
                            onClick={async () => {
                              setIsResetting(true);
                              try {
                                await onResetAccount();
                                setShowResetConfirm(false);
                              } finally {
                                setIsResetting(false);
                              }
                            }}
                            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-red-900/20"
                          >
                            {isResetting ? '清空中...' : '确认重置'}
                          </button>
                          <button 
                            disabled={isResetting}
                            onClick={() => setShowResetConfirm(false)}
                            className="px-4 py-2 bg-slate-500/20 text-slate-400 rounded-lg font-bold text-xs"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}

                    {!showClearReviewsConfirm ? (
                      <button 
                        onClick={() => setShowClearReviewsConfirm(true)}
                        className="px-6 py-3 border border-red-500/40 text-red-500 hover:bg-red-500/10 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        仅清空复盘历史
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-[10px] font-bold text-red-500 mb-3 text-center uppercase tracking-widest">确认要删除所有复盘记录吗？</p>
                        <div className="flex gap-2">
                          <button 
                            disabled={isResetting}
                            onClick={async () => {
                              setIsResetting(true);
                              try {
                                await onClearReviews();
                                setShowClearReviewsConfirm(false);
                              } finally {
                                setIsResetting(false);
                              }
                            }}
                            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-red-900/20"
                          >
                            {isResetting ? '清空中...' : '确认删除'}
                          </button>
                          <button 
                            disabled={isResetting}
                            onClick={() => setShowClearReviewsConfirm(false)}
                            className="px-4 py-2 bg-slate-500/20 text-slate-400 rounded-lg font-bold text-xs"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'vip' && (
              <motion.div
                key="vip"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-[2.5rem] border bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                  <h3 className="text-2xl font-black flex items-center gap-3">
                    <Star className="w-8 h-8 text-amber-500" />
                    {user.isVip ? (language === 'zh' ? '您是尊贵的 VIP 用户' : 'You are a VIP Member') : (language === 'zh' ? '您当前是免费用户' : 'You are a Free Member')}
                  </h3>
                  {user.isVip && (
                    <p className="text-slate-500 mt-2 text-sm">{language === 'zh' ? `会员有效期至: ${user.vipExpiry}` : `Member until: ${user.vipExpiry}`}</p>
                  )}
                  {!user.isVip && (
                    <p className="text-slate-500 mt-2 text-sm">{language === 'zh' ? '升级为 VIP 可以解锁无限次3D数学图访问权限与更多高级功能！' : 'Upgrade to VIP to unlock unlimited 3D math graph access and more!'}</p>
                  )}
                  <button 
                    onClick={() => setShowPurchaseVip(true)}
                    className="mt-6 px-8 py-3 bg-amber-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-transform"
                  >
                    {user.isVip ? (language === 'zh' ? '续费会员' : 'Renew Membership') : (language === 'zh' ? '立即开通 VIP' : 'Upgrade to VIP')}
                  </button>
                </div>

                {/* VIP Benefits Detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {[
                    { icon: Monitor, title: '无限3D图表', desc: '无限制访问所有数学知识图谱', color: 'text-blue-500' },
                    { icon: Zap, title: '智能题目解析', desc: 'AI 深度解析复杂数学难题', color: 'text-amber-500' },
                    { icon: ShieldCheck, title: '优先支持', desc: '享受专属客服及功能抢先体验', color: 'text-emerald-500' },
                    { icon: Award, title: '尊贵标识', desc: '个人中心专属尊贵金星标识', color: 'text-purple-500' }
                  ].map((benefit, i) => (
                    <div key={i} className={cn(
                      "p-5 rounded-2xl border flex items-start gap-4",
                      theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100"
                    )}>
                      <div className={cn("p-3 rounded-xl bg-slate-500/5", benefit.color)}>
                        <benefit.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{benefit.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{benefit.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'achievement' && (
              <motion.div
                key="achievement"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: '初出茅庐', icon: Star, color: 'text-accent', bg: 'bg-accent/10 border border-accent/20', unlocked: true },
                    { label: '专注达人', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10', unlocked: true },
                    { label: '满分神手', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', unlocked: true },
                    { label: '坚持不懈', icon: Award, color: 'text-slate-300', bg: 'bg-slate-300/10', unlocked: false },
                  ].map((badge, i) => (
                    <div key={i} className={cn(
                      "p-6 rounded-[2.5rem] border flex flex-col items-center text-center gap-4 transition-all hover:scale-105",
                      badge.unlocked ? "opacity-100 grayscale-0" : "opacity-40 grayscale blur-[1px]",
                      theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100 shadow-sm"
                    )}>
                      <div className={cn("p-4 rounded-full shadow-inner", badge.bg, badge.color)}>
                        <badge.icon className={cn("w-8 h-8", badge.color)} />
                      </div>
                      <div className="text-sm font-black">{badge.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* VIP Purchase Modal */}
      <AnimatePresence>
        {showPurchaseVip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "w-full max-w-md relative overflow-hidden rounded-[3rem] border shadow-2xl",
                theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
              )}
            >
              <button 
                onClick={() => setShowPurchaseVip(false)}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-500/10 transition-colors z-20"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <div className="p-10 space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-4 rounded-3xl bg-amber-500/20 text-amber-500 mb-2">
                    <Star className="w-8 h-8 fill-current" />
                  </div>
                  <h3 className="text-2xl font-black">{language === 'zh' ? '开通尊贵 VIP' : 'Get VIP Access'}</h3>
                  <p className="text-slate-500 text-sm">解锁全部高级功能与 3D 知识图谱</p>
                </div>

                <div className="space-y-4">
                    <div className={cn(
                        "p-5 rounded-2xl border-2 border-accent bg-accent/5 flex items-center justify-between",
                        theme === 'dark' ? "border-accent/40" : "border-accent"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-accent/20 rounded-xl">
                                <CreditCard className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <div className="font-bold">12 个月会员 (年付)</div>
                                <div className="text-[10px] text-accent font-black uppercase tracking-widest">超值推荐</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-black">¥199</div>
                            <div className="text-[10px] text-slate-500 line-through">¥360</div>
                        </div>
                    </div>

                    <div className={cn(
                        "p-5 rounded-2xl border border-slate-500/10 bg-slate-500/5 flex items-center justify-between opacity-60",
                        theme === 'dark' ? "" : ""
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-500/10 rounded-xl">
                                <CreditCard className="w-6 h-6 text-slate-500" />
                            </div>
                            <div>
                                <div className="font-bold">1 个月会员</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-black">¥30</div>
                        </div>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="pt-4 border-t border-slate-500/10 flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div className="w-40 h-40 bg-white p-2 rounded-2xl shadow-xl overflow-hidden">
                            <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center relative">
                                <QrCode className="w-24 h-24 text-slate-300 blur-[6px]" />
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-slate-400 opacity-50" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg rotate-12">
                           TESTING
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-slate-600 mb-1">使用微信或支付宝扫描支付</p>
                        <p className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                           正式测试版全功能免费
                        </p>
                    </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
