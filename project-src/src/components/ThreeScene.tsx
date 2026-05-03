import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Puzzle, Eraser, Layers, Camera, ArrowRight, ArrowLeft, RefreshCw, X, CheckCircle, Search, Tag, Eye, Sparkles, Brain, Send, Loader2, Bot, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAIResponse } from '../services/aiService';
import { CHINESE_SYSTEM_DATA } from '../data/chineseTopic';
import Markdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ThreeSceneProps {
  onBack?: () => void;
  onShowKnowledgeMap?: () => void;
  theme?: 'light' | 'dark';
}

const TABS = [
  { id: 'model', label: '3D文库', icon: Book },
  { id: 'wenyanai', label: '文言智脑', icon: Brain }
] as const;

type TabType = typeof TABS[number]['id'];

const poemText = "天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈剑号巨阙珠称夜光果珍李柰菜重芥姜海咸河淡鳞潜羽翔龙师火帝鸟官人皇始制文字乃服衣裳推位让国有虞陶唐吊民伐罪周发殷汤坐朝问道垂拱平章爱育黎首臣伏戎羌遐迩一体率宾归王鸣凤在竹白驹食场化被草木赖及万方盖此身发四大五常恭惟鞠养岂敢毁伤女慕贞洁男效才良知过必改得能莫忘罔谈彼短靡恃己长信使可覆器欲难量墨悲丝染诗赞羔羊";

