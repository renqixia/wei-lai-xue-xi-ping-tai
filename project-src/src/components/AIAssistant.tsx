import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Phone, X, User as UserIcon, Bookmark, Mic, Play, Square, Loader2, Sparkles, Send, Cloud, Volume2, VolumeX, Settings2, Calculator, BookOpen, Globe, CheckCircle2, Trash2, Zap, Brain, ImageIcon, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Type } from '@google/genai';
import { getChatResponse } from '../services/aiService';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { mathPrompt, chinesePrompt, englishPrompt } from './AIPrompts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(' ', inputs));
}

// Initialize the Gemini API client globally inside the component when needed to grab latest key

interface AIPersona {
  id: string;
  name: string;
  role: string;
  prompt: string;
  avatar: string;
}

export const DEBATE_PERSONAS: AIPersona[] = [
  { id: 'socrates', name: '苏格拉底', role: '哲学家', prompt: '你现在是苏格拉底，用充满哲理和不断反问的方式激发用户的深层思考。回答需简练有力。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=socrates&hair=short' },
  { id: 'jobs', name: '乔布斯', role: '创新者', prompt: '你是乔布斯，强调极致的体验、颠覆性创新和简洁之美，说话直接、充满激情并追求完美。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jobs&hair=short' },
  { id: 'musk', name: '马斯克', role: '工程师', prompt: '你是马斯克，坚持第一性原理，追求物理学规律下的工程极限，逻辑且务实，思考长远。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=musk&hair=short' },
  { id: 'turing', name: '图灵', role: '计算机先驱', prompt: '你是艾伦·图灵，以纯粹的逻辑、理性和计算思维看待世界。解答客观且严谨。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=turing&hair=short' }
];

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
  timestamp: Date;
  personaId?: string;
}

const DEFAULT_PROMPT = "你是一个温柔、耐心、聪明的系统级AI学生助手及控制中心。你可以回答学习问题，也可以随时随地根据用户要求操作页面（例如切换主题）。保持回答简洁并富有鼓励性。";

