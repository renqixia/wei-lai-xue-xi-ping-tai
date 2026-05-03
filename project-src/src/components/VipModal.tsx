import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X } from 'lucide-react';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessAnyway: () => void;
  language: 'zh' | 'en';
  theme: 'light' | 'dark';
}

export const VipModal: React.FC<VipModalProps> = ({ isOpen, onClose, onAccessAnyway, language, theme }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-md p-8 rounded-[2rem] border shadow-2xl relative ${theme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
            </div>
            <h2 className="text-2xl font-black mb-4">
              {language === 'zh' ? 'VIP 功能限制' : 'VIP Access Required'}
            </h2>
            <p className="text-slate-500 mb-8">
              {language === 'zh' 
                ? '非VIP用户每天仅限进入一次3D数学图，请充值升级以获取无限访问权限！' 
                : 'Free users are limited to one entry per day for 3D math graphs. Upgrade to VIP for unlimited access!'}
            </p>
            <div className="space-y-4">
              <button 
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold hover:scale-[1.02] transition-transform"
                onClick={() => onClose()}
              >
                {language === 'zh' ? '立即开通 VIP' : 'Upgrade to VIP'}
              </button>
              <button 
                className="w-full py-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                onClick={() => onAccessAnyway()}
              >
                {language === 'zh' ? '直接访问 (消耗一次机会)' : 'Access Anyway (Consume Quota)'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