export default function ThreeScene({ onBack, onShowKnowledgeMap, theme = 'light' }: ThreeSceneProps) {
  const [activeTab, setActiveTab] = useState<TabType>('model');
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ----- 3D Model State -----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [sceneSearchQuery, setSceneSearchQuery] = useState('');
  const spritesRef = useRef<{sprite: THREE.Sprite, title: string}[]>([]);

  useEffect(() => {
    const q = sceneSearchQuery.trim().toLowerCase();
    spritesRef.current.forEach(({ sprite, title }) => {
      if (!q) {
        sprite.material.opacity = 1;
        // @ts-ignore scale might have been modified, wait, let's just do opacity.
        return;
      }
      if (title.toLowerCase().includes(q)) {
        sprite.material.opacity = 1;
      } else {
        sprite.material.opacity = 0.15;
      }
    });
  }, [sceneSearchQuery]);

  // ----- 3D Model Setup -----
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? 0x0f172a : 0xF0F7FA);
    scene.fog = new THREE.FogExp2(theme === 'dark' ? 0x0f172a : 0xF0F7FA, 0.02);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 5, 20);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 5;
    controls.maxDistance = 30;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const scrollGroup = new THREE.Group();
    const splitGroup1 = new THREE.Group();
    const splitGroup2 = new THREE.Group();
    scrollGroup.add(splitGroup1);
    scrollGroup.add(splitGroup2);
    scene.add(scrollGroup);

    // Create a scrolling bamboo slip effect
    const radius = 6;
    const verticalSpacing = 0.8;
    
    const createCanvasTexture = (title: string, color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 120;
      const ctx = canvas.getContext('2d')!;
      
      // Background
      ctx.fillStyle = theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.roundRect(0, 0, 512, 120, 16);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.stroke();

      // Text
      ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 32px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Multiline if needed, but for now single
      const lines = title.length > 15 ? [title.slice(0, 15), title.slice(15)] : [title];
      if (lines.length === 1) {
          ctx.fillText(title, 256, 60);
      } else {
          ctx.fillText(lines[0], 256, 40);
          ctx.fillText(lines[1], 256, 80);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    // Flatten data to steps
    const stepsData: { title: string, color: string, isHeader: boolean }[] = [];
    CHINESE_SYSTEM_DATA.forEach((cat, catIdx) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const catColor = colors[catIdx % colors.length];
      
      stepsData.push({ title: `【核心】${cat.title}`, color: catColor, isHeader: true });
      cat.blocks.forEach(b => stepsData.push({ title: b.title, color: catColor, isHeader: false }));
      cat.steps.forEach(s => stepsData.push({ title: s, color: catColor, isHeader: false }));
    });

    let targetSplit = 0;
    let currentSplit = 0;

    const allSprites: {sprite: THREE.Sprite, title: string}[] = [];

    for (let i = 0; i < stepsData.length; i++) {
        const item = stepsData[i];
        const angle = i * 0.45;
        const y = (i - stepsData.length / 2) * verticalSpacing;
        
        const x = Math.cos(angle) * (radius + (item.isHeader ? 1 : 0));
        const z = Math.sin(angle) * (radius + (item.isHeader ? 1 : 0));
        
        const texture = createCanvasTexture(item.title, item.color);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        
        sprite.position.set(x, y, z);
        sprite.scale.set(item.isHeader ? 5 : 4, item.isHeader ? 1.2 : 1, 1);
        
        if (i % 2 === 0) {
            splitGroup1.add(sprite);
        } else {
            splitGroup2.add(sprite);
        }
        allSprites.push({ sprite, title: item.title });

        // Add connecting "ladder rungs"
        if (i > 1) {
            const prevItem = stepsData[i-2];
            if (prevItem) {
                const prevAngle = (i - 2) * 0.45;
                const prevY = (i - 2 - stepsData.length / 2) * verticalSpacing;
                const px = Math.cos(prevAngle) * radius;
                const pz = Math.sin(prevAngle) * radius;
                
                const points = [new THREE.Vector3(px, prevY, pz), new THREE.Vector3(x, y, z)];
                const geom = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.3 });
                const line = new THREE.Line(geom, lineMat);
                (i % 2 === 0 ? splitGroup1 : splitGroup2).add(line);
            }
        }
        
        // Connect across strands (DNA style)
        if (i > 0) {
            const prevAngle = (i - 1) * 0.45;
            const prevY = (i - 1 - stepsData.length / 2) * verticalSpacing;
            const px = Math.cos(prevAngle) * radius;
            const pz = Math.sin(prevAngle) * radius;
            
            const points = [new THREE.Vector3(px, prevY, pz), new THREE.Vector3(x, y, z)];
            const geom = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.1 });
            scene.add(new THREE.Line(geom, lineMat));
        }
    }

    spritesRef.current = allSprites;

    let animationFrameId: number;
    let currentAutoRotate = autoRotate;
    let currentIsSplit = isSplit;
    let introPhase = 0; // 0: rotating, 1: following
    let introAngle = 0;
    let startT = Date.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = (Date.now() - startT) / 1000;
      controls.update();

      if (currentAutoRotate) {
        scrollGroup.rotation.y += 0.003;
      }

      // Camera Intro and Follow
      if (introPhase === 0) {
          introAngle += 0.02;
          const r = 25;
          camera.position.x = Math.cos(introAngle) * r;
          camera.position.z = Math.sin(introAngle) * r;
          camera.position.y = 10 + Math.sin(time) * 5;
          camera.lookAt(0, 0, 0);
          
          if (introAngle > Math.PI * 2) {
              introPhase = 1;
              controls.enabled = true;
          }
      } else {
          // Following rotation and moving up
          if (currentAutoRotate) {
              // Sync camera rotation with scrollGroup
              // But we can just let it orbit if user wants.
              // If we force follow:
              camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.003);
              
              // Upward movement
              camera.position.y += 0.015;
              controls.target.y += 0.015;
              
              // Reset if too high
              if (camera.position.y > 20) {
                  camera.position.y = -20;
                  controls.target.y = -20;
              }
          }
      }

      targetSplit = currentIsSplit ? 1 : 0;
      currentSplit += (targetSplit - currentSplit) * 0.05;
      
      splitGroup1.position.x = -currentSplit * 5;
      splitGroup2.position.x = currentSplit * 5;

      renderer.render(scene, camera);
    };
    
    animate();

    const updateSize = () => {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || !entries.length) return;
      const entry = entries[entries.length - 1];
      const nw = entry.contentRect.width || (containerRef.current ? containerRef.current.clientWidth : 0);
      const nh = entry.contentRect.height || (containerRef.current ? containerRef.current.clientHeight : 0);
      
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh, false);
      }
    });
    
    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }
    
    const timerId = setTimeout(updateSize, 100);

    // Provide a way to update the closures from React state
    (canvasRef.current as any).updateState = (newAutoRotate: boolean, newIsSplit: boolean) => {
        currentAutoRotate = newAutoRotate;
        currentIsSplit = newIsSplit;
    };

    return () => {
      clearTimeout(timerId);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      
      scene.traverse((child) => {
        if (child instanceof THREE.Sprite) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.clear();
      renderer.dispose();
    };
  }, [theme]);

  useEffect(() => {
      if (canvasRef.current && (canvasRef.current as any).updateState) {
          (canvasRef.current as any).updateState(autoRotate, isSplit);
      }
  }, [autoRotate, isSplit]);



  // ----- AI Assistant State -----
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'model', content: string}[]>([
    { role: 'model', content: '吾乃文言智脑，通晓古文法、文史典故及历代文章精髓。有何古文疑难、通假字义、词类活用或语境解析，皆可问我。' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'wenyanai') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, activeTab]);

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiThinking) return;
    
    const userMsg = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiInput('');
    setIsAiThinking(true);

    try {
        const systemPrompt = `你是一个专门精通文言文（中国古典文学和古汉语）的人工智能助手。你需要帮助学生解析古文、解释文言虚词实词、指出通假字、分析词类活用、讲解历史背景和文化常识、以及帮他们避开考试中常见的“坑”（易错点）。你的语气可以是儒雅的，像一位古代饱学的学者，但解释必须清晰易懂，适合中学生理解。`;
        
        const historyText = aiMessages.map(m => `${m.role === 'user' ? '学生' : '你'}: ${m.content}`).join('\n');
        const prompt = `${systemPrompt}\n\n之前的对话日志:\n${historyText}\n\n学生的新问题: ${userMsg}\n\n请用你的角色回复:`;
        
        const text = await getAIResponse(prompt);
        setAiMessages(prev => [...prev, { role: 'model', content: text || "吾不知也，请再说一遍。" }]);
    } catch (error) {
        console.error("AI Error:", error);
        setAiMessages(prev => [...prev, { role: 'model', content: "网络阻塞，智脑正在冥想中，请稍后再试或联系老师。" }]);
    } finally {
        setIsAiThinking(false);
    }
  };


  return (
    <div className={cn("flex flex-col lg:flex-row w-full h-[100dvh] pt-14 lg:pt-0 max-w-[1440px] mx-auto p-2 lg:p-4 gap-4", theme === 'dark' ? 'text-slate-200' : 'text-slate-800')}>
        
      {/* Back Button */}
      <button 
          onClick={onBack}
          className={cn(
            "absolute top-6 left-6 z-[100] px-4 py-2.5 rounded-2xl backdrop-blur-xl border flex items-center gap-2 transition-all group active:scale-95 shadow-2xl hover:shadow-accent/20",
            theme === 'dark' 
              ? "bg-slate-900/60 border-slate-700/50 text-slate-200 hover:border-accent/40" 
              : "bg-white/80 border-slate-200 text-slate-800 hover:border-accent"
          )}
      >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">返回</span>
      </button>

      {/* Global Toasts */}
      <AnimatePresence>
          {toast && (
              <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn("fixed top-6 right-6 z-[9999] px-6 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-2", 
                      toast.type === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 
                      toast.type === 'error' ? 'bg-red-100 text-red-800 border-red-300' : 
                      'bg-blue-100 text-accent border-blue-300'
                  )}
              >
                  {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : toast.type === 'error' ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  {toast.msg}
              </motion.div>
          )}
      </AnimatePresence>

      {/* Left Col: 3D or Active Main Content */}
      <section className="w-full lg:w-[48%] flex flex-col gap-3 relative h-[40vh] lg:h-full lg:sticky top-4">
          <div className={cn("flex-1 rounded-[2rem] overflow-hidden relative shadow-premium border", theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')} ref={containerRef}>
              <canvas key={theme} ref={canvasRef} className={cn("w-full h-full block", activeTab !== 'model' && 'opacity-30 pointer-events-none')} />
              
              {/* Overlay controls for Model */}
              {activeTab === 'model' && (
                  <>
                      <div className="absolute top-4 right-4 z-10">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input 
                                  type="text"
                                  placeholder="搜索知识点..."
                                  value={sceneSearchQuery}
                                  onChange={(e) => setSceneSearchQuery(e.target.value)}
                                  className={cn(
                                      "w-48 border rounded-full py-2 pl-9 pr-3 text-sm outline-none transition-all shadow-xl backdrop-blur-md focus:w-64",
                                      theme === 'dark' 
                                          ? "bg-slate-900/60 border-slate-700/50 focus:border-accent/50 text-white placeholder:text-slate-400" 
                                          : "bg-white/60 border-slate-200/50 focus:border-accent text-slate-900 placeholder:text-slate-500"
                                  )}
                              />
                          </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 z-10">
                          <button onClick={() => setIsSplit(!isSplit)} className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-sm text-slate-700 dark:text-slate-200 shadow-xl transition-all">
                              {isSplit ? '闭合简牍' : '散开简牍'}
                          </button>
                          <button onClick={() => setAutoRotate(!autoRotate)} className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-sm text-slate-700 dark:text-slate-200 shadow-xl transition-all">
                              自动旋转: {autoRotate ? '开' : '关'}
                          </button>
                      </div>
                  </>
              )}

              {/* Decorative title in corner */}
               <div className="absolute top-24 left-6 font-serif text-2xl font-black opacity-30 text-slate-800 dark:text-slate-200 vertical-lr hidden md:block">
                   文脉长河
               </div>
          </div>
      </section>

      {/* Right Col: Tabs & Settings */}
      <section className="w-full lg:w-[52%] flex flex-col gap-4 overflow-y-auto custom-scrollbar lg:h-[calc(100vh-2rem)] pb-20 lg:pb-0">
          
          {/* Action Header */}
          <div className="flex items-center justify-between gap-4">
              <div className="flex-grow">
                  <button 
                      onClick={onShowKnowledgeMap}
                      className={cn(
                          "w-full p-4 rounded-2xl border flex items-center justify-between group transition-all",
                          "bg-gradient-to-r from-amber-500/10 to-red-600/10 hover:from-amber-500/20 hover:to-red-600/20",
                          theme === 'dark' ? "border-amber-500/30" : "border-amber-200 shadow-sm"
                      )}
                  >
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Sparkles className="text-white w-5 h-5" />
                          </div>
                          <div className="text-left">
                              <h3 className={cn("text-base font-black tracking-tight", theme === 'dark' ? "text-amber-400" : "text-amber-900")}>中考语文·全系统学习地图</h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chinese Knowledge System Map</p>
                          </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 p-2 rounded-2xl bg-slate-900/5 dark:bg-slate-800/50 backdrop-blur-md shrink-0 border border-slate-200 dark:border-slate-800">
              {TABS.map(t => (
                  <button 
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={cn("px-4 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all font-bold text-sm flex-1 justify-center", activeTab === t.id ? "bg-white dark:bg-slate-700 shadow-sm text-accent dark:text-accent" : "text-slate-500 hover:bg-black/5 dark:hover:bg-white/5")}
                  >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                  </button>
              ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Panel 1: Model Desc */}
            {activeTab === 'model' && (
                <motion.div key="model" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn("p-6 md:p-8 rounded-[2rem] shadow-premium border", theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100')}>
                    <h2 className="text-3xl font-black font-serif mb-4 text-accent dark:text-accent">语文核心知识天梯</h2>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                        左侧展现的是“旋转知识天梯”。这里集成了语文学习的五大核心系统：汉字、古诗文、文言文、阅读与写作。每个台阶都是进步的基石。<br/>相机将带你缓缓攀升，阅览中华文脉。
                    </p>
                    <div className="space-y-4">
                        {CHINESE_SYSTEM_DATA.map((cat, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={cn("w-2 h-6 rounded-full", idx === 0 ? 'bg-accent text-white' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-amber-500' : idx === 3 ? 'bg-rose-500' : 'bg-purple-500')} />
                                    <h3 className="font-bold text-lg">{cat.title}</h3>
                                </div>
                                <p className="text-xs text-slate-500 mb-2 italic">“{cat.principle}”</p>
                                <div className="flex flex-wrap gap-2">
                                    {cat.blocks.slice(0, 3).map((b, bi) => (
                                        <span key={bi} className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-700">{b.title}</span>
                                    ))}
                                    {cat.blocks.length > 3 && <span className="text-[10px] text-slate-400">...</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}



            {/* Panel 6: Wenyan AI */}
            {activeTab === 'wenyanai' && (
                <motion.div key="wenyanai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn("p-6 md:p-8 rounded-[2rem] shadow-premium border flex flex-col h-[600px] lg:h-[calc(100vh-10rem)]", theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100')}>
                     <div className="flex items-center gap-3 mb-6 shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black font-serif text-amber-600 dark:text-amber-500">文言智脑</h2>
                            <p className="text-xs text-slate-500 font-bold">专解古文实词虚词、句式结构、历史典故与易错大坑</p>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 custom-scrollbar">
                         {aiMessages.map((msg, i) => (
                             <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                 <div className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                     <div className={cn("w-8 h-8 shrink-0 rounded-full flex items-center justify-center", msg.role === 'user' ? "bg-accent text-white text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300")}>
                                         {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                     </div>
                                     <div className={cn("p-4 rounded-2xl text-sm leading-relaxed", msg.role === 'user' ? "bg-accent text-white text-white shadow-md rounded-tr-sm" : theme === 'dark' ? "bg-slate-700 text-slate-200 border border-slate-600 rounded-tl-sm" : "bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-sm")}>
                                         <div className="markdown-body">
                                             <Markdown>{msg.content}</Markdown>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                         {isAiThinking && (
                             <div className="flex w-full justify-start">
                                 <div className="flex gap-3 max-w-[85%]">
                                     <div className="w-8 h-8 shrink-0 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 flex items-center justify-center">
                                         <Loader2 className="w-4 h-4 animate-spin" />
                                     </div>
                                     <div className={cn("p-4 rounded-2xl text-sm rounded-tl-sm flex items-center", theme === 'dark' ? "bg-slate-700 text-slate-200 border border-slate-600" : "bg-slate-100 text-slate-800 border border-slate-200")}>
                                         <span className="animate-pulse">翻阅古籍中...</span>
                                     </div>
                                 </div>
                             </div>
                         )}
                         <div ref={chatEndRef} />
                     </div>

                     <div className="relative shrink-0 mt-auto">
                         <textarea
                             value={aiInput}
                             onChange={e => setAiInput(e.target.value)}
                             onKeyDown={e => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     sendAiMessage();
                                 }
                             }}
                             placeholder="试着问：'水落而石出者'中的'而'是什么用法？或者请解释一下'鸿门宴'的背景..."
                             className={cn("w-full h-28 pl-5 pr-16 py-4 rounded-2xl resize-none outline-none border focus:ring-2 transition-all block text-sm custom-scrollbar", theme === 'dark' ? "bg-slate-900 border-slate-700 focus:ring-amber-500/20 text-slate-200" : "bg-white border-slate-200 focus:ring-amber-500/20 text-slate-800 shadow-inner")}
                         />
                         <button 
                             disabled={!aiInput.trim() || isAiThinking}
                             onClick={sendAiMessage}
                             className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95"
                         >
                             <Send className="w-4 h-4 ml-0.5" />
                         </button>
                     </div>
                </motion.div>
            )}
          </AnimatePresence>

      </section>
    </div>
  );
}
