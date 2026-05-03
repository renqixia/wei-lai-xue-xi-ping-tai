import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Brain, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Target, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Zap,
  RotateCw,
  Loader2,
  FileText,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { getAIResponse } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExamDiagnosisProps {
  theme: 'light' | 'dark';
  subject: string;
  examData?: {
    score: number;
    totalScore: number;
    examName: string;
    takeaway: string;
    images?: string[];
  };
  onClose: () => void;
}

export default function ExamDiagnosis({ theme, subject, examData, onClose }: ExamDiagnosisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string>('');
  const [dimensions, setDimensions] = useState<{label: string, score: number, desc: string}[]>([]);

  useEffect(() => {
    if (examData) {
      handleAnalyze();
    }
  }, [examData]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setReport('');
    try {
      const prompt = `你是一个全球顶尖的教育评估专家，正在进行一次高维度的试卷诊断分析。
      
      科目：${subject}
      测验名称：${examData?.examName || '自主测评'}
      分数：${examData?.score}/${examData?.totalScore}
      学生初始反思：${examData?.takeaway || '暂无'}
      
      我随附了 ${examData?.images?.length || 0} 张本次测验的试卷截图/答题卡。请结合图片细节进行诊断。
      
      请按照以下“多维度评估标准”生成一份专业的诊断方案：
      
      1. **六大维度量化评估** (请以 JSON 格式输出这部分在回答的最前面，格式为：DIMENSIONS: [{"label": "维度名", "score": 分数0-100, "desc": "简评"}])
         维度包括：基础知识储备、逻辑推导能力、应试技巧/速度、心理稳定性、审题精度、知识点覆盖率。
      
      2. **核心痛点溯源**：不要只看错题，要分析是由于哪种底层思维欠缺导致的。如果有截图，请具体指出截图中的错误类型。
      
      3. **全球标准学习路径**：按照顶级私校或竞赛选手的训练标准，给出的后续改进建议。
      
      4. **“考后复盘”黄金 24 小时建议**。
      
      要求：语气权威、冷峻但富有建设性。不要使用重复和啰嗦的套话。`;

      const text = await getAIResponse(prompt, examData?.images, "gemini-3-flash-preview");
      const dimensionsMatch = text.match(/DIMENSIONS:\s*(\[.*\])/s);
      
      if (dimensionsMatch) {
         try {
           const dims = JSON.parse(dimensionsMatch[1]);
           setDimensions(dims);
           setReport(text.replace(/DIMENSIONS:\s*\[.*\]/s, '').trim());
         } catch (e) {
           setReport(text);
         }
      } else {
        setReport(text);
      }
    } catch (error) {
      console.error("Diagnosis failed:", error);
      setReport("神经诊断链路暂时中断。请检查您的连接。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-3xl bg-slate-950/90"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-4xl h-[80vh] rounded-[2rem] border shadow-2xl flex flex-col overflow-hidden",
          theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase leading-tight">Exam Paper Diagnosis</h3>
              <p className="text-[11px] font-black tracking-[0.2em] uppercase opacity-50">Professional Evaluation System • v3.1</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Stats & Dimensions */}
          <div className={cn(
            "w-full md:w-[280px] p-6 border-b md:border-b-0 md:border-r overflow-y-auto custom-scrollbar",
            theme === 'dark' ? "bg-black/20 border-white/5" : "bg-slate-50/50 border-slate-100"
          )}>
            <div className="mb-8 p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
               <div className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-2">本次测验得分率</div>
               <div className="text-4xl font-black mb-1">
                 {examData ? ((examData.score / examData.totalScore) * 100).toFixed(0) : '0'}%
               </div>
               <div className="text-xs font-bold opacity-80">{examData?.examName || '--'}</div>
            </div>

            {/* Context Images */}
            {examData?.images && examData.images.length > 0 && (
              <div className="mb-8 space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-1">分析素材 / Evidence</h4>
                <div className="grid grid-cols-2 gap-2">
                  {examData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/5 bg-black/40">
                      <img src={img} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> 六维能力模型
              </h4>
              <div className="space-y-5">
                {dimensions.length > 0 ? dimensions.map((dim, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-1.5 px-1">
                      <span className="text-xs font-bold text-slate-400 group-hover:text-accent transition-colors uppercase tracking-wider">{dim.label}</span>
                      <span className="text-xs font-black tabular-nums">{dim.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        className={cn(
                          "h-full rounded-full",
                          dim.score > 80 ? "bg-emerald-500" : dim.score > 60 ? "bg-accent text-white" : "bg-amber-500"
                        )}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 px-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre-wrap">{dim.desc}</p>
                  </div>
                )) : (
                  <div className="py-12 text-center space-y-3 opacity-20">
                    <TrendingUp className="w-10 h-10 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.1em]">等待数据映射...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            {isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center py-16 animate-in fade-in duration-700">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-900 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <h4 className="text-lg font-black tracking-widest uppercase mb-1">Synchronizing Analysis...</h4>
                  <p className="text-[11px] text-slate-500 font-medium max-w-xs italic leading-relaxed">正在构建您的专属学情逻辑图谱，多维度对齐全球测评标准。</p>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-2xl mx-auto space-y-10 pb-16">
                {!report && (
                   <div className="flex flex-col items-center justify-center py-20 gap-6">
                      <div className="p-6 bg-slate-100 dark:bg-white/5 rounded-full">
                        <FileText className="w-12 h-12 opacity-10" />
                      </div>
                      <button 
                        onClick={handleAnalyze}
                        className={cn(
                          "flex items-center gap-3 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl",
                          theme === 'dark' ? "bg-white text-slate-900" : "bg-slate-950 text-white shadow-slate-900/20"
                        )}
                      >
                        <Zap className="w-4 h-4 text-amber-500" />
                        启动人工智能诊断
                      </button>
                   </div>
                )}

                {report && (
                  <>
                    <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20">
                      <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-xs mb-1">系统已签发报告</h5>
                        <p className="text-xs font-bold opacity-80 leading-relaxed italic">诊断任务已完成，评估等级：{dimensions.reduce((a, b) => a + b.score, 0) / 6 > 85 ? 'Superior' : 'Standard'}</p>
                      </div>
                    </div>

                    <div className={cn(
                      "prose prose-slate dark:prose-invert max-w-none markdown-body text-sm leading-[2.2] font-medium p-8 rounded-[2rem] border",
                      theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"
                    )}>
                      <ReactMarkdown>{report}</ReactMarkdown>
                    </div>

                    <div className="flex justify-center pt-8">
                       <button 
                        onClick={handleAnalyze}
                        className={cn(
                          "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all hover:bg-accent text-white hover:text-white border outline-none",
                          theme === 'dark' ? "border-white/10 text-white hover:bg-white hover:text-slate-900" : "border-slate-200 text-slate-600 bg-white shadow-sm"
                        )}
                       >
                         <RotateCw className="w-4 h-4" />
                         重新演练诊断
                       </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