export default function AIAssistant({ user, theme, accentColor = 'sierra-blue', isFullScreen = false, onClose, knowledgeContext }: { user: any; theme: 'light' | 'dark'; accentColor?: string; isFullScreen?: boolean; onClose?: () => void; knowledgeContext?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'profile' | 'memory'>('chat');
  
  // Custom drag state for the floating button to remove physics
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [isDraggingBtn, setIsDraggingBtn] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isFullScreen || isOpen) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBtn(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: buttonPos.x,
      initialY: buttonPos.y
    };
    
    // Use pointer-capture on the element or global events. Global is safer.
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setButtonPos({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
  };

  const handlePointerUp = (e: PointerEvent) => {
    setIsDraggingBtn(false);
    
    if (dragRef.current) {
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);
      // Small threshold to distinguish click from drag
      if (dx < 3 && dy < 3) {
        setIsOpen(true);
      }
    }
    
    dragRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);
  
  // Prompt selection state
  const [promptMode, setPromptMode] = useState<'default' | 'math' | 'chinese' | 'english' | 'custom'>('default');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini-3-flash-preview' | 'gemini-3.1-pro-preview'>('gemini-3.1-pro-preview');

  const [isBrainstormMode, setIsBrainstormMode] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['socrates', 'jobs']);
  
  // Chat state
  const initialMessage: Message = { 
    id: '1', 
    role: 'model', 
    content: '你好！我是你的系统级AI助理。我可以回答你的问题，也能帮你直接操作页面（例如切换深浅色主题、打开笔记等）。\n\n请在**右上角设置**中选择你需要学习的学科助手，或者自定义一个助手配置。', 
    timestamp: new Date() 
  };
  const CHAT_HISTORY_KEY = `ai_chat_history_${user?.id || 'default'}`;

  // Memory state
  const MEMORY_DB_KEY = `ai_memories_db_${user?.id || 'default'}`;
  interface AIMemory { id: string; fact: string; timestamp: Date; }
  const [aiMemories, setAiMemories] = useState<AIMemory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(MEMORY_DB_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAiMemories(parsed.map((p: any) => ({ ...p, timestamp: new Date(p.timestamp) })));
      } catch(e) {
        setAiMemories([]);
      }
    } else {
      setAiMemories([]);
    }
  }, [MEMORY_DB_KEY]);

  const latestMemoryKey = useRef(MEMORY_DB_KEY);
  latestMemoryKey.current = MEMORY_DB_KEY;

  useEffect(() => {
    localStorage.setItem(latestMemoryKey.current, JSON.stringify(aiMemories));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMemories]);

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  // Load chat history
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        if (hydrated.length > 0) {
          setMessages(hydrated);
        } else {
          setMessages([initialMessage]);
        }
      } catch(e) {
        console.error('Failed to load chat history', e);
        setMessages([initialMessage]);
      }
    } else {
      setMessages([initialMessage]);
    }
  }, [CHAT_HISTORY_KEY]);

  const latestChatKey = useRef(CHAT_HISTORY_KEY);
  latestChatKey.current = CHAT_HISTORY_KEY;

  // Save chat history
  useEffect(() => {
    localStorage.setItem(latestChatKey.current, JSON.stringify(messages));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAutoTTS, setIsAutoTTS] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearChat = () => {
    setMessages([initialMessage]);
    stopAudio();
  };

  const SUGGESTIONS = [
    "给我制定一个复习计划",
    "帮我切换到深色主题",
    "背诵课文有什么好方法？",
    "解这道数学题"
  ];

  const PROMPTS_CONFIG = [
    { id: 'default', title: '全能教练', desc: '默认通用问答', icon: Sparkles, color: 'text-accent', bg: 'bg-accent/10 border-blue-200 dark:border-accent/30' },
    { id: 'math', title: '数学密探', desc: '温和打猎模式', icon: Calculator, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-200 dark:border-rose-500/30' },
    { id: 'chinese', title: '语文架构师', desc: '逻辑拆解与阅读', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' },
    { id: 'english', title: '英语解码者', desc: '框架与词根推导', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-200 dark:border-purple-500/30' },
    { id: 'custom', title: '自定义', desc: '编写专属提示词', icon: Settings2, color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-200 dark:border-slate-500/30' }
  ];
  
  // Voice Input (SpeechRecognition)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Voice Output (TTS) playback state
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      stopAudio();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInputText('');
      recognitionRef.current?.start();
    }
  };

  const getSystemInstruction = () => {
    let instructionConfig = "";
    switch(promptMode) {
      case 'math': instructionConfig = mathPrompt; break;
      case 'chinese': instructionConfig = chinesePrompt; break;
      case 'english': instructionConfig = englishPrompt; break;
      case 'custom': instructionConfig = customPrompt || DEFAULT_PROMPT; break;
      default: instructionConfig = DEFAULT_PROMPT; break;
    }
    let userContext = "";
    if (user) {
      userContext = `\n\n【用户及场景上下文】\n你在控制着整个学习应用，随时可以利用工具带用户前往应用内的各处。\n当前用户名: ${user.name || '未知'}\n身份: ${user.role === 'teacher' ? '教师' : '学生'}\n学习等级: LV.${user.level || 1}\n\n`;
    }
    
    if (aiMemories.length > 0) {
      userContext += `【你关于该用户的记忆库】:\n` + aiMemories.map(m => `- ${m.fact}`).join("\n") + "\n\n在回答时，如有相关性请利用上述记忆，如果用户提供新信息随时可以调用 memorize_info 增添记忆。";
    }

    if (knowledgeContext) {
      userContext += `\n\n【当前知识系统同步】\n用户此刻正在数学探索界面查看以下知识点核心：\n${knowledgeContext}\n请你表现得像是正在陪他一起观察这个知识点，随时提供辅助说明、避坑指南或鼓励。`;
    }
    
    // Also include the system tools instruction to keep the change_theme function working if not explicitly removed
    return instructionConfig + userContext + "\n\n除此之外，你可以随时随地根据用户要求操作页面（例如切换主题、跳转页面）。保持回答结构化。";
  };

  const stopAudio = () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.stop();
      currentAudioSourceRef.current.disconnect();
      currentAudioSourceRef.current = null;
    }
    setIsPlayingId(null);
  };

  const playTTS = async (text: string, messageId: string) => {
    try {
      if (isPlayingId === messageId) {
        stopAudio();
        return;
      }
      
      stopAudio(); // stop any current playback
      setIsPlayingId(messageId);
      
      const aiService = await import('../services/aiService');
      const base64Audio = await aiService.getTTSAudio(text.replace(/[*#]/g, ''));
      
      if (!base64Audio) throw new Error("No audio payload returned");

      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      const audioBuffer = audioContextRef.current.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0; 
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsPlayingId(null);
      };
      source.start();
      currentAudioSourceRef.current = source;
      
    } catch (e) {
      console.error("TTS playback failed:", e);
      stopAudio();
      
      const cleanText = text.replace(/[*#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "zh-CN";
      utterance.onend = () => setIsPlayingId(null);
      setIsPlayingId(messageId);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim(), image: selectedImage || undefined, timestamp: new Date() };
    
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);
    setIsStreaming(false); // No streaming for now with backend proxy
    
    if (isListening) recognitionRef.current?.stop();

    try {
      if (isBrainstormMode && selectedPersonas.length > 0) {
        // Brainstorm loop
        let tempMessages = [...messages, userMsg];
        setMessages(tempMessages);
        
        for (const pId of selectedPersonas) {
          const persona = DEBATE_PERSONAS.find(p => p.id === pId);
          if (!persona) continue;
          
          setIsTyping(true);
          const botTempId = Date.now().toString() + Math.random();
          const initBotMsg: Message = { id: botTempId, role: 'model', content: '', timestamp: new Date(), personaId: pId };
          tempMessages = [...tempMessages, initBotMsg];
          setMessages(tempMessages);
          
          const combinedParts: any[] = [];
          tempMessages.slice(0, -1).forEach(m => {
            const speaker = m.role === 'user' ? '用户' : (DEBATE_PERSONAS.find(p => p.id === m.personaId)?.name || 'AI');
            combinedParts.push({ text: `[${speaker}]: ${m.content || ' '}\n` });
            if (m.image) {
               combinedParts.push({
                 inlineData: { data: m.image.split(',')[1], mimeType: m.image.match(/data:([^;]+);/)?.[1] || 'image/jpeg' }
               });
            }
          });
          
          let aiSysInstruction = persona.prompt;
          if (user) aiSysInstruction += `\n用户: ${user.name || '未知'}`;
          
          combinedParts.push({ text: `\n[系统指令] 现在请 ${persona.name} 进行回答。` });
          
          const contents = [{ role: 'user', parts: combinedParts }];
          
          const data = await getChatResponse(contents, aiSysInstruction, undefined, aiModel === 'gemini-3.1-pro-preview' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview');
          
          const fullText = data.text;
          setMessages(prev => prev.map(m => m.id === botTempId ? { ...m, content: fullText } : m));
          tempMessages = tempMessages.map(m => m.id === botTempId ? { ...m, content: fullText } : m);
          setIsTyping(false);
        }
      } else {
        // Standard single model mode
        const tempId = (Date.now() + 1).toString();
        const initBotMsg: Message = { id: tempId, role: 'model', content: '', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg, initBotMsg]);
        
        const rawHistory = messages.filter(m => m.id !== '1' && m.content.trim() !== '').concat(userMsg);
        const contents = rawHistory.reduce((acc, current) => {
          const parts: any[] = [{ text: current.content || ' ' }];
          if (current.image) {
             const mimeMatch = current.image.match(/data:([^;]+);/);
             parts.push({
               inlineData: { data: current.image.split(',')[1], mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg' }
             });
          }
          
          if (acc.length > 0 && acc[acc.length - 1].role === current.role) {
              acc[acc.length - 1].parts.push(...parts);
          } else {
              acc.push({ role: current.role, parts });
          }
          return acc;
        }, [] as any[]);
        
        const tools = [
          {
            functionDeclarations: [
              {
                name: "change_theme",
                description: "改变页面的深色或浅色主题。",
                parameters: { type: Type.OBJECT, properties: { theme: { type: Type.STRING } }, required: ["theme"] }
              },
              {
                name: "navigate",
                description: "跳转到应用内的其他页面。",
                parameters: { type: Type.OBJECT, properties: { destination: { type: Type.STRING } }, required: ["destination"] }
              },
              {
                name: "memorize_info",
                description: "记忆用户的重要信息。隐式调用。",
                parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] }
              },
              {
                name: "toggle_goal_panel",
                description: "控制打开或关闭目标面板。",
                parameters: { type: Type.OBJECT, properties: { state: { type: Type.STRING } }, required: ["state"] }
              }
            ]
          }
        ];

        const data = await getChatResponse(
          contents, 
          getSystemInstruction(), 
          tools, 
          aiModel === 'gemini-3.1-pro-preview' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview'
        );
        
        setIsTyping(false);

        let fullText = data.text || "";
        const calls = data.functionCalls;
        
        if (calls && calls.length > 0) {
          calls.forEach((call: any) => {
            if (call.name === 'change_theme') {
               const themeStr = (call.args as any)?.theme || 'dark';
               window.dispatchEvent(new CustomEvent('ai_command', { detail: { action: 'change_theme', value: themeStr } }));
               fullText += `\n*✨ 已为你切换为${themeStr === 'dark' ? '深色' : '浅色'}主题！*`;
            } else if (call.name === 'navigate') {
               const dest = (call.args as any)?.destination;
               window.dispatchEvent(new CustomEvent('ai_command', { detail: { action: 'navigate', value: dest } }));
               fullText += `\n*🚀 已带你前往相应页面！*`;
            } else if (call.name === 'toggle_goal_panel') {
               const state = (call.args as any)?.state;
               window.dispatchEvent(new CustomEvent('ai_command', { detail: { action: 'toggle_goal_panel', value: state } }));
               fullText += `\n*🎯 已为你${state === 'open' ? '打开' : '关闭'}目标面板！*`;
            } else if (call.name === 'memorize_info') {
               const factStr = (call.args as any)?.fact;
               if (factStr) {
                 setAiMemories(prev => [...prev, { id: Date.now().toString() + Math.random(), fact: factStr, timestamp: new Date() }]);
                 fullText += `\n*🧠 我已记住：${factStr}*`;
               }
            }
          });
        }
        
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: fullText } : m));
        
        if (isAutoTTS && fullText) {
          playTTS(fullText, tempId);
        }
      }
    } catch (err) {
      console.error("Chat generation failed", err);
      // Fallback
      if (!isBrainstormMode) {
        setMessages(prev => prev.map(m => (m.role === 'model' && m.content === '') ? { ...m, content: `抱歉，暂时无法连接。` } : m));
      }
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const innerContent = (
    <>
        {/* Header */}
        <div className={cn(
          "p-4 border-b flex justify-between items-center",
          theme === 'dark' ? "border-white/5 bg-slate-800/80" : "border-slate-100 bg-slate-50"
        )}>
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn("px-6 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition-all", activeTab === 'chat' ? 'bg-accent text-white text-white shadow-lg shadow-accent/20' : 'text-slate-500 hover:text-accent dark:hover:text-accent')}
            >
              <MessageSquare className="w-4 h-4" />
              AI伴学导师
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={cn("px-6 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition-all", activeTab === 'profile' ? 'bg-accent text-white text-white shadow-lg shadow-accent/20' : 'text-slate-500 hover:text-accent dark:hover:text-accent')}
            >
              <UserIcon className="w-4 h-4" />
              我
            </button>
            <button 
              onClick={() => setActiveTab('memory')}
              className={cn("px-6 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition-all", activeTab === 'memory' ? 'bg-accent text-white text-white shadow-lg shadow-accent/20' : 'text-slate-500 hover:text-accent dark:hover:text-accent')}
            >
              <Brain className="w-4 h-4" />
              AI记忆
            </button>
          </div>
          
          {!isFullScreen && (
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-slate-200/50 hover:bg-red-500/20 hover:text-red-500 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
              <AnimatePresence mode="popLayout">
                {activeTab === 'chat' && (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {/* Compact Top Bar */}
                    <div className={cn("px-4 py-2 flex items-center justify-between border-b text-xs font-bold uppercase tracking-wider relative", theme === 'dark' ? "bg-slate-800/60 border-white/5 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500")}>
                      <span className="flex items-center gap-2 text-accent">
                        {aiModel === 'gemini-3.1-pro-preview' ? <Brain className="w-4 h-4 text-purple-500" /> : <Zap className="w-4 h-4 text-yellow-500" />}
                        Gemini {aiModel === 'gemini-3.1-pro-preview' ? 'Pro' : 'Flash'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsBrainstormMode(!isBrainstormMode)}
                          className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5", isBrainstormMode ? "bg-purple-500 text-white" : "bg-black/5 hover:bg-black/10")}
                          title="辩论与头脑风暴模式"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isBrainstormMode ? '头脑风暴' : '个人单卡'}
                        </button>
                        <button 
                          onClick={clearChat}
                          title="清空上下文"
                          className="p-1.5 rounded-lg transition-colors bg-black/5 hover:bg-black/10 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setShowPromptSettings(!showPromptSettings)}
                          className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5", showPromptSettings ? "bg-accent text-white text-white" : "bg-black/5 hover:bg-black/10")}
                        >
                          <Settings2 className="w-4 h-4" />
                          设定
                        </button>
                        <button 
                          onClick={() => setIsAutoTTS(!isAutoTTS)}
                          className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5", isAutoTTS ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-black/5 hover:bg-black/10")}
                        >
                          {isAutoTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          TTS
                        </button>
                      </div>
                    </div>

                    {/* Settings Panel */}
                    <AnimatePresence>
                      {showPromptSettings && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className={cn("px-5 py-4 border-b overflow-hidden shadow-inner", theme === 'dark' ? "bg-slate-900/80 border-slate-700/50" : "bg-slate-50/80 border-slate-200")}
                        >
                          {!isBrainstormMode ? (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-black uppercase tracking-widest opacity-60">选择核心思维模式</label>
                                <label className="flex items-center gap-2 text-xs font-bold bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-lg cursor-pointer">
                                  <span className={cn(aiModel === 'gemini-3-flash-preview' ? 'text-accent' : 'text-slate-400')}>Flash (极速)</span>
                                  <button 
                                    onClick={() => setAiModel(aiModel === 'gemini-3.1-pro-preview' ? 'gemini-3-flash-preview' : 'gemini-3.1-pro-preview')}
                                    className={cn("w-8 h-4 rounded-full relative transition-colors", aiModel === 'gemini-3.1-pro-preview' ? 'bg-purple-500' : 'bg-accent text-white')}
                                  >
                                    <motion.div 
                                      layout 
                                      className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                                      initial={false}
                                      animate={{ left: aiModel === 'gemini-3.1-pro-preview' ? '1.125rem' : '0.125rem' }}
                                    />
                                  </button>
                                  <span className={cn(aiModel === 'gemini-3.1-pro-preview' ? 'text-purple-500' : 'text-slate-400')}>Pro (深度)</span>
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {PROMPTS_CONFIG.map(p => (
                                  <div 
                                    key={p.id}
                                    onClick={() => setPromptMode(p.id as any)}
                                className={cn(
                                  "cursor-pointer p-3 rounded-xl border transition-all flex items-start gap-3 relative overflow-hidden group",
                                  promptMode === p.id 
                                    ? p.bg + " border-transparent ring-2 ring-accent shadow-md"
                                    : theme === 'dark' 
                                      ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" 
                                      : "bg-white border-slate-200 hover:bg-slate-50 hover:shadow-sm"
                                )}
                              >
                                <div className={cn("p-2 rounded-lg shrink-0", promptMode === p.id ? "bg-white/50 dark:bg-black/20" : "bg-slate-100 dark:bg-slate-700")}>
                                  <p.icon className={cn("w-5 h-5", promptMode === p.id ? p.color : "text-slate-500 dark:text-slate-400")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn("font-bold text-sm tracking-wide truncate", promptMode === p.id ? p.color : "text-slate-700 dark:text-slate-200")}>{p.title}</h4>
                                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{p.desc}</p>
                                </div>
                                {promptMode === p.id && (
                                  <motion.div layoutId="active-indicator" className="absolute top-2 right-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <AnimatePresence>
                            {promptMode === 'custom' && (
                              <motion.textarea
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: '100px' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={cn(
                                  "w-full p-3 rounded-xl border text-xs resize-none outline-none transition-all leading-relaxed custom-scrollbar",
                                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-300 focus:border-accent" : "bg-white border-slate-300 text-slate-700 focus:border-accent shadow-inner"
                                )}
                                placeholder="输入你自定义的系统级指示 (System Instruction)..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                              />
                            )}
                          </AnimatePresence>
                            </>
                          ) : (
                            <div>
                               <div className="flex items-center justify-between mb-3">
                                 <label className="block text-xs font-black uppercase tracking-widest opacity-60 text-purple-500">挑选智囊团成员参与讨论</label>
                               </div>
                               <div className="grid grid-cols-2 gap-2 mb-2">
                                 {DEBATE_PERSONAS.map(p => (
                                    <div 
                                      key={p.id}
                                      onClick={() => setSelectedPersonas(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                                      className={cn(
                                        "cursor-pointer p-2 rounded-xl border transition-all flex items-center gap-2 relative overflow-hidden group",
                                        selectedPersonas.includes(p.id)
                                          ? "bg-purple-500/10 border-purple-500/50 shadow-md"
                                          : theme === 'dark' 
                                            ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" 
                                            : "bg-white border-slate-200 hover:bg-slate-50"
                                      )}
                                    >
                                      <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full bg-slate-200" />
                                      <div className="flex-1 min-w-0">
                                        <h4 className={cn("font-bold text-xs truncate", selectedPersonas.includes(p.id) ? "text-purple-500" : (theme === 'dark' ? "text-slate-200" : "text-slate-700"))}>{p.name}</h4>
                                        <p className="text-[10px] text-slate-500 truncate">{p.role}</p>
                                      </div>
                                      {selectedPersonas.includes(p.id) && (
                                        <div className="absolute top-1 right-1"><CheckCircle2 className="w-3 h-3 text-purple-500" /></div>
                                      )}
                                    </div>
                                 ))}
                               </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {messages.map(msg => {
                          if (msg.role === 'model' && msg.content === '' && isTyping) return null; // hide empty model messages when typing
                          
                          const persona = msg.personaId ? DEBATE_PERSONAS.find(p => p.id === msg.personaId) : null;

                          return (
                            <div key={msg.id} className={cn("flex flex-col group relative", msg.role === 'user' ? "items-end" : "items-start ml-2")}>
                              {persona && (
                                <div className="flex items-center gap-2 mb-2 ml-1">
                                  <img src={persona.avatar} alt={persona.name} className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm" />
                                  <span className={cn("text-xs font-bold", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>{persona.name}</span>
                                  <span className="text-[10px] text-slate-500">{persona.role}</span>
                                </div>
                              )}
                              <div className={cn(
                                "max-w-[85%] rounded-3xl p-5 shadow-sm relative",
                                msg.role === 'user' 
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm shadow-accent/20" 
                                  : theme === 'dark' 
                                    ? "bg-slate-800/80 backdrop-blur-md outline outline-1 outline-white/5 text-slate-200 rounded-bl-sm" 
                                    : "bg-white outline outline-1 outline-slate-200 text-slate-800 rounded-bl-sm shadow-md"
                              )}>
                                {msg.role === 'user' ? (
                                  <div className="flex flex-col gap-3">
                                    {msg.image && (
                                       <img src={msg.image} alt="User Upload" className="max-w-[200px] rounded-xl border border-white/20 shadow-sm" />
                                    )}
                                    <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">{msg.content}</p>
                                  </div>
                                ) : (
                                  <div className={cn("markdown-body text-[15px] leading-relaxed", theme === 'dark' ? "dark-markdown" : "")}>
                                    {msg.content === '' && isStreaming ? (
                                      <span className="flex gap-1 h-5 items-center">
                                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                      </span>
                                    ) : (
                                      <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{msg.content}</Markdown>
                                    )}
                                  </div>
                                )}
                                
                                {/* TTS Play Button for AI Messages */}
                                {msg.role === 'model' && msg.content && !isStreaming && (
                                  <button 
                                    onClick={() => playTTS(msg.content, msg.id)}
                                    className={cn(
                                      "absolute -right-12 top-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all",
                                      isPlayingId === msg.id ? "opacity-100 text-accent bg-accent/10 border border-accent/20" : "text-slate-400 hover:text-accent hover:bg-accent/10"
                                    )}
                                  >
                                    {isPlayingId === msg.id ? <Square className="w-5 h-5 fill-current animate-pulse" /> : <Play className="w-5 h-5 fill-current" />}
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 mt-2 opacity-60 font-medium tracking-wider">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                        {isTyping && (
                          <div className="flex items-start">
                            <div className={cn("rounded-3xl p-5 rounded-bl-sm", theme === 'dark' ? "bg-slate-800" : "bg-white border shadow-md flex items-center gap-3")}>
                              <div className="flex gap-1.5 pt-1">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-accent text-white" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-accent text-white" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-accent text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!isTyping && messages.length === 1 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {SUGGESTIONS.map(sug => (
                              <button
                                key={sug}
                                onClick={() => {
                                  setInputText(sug);
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[13px] font-medium transition-all shadow-sm border",
                                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-accent"
                                )}
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <div className={cn("p-4 border-t", theme === 'dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white/50")}>
                        {selectedImage && (
                          <div className="mb-3 relative w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 flex items-center justify-center">
                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                            <button 
                              onClick={() => setSelectedImage(null)}
                              className="absolute -top-2 -right-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-end gap-3">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "p-3.5 rounded-2xl transition-all border flex-shrink-0 mb-1",
                              theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-accent"
                            )}
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={toggleListen}
                            className={cn(
                              "p-3.5 rounded-2xl transition-all border flex-shrink-0 relative overflow-hidden mb-1",
                              isListening 
                                ? "bg-red-500 border-red-500 text-white animate-pulse shadow-xl shadow-red-500/30" 
                                : theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                          <div className={cn(
                            "flex-1 flex items-end rounded-2xl border transition-all overflow-hidden",
                            theme === 'dark' ? "bg-slate-800 border-slate-700 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent" : "bg-white border-slate-200 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent shadow-sm"
                          )}>
                            <textarea 
                              value={inputText}
                              onChange={e => setInputText(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder={isListening ? "正在聆听..." : "给导师发送消息..."}
                              className={cn(
                                "flex-1 max-h-32 min-h-[52px] py-3.5 px-4 resize-none outline-none text-[15px] font-medium custom-scrollbar bg-transparent",
                                theme === 'dark' ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
                              )}
                              rows={Math.min(4, Math.max(1, inputText.split('\n').length))}
                            />
                            <button 
                              onClick={handleSend}
                              disabled={(!inputText.trim() && !selectedImage) || isStreaming || isTyping}
                              className="p-3 mx-2 my-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-accent/20"
                            >
                              <Send className="w-5 h-5 ml-0.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'profile' && (
                    <motion.div 
                      key="profile"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="absolute inset-0 flex flex-col p-6 overflow-y-auto custom-scrollbar"
                    >
                      <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-accent/30 p-1 relative">
                          <img src={user?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1'} alt="Avatar" className="w-full h-full rounded-full bg-slate-200" />
                          <div className="absolute right-0 bottom-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center pointer-events-none">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <h3 className={cn("text-2xl font-black mt-4", theme === 'dark' ? "text-white" : "text-slate-900")}>{user?.name || '未登录用户'}</h3>
                        <p className="text-accent font-bold text-sm tracking-widest uppercase mt-1">LV.{user?.level || 1} {user?.role === 'teacher' ? '教师' : '探索者'}</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className={cn("text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                            <Bookmark className="w-4 h-4" /> 知识库同步
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className={cn("p-4 rounded-xl border flex flex-col items-center justify-center gap-2", theme === 'dark' ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100")}>
                              <span className="text-3xl font-black text-amber-500">12</span>
                              <span className="text-xs font-bold text-slate-500">已收藏知识点</span>
                            </div>
                            <div className={cn("p-4 rounded-xl border flex flex-col items-center justify-center gap-2", theme === 'dark' ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100")}>
                              <span className="text-3xl font-black text-purple-500">5</span>
                              <span className="text-xs font-bold text-slate-500">同步应用</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={cn("p-4 rounded-xl border flex items-center gap-4", theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100")}>
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Cloud className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <h5 className={cn("font-bold text-sm", theme === 'dark' ? "text-emerald-400" : "text-emerald-700")}>信息已全面同步</h5>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">聊天记录与数据已安全云端保存</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'memory' && (
                    <motion.div 
                      key="memory"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="absolute inset-0 p-8 overflow-auto custom-scrollbar"
                    >
                      <div className="flex flex-col items-center justify-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                          <Brain className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>AI 记忆库</h3>
                        <p className="text-slate-500 text-sm mt-2 text-center max-w-sm">我已经记住了关于你的以下信息，为你提供更个性化的学习体验。</p>
                      </div>

                      <div className="space-y-4">
                        <div className={cn("p-5 rounded-2xl border relative overflow-hidden", theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200")}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-accent text-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                          <h4 className="flex items-center gap-2 text-sm font-bold text-accent mb-2 whitespace-nowrap">
                            <UserIcon className="w-4 h-4" /> 基础属性
                          </h4>
                          <div className="flex flex-col gap-1">
                            <p className={cn("text-sm", theme === 'dark' ? "text-slate-300" : "text-slate-700")}><span className="opacity-50">称呼：</span>{user?.name || '未知'}</p>
                            <p className={cn("text-sm", theme === 'dark' ? "text-slate-300" : "text-slate-700")}><span className="opacity-50">角色：</span>{user?.role === 'teacher' ? '教师' : '学生'}</p>
                            <p className={cn("text-sm", theme === 'dark' ? "text-slate-300" : "text-slate-700")}><span className="opacity-50">学习等级：</span>LV.{user?.level || 1}</p>
                          </div>
                        </div>

                        <div className={cn("p-5 rounded-2xl border relative overflow-hidden", theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200")}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                          <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-500 mb-2 whitespace-nowrap">
                            <BookOpen className="w-4 h-4" /> 动态记忆点
                          </h4>
                          {aiMemories.length === 0 ? (
                            <p className="text-sm text-slate-500 italic py-2">暂无动态记忆记录。你可以对我说“记住我对某某感兴趣”，我会记录下来。</p>
                          ) : (
                            <ul className="space-y-3 mt-2">
                              {aiMemories.map(memory => (
                                <li key={memory.id} className={cn("text-sm flex items-start gap-2 justify-between p-2 rounded-lg transition-colors group", theme === 'dark' ? "hover:bg-slate-700/50" : "hover:bg-slate-100")}>
                                  <div className="flex items-start gap-2 max-w-[85%]">
                                    <Sparkles className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0 opacity-70" />
                                    <span className={cn(theme === 'dark' ? "text-slate-300" : "text-slate-700")}>{memory.fact}</span>
                                  </div>
                                  <button onClick={() => setAiMemories(prev => prev.filter(m => m.id !== memory.id))} className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-all p-1" title="删除">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        
                        <div className={cn("p-5 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 mt-8", theme === 'dark' ? "bg-slate-800/20 border-dashed border-slate-700" : "bg-slate-50 border-dashed border-slate-200")}>
                          <Sparkles className="w-6 h-6 text-slate-400" />
                          <p className="text-xs text-slate-500 max-w-xs">AI会在与你的持续对话中，不断提取并更新记忆点，以提供更好的伴学体验。</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
    </>
  );

  return (
    <>
      {/* Floating Action Button */}
      {!isFullScreen && !isOpen && (
        <div
          onPointerDown={handlePointerDown}
          className={cn(
            "fixed bottom-28 right-4 md:bottom-32 md:right-8 lg:bottom-10 lg:right-10 z-[100] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 touch-none",
            isDraggingBtn ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-110 active:scale-95",
            theme === 'dark' 
              ? "bg-slate-950 border-2" 
              : "text-white shadow-xl"
          )}
          style={{ 
            transform: `translate3d(${buttonPos.x}px, ${buttonPos.y}px, 0)`,
            borderColor: theme === 'dark' ? 'var(--accent, #3b82f6)' : 'transparent',
            backgroundColor: theme === 'dark' ? '' : 'var(--accent, #3b82f6)',
            boxShadow: theme === 'dark' ? '0 20px 25px -5px rgba(0,0,0,0.5)' : '0 20px 25px -5px var(--accent, #3b82f6), 0 8px 10px -6px var(--accent, #3b82f6)'
          }}
        >
          {theme === 'dark' && <div className="absolute inset-0 rounded-full opacity-20 animate-pulse" style={{ backgroundColor: 'var(--accent, #3b82f6)' }} />}
          <Sparkles className="w-8 h-8 absolute top-0.5 right-0.5 opacity-40 pointer-events-none text-white" />
          <MessageSquare className="w-6 h-6 z-10 pointer-events-none text-white" />
        </div>
      )}

      {/* Main Container */}
      {isFullScreen ? (
        <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-[#060810] flex flex-col items-center justify-center p-0 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "w-full h-full max-w-6xl max-h-[95vh] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border flex flex-col md:rounded-[2.5rem] overflow-hidden relative",
              theme === 'dark' ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
            )}
          >
            {/* Full screen Back Button */}
            <button 
              onClick={onClose}
              className={cn(
                "absolute top-6 right-6 z-50 p-3 rounded-full border transition-all flex items-center gap-2 group",
                theme === 'dark' 
                  ? "bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800" 
                  : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
              <span className="text-xs font-bold hidden md:inline">退出 AI 教练</span>
            </button>

           {innerContent}
          </motion.div>
        </div>
      ) : (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              drag
              dragConstraints={{ top: -500, left: -1000, right: 50, bottom: 50 }}
              dragElastic={0.1}
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed bottom-24 right-4 md:right-8 lg:bottom-8 z-[100] w-[450px] h-[700px] max-w-[calc(100vw-2rem)] max-h-[80vh] shadow-2xl border rounded-[2rem] flex flex-col overflow-hidden",
                theme === 'dark' ? "bg-slate-900/95 border-white/10 backdrop-blur-xl shadow-blue-900/20" : "bg-white/95 border-slate-200 backdrop-blur-xl shadow-accent/20"
              )}
            >
              {innerContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

