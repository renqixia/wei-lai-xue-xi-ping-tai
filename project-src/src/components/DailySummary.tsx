import React, { useState } from 'react';
import { X, Brain, Loader2, Save, History as HistoryIcon, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAIResponse } from '../services/aiService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DailySummaryProps {
  theme: 'dark' | 'light';
  onBack: () => void;
}

const KOLB_STEPS = [
    { id: 'experience', label: '具体经验', desc: '今天发生了什么？' },
    { id: 'reflection', label: '反思观察', desc: '感受如何？' },
    { id: 'conceptualization', label: '抽象概念', desc: '学到了什么规律？' },
    { id: 'active_experimentation', label: '主动实践', desc: '下一步怎么做？' },
];

export default function DailySummary({ theme, onBack }: DailySummaryProps) {
  const [activeStep, setActiveStep] = useState(KOLB_STEPS[0].id);
  const [content, setContent] = useState<Record<string, string>>({});
  const [insight, setInsight] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveReview = async (insightContent: string) => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    const path = 'reviews';
    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        steps: content,
        insight: insightContent,
        createdAt: serverTimestamp(),
        date: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const generateInsight = async () => {
      setIsGenerating(true);
      const prompt = `基于库伯学习圈（Kolb Learning Cycle）模型，请对以下学习复盘内容进行深度的认知洞察分析。
      
      具体经验：${content.experience || '无'}
      反思观察：${content.reflection || '无'}
      抽象概念：${content.conceptualization || '无'}
      主动实践：${content.active_experimentation || '无'}
      
      要求：
      1. 用专业、理性但富有启发性的话语，像一位经验丰富的导师。
      2. 生成格式化的 Markdown 内容。
      3. 重点指出用户思维中的卡点或者可以优化的方向。
      `;
      
      try {
          const response = await getAIResponse(prompt);
          if (response) {
            setInsight(response);
            await saveReview(response);
          } else {
            setInsight('无法生成见解，请重试。');
          }
      } catch (err) {
          setInsight('生成失败，请检查网络。');
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-y-auto custom-scrollbar p-8",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">知识复盘</h1>
          <button onClick={onBack} className="p-3 rounded-2xl bg-slate-500/10 hover:bg-slate-500/20 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Kolb Navigation */}
        <div className="flex gap-2 mb-8">
            {KOLB_STEPS.map((step, i) => (
                <button 
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "flex-1 p-4 rounded-2xl text-sm font-bold border transition-all",
                    activeStep === step.id 
                        ? "bg-amber-500 text-slate-950 border-amber-500" 
                        : "bg-slate-900 text-slate-400 border-slate-800"
                  )}
                >
                    <div className="text-[10px] uppercase tracking-widest opacity-60">步骤 {i + 1}</div>
                    {step.label}
                </button>
            ))}
        </div>

        {/* Input Area */}
        {insight ? (
            <div className={cn(
                "p-8 rounded-[2rem] border whitespace-pre-wrap relative",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            )}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-black text-amber-500">智能洞察</h2>
                  {isSaving ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      自动保存中...
                    </div>
                  ) : saveSuccess ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                      <Check className="w-3 h-3" />
                      已保存到云端
                    </div>
                  ) : null}
                </div>
                {insight}
                <button className="mt-6 px-6 py-3 bg-slate-700 rounded-xl" onClick={() => setInsight('')}>重新复盘</button>
            </div>
        ) : (
            <div className={cn(
                "p-8 rounded-[2rem] border min-h-[300px]",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            )}>
                <h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">
                    {KOLB_STEPS.find(s => s.id === activeStep)?.label}
                </h2>
                <p className="text-slate-500 mb-6">{KOLB_STEPS.find(s => s.id === activeStep)?.desc}</p>
                <textarea 
                    value={content[activeStep] || ''}
                    onChange={(e) => setContent(prev => ({...prev, [activeStep]: e.target.value}))}
                    className="w-full h-64 bg-transparent outline-none resize-none text-lg leading-relaxed placeholder:text-slate-600"
                    placeholder="在此输入你的思考..."
                />
            </div>
        )}

        {/* Action Button */}
        {!insight && (
            <div className="mt-8 flex justify-end">
                <button 
                    onClick={generateInsight}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all disabled:opacity-50">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Brain className="w-5 h-5" />}
                    {isGenerating ? '正在深度分析...' : '生成智能洞察'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
