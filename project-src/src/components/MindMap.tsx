import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lightbulb, 
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sparkles,
  Brain,
  Layers,
  Database,
  Search,
  CheckCircle2,
  Plus,
  Trophy,
  Heart,
  Loader2,
  Zap,
  RotateCw,
  Send
} from 'lucide-react';
import { getAIResponse } from '../services/aiService';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { mindMapData, MindMapNode } from '../data/mindMapData';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MindMapProps {
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const MindMap: React.FC<MindMapProps> = ({ onClose, theme = 'dark' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxBgRef = useRef<HTMLDivElement>(null);
  
  const [selectedNodeData, setSelectedNodeData] = useState<MindMapNode>(mindMapData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const zoomBehaviorRef = useRef<any>(null);

  // States
  const [learnedNodeIds, setLearnedNodeIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('math_learned_nodes');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [favoriteNodeIds, setFavoriteNodeIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('math_favorite_nodes');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MindMapNode[]>([]);
  
  const [customExamples, setCustomExamples] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem('math_custom_examples');
    return saved ? JSON.parse(saved) : {};
  });

  const [newQuestion, setNewQuestion] = useState({ q: '', answer: '', analysis: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // AI Generation State for Selected Node
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showGlobalAi, setShowGlobalAi] = useState(false);
  const [globalAiThinking, setGlobalAiThinking] = useState(false);
  const [globalAiResponse, setGlobalAiResponse] = useState<string | null>(null);

  // Calculate stats
  const getAllNodes = useCallback((node: MindMapNode): MindMapNode[] => {
    let result = [node];
    if (node.children) {
      node.children.forEach(c => {
        result = [...result, ...getAllNodes(c)];
      });
    }
    return result;
  }, []);

  const allNodes = useMemo(() => getAllNodes(mindMapData), [getAllNodes]);
  const totalNodes = allNodes.length;
  const progressPercent = Math.round((learnedNodeIds.size / totalNodes) * 100);

  useEffect(() => {
    localStorage.setItem('math_learned_nodes', JSON.stringify(Array.from(learnedNodeIds)));
  }, [learnedNodeIds]);

  useEffect(() => {
    localStorage.setItem('math_favorite_nodes', JSON.stringify(Array.from(favoriteNodeIds)));
  }, [favoriteNodeIds]);

  useEffect(() => {
    localStorage.setItem('math_custom_examples', JSON.stringify(customExamples));
  }, [customExamples]);

  const toggleLearned = (nodeId: string) => {
    setLearnedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const toggleFavorite = (nodeId: string) => {
    setFavoriteNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = allNodes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      n.content?.toLowerCase().includes(q)
    ).slice(0, 5);
    setSearchResults(filtered);
  }, [searchQuery, allNodes]);

  const addQuestion = (nodeId: string) => {
    if (!newQuestion.q || !newQuestion.answer) return;
    const item = { ...newQuestion, id: `custom-${Date.now()}`, isCustom: true };
    setCustomExamples(prev => ({
      ...prev,
      [nodeId]: [...(prev[nodeId] || []), item]
    }));
    setNewQuestion({ q: '', answer: '', analysis: '' });
    setShowAddForm(false);
  };

  const generateAIInsight = async (customQuestion?: string) => {
    if (!selectedNodeData) return;
    
    setIsGeneratingAi(true);
    try {
      const prompt = `你是一个专业的初中数学 AI 伴学导师。当前学生正在学习知识点：『${selectedNodeData.name}』。
该知识点的核心内容是：${selectedNodeData.content || "尚无描述"}。

请针对这个知识点提供以下深度的『神经元洞察』：
1. **考点陷阱**：列出1-2个考试中学生最容易犯错的细节或思维误区。
2. **高维推演**：如果题目变难，通常会如何变形？（例如结合其他知识点，如实数或方程）。
3. **思维模型**：提供一个可以直接套用的解题思维模型或口诀。

${customQuestion ? `\n\n【用户追加提出的深度追问】：\n${customQuestion}\n请优先且详细地解答这个追加问题，并保持整体风格一致。` : ""}

请注意：
- 使用结构化的 Markdown 格式（有序列表、粗体）。
- 语气要温和、简洁且富有启发性。
- 禁止长篇大论，每个要点控制在 3 句话以内。`;

      const text = await getAIResponse(prompt);
      
      setAiInsights(prev => ({ 
        ...prev, 
        [selectedNodeData.id]: customQuestion ? (prev[selectedNodeData.id] + "\n\n---\n\n" + text) : text 
      }));
    } catch (error) {
      console.error("AI Insight failed:", error);
      const fallbackContent = `【AI思考指南：${selectedNodeData.name}】
1. 常见陷阱：考场上极易弄错前置条件。
2. 高阶变式：注重【数形结合】的思想转换。
3. 速算技巧：尝试特殊值验证。`;
      setAiInsights(prev => ({ ...prev, [selectedNodeData.id]: fallbackContent }));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const d3Initialized = useRef(false);
  const simulationRef = useRef<any>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const svg = d3.select(svgRef.current);

    if (d3Initialized.current) {
      // Colors and dark mode updates
      svg.selectAll(".node rect")
        .attr("fill", (d: any) => {
          const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
          if (isMatch) return "#eab308"; // amber-500 for matching search
          if (learnedNodeIds.has(d.data.id)) return "#10b981";
          if (d.depth === 0) return "#3b82f6";
          if (d.depth === 1) return "#2563eb";
          return theme === 'dark' ? "#1e293b" : "#e2e8f0";
        })
        .attr("stroke", (d: any) => {
          const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
          if (isMatch) return "#fde047"; // yellow-300
          if (learnedNodeIds.has(d.data.id)) return "#34d399";
          return d.depth === 0 ? "#93c5fd" : (theme === 'dark' ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)");
        })
        .attr("stroke-width", (d: any) => {
          const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
          if (isMatch) return d.depth === 0 ? 5 : 3;
          return d.depth === 0 ? 3 : 1.5;
        });

      svg.selectAll(".node text")
        .attr("fill", theme === 'dark' ? "#f8fafc" : "#0f172a")
        .style("text-shadow", theme === 'dark' ? "0 0 15px rgba(59,130,246,0.5)" : "none");

      svg.selectAll(".link-flow")
        .attr("stroke", theme === 'dark' ? "rgba(59, 130, 246, 0.6)" : "rgba(59, 130, 246, 0.4)");
      return;
    }

    d3Initialized.current = true;
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Deep Node Glow (Deeper 3D effect)
    const filter = defs.append("filter")
      .attr("id", "node-glow")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%");
    filter.append("feGaussianBlur").attr("stdDeviation", "10").attr("result", "blur1");
    filter.append("feGaussianBlur").attr("stdDeviation", "5").attr("result", "blur2");
    filter.append("feFlood").attr("flood-color", "#3b82f6").attr("flood-opacity", "0.4").attr("result", "color");
    filter.append("feComposite").attr("in", "color").attr("in2", "blur1").attr("operator", "in").attr("result", "glow1");
    filter.append("feComposite").attr("in", "color").attr("in2", "blur2").attr("operator", "in").attr("result", "glow2");
    
    const mergeGlow = filter.append("feMerge");
    mergeGlow.append("feMergeNode").attr("in", "glow1");
    mergeGlow.append("feMergeNode").attr("in", "glow2");
    mergeGlow.append("feMergeNode").attr("in", "SourceGraphic");

    const linkGradient = defs.append("linearGradient")
      .attr("id", "link-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.6);
    linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "#8b5cf6").attr("stop-opacity", 0.05);

    const root = d3.hierarchy(mindMapData);
    const nodesData = root.descendants();
    const linksData = root.links();
    
    // Set unique IDs to prevent crashes in forceLink
    nodesData.forEach((d: any, i) => { d.id = d.data.id || `node_${i}`; });

    const g = svg.append("g");

    // Adaptive separation algorithm based on width (Breathing area)
    const adaptiveXSpacing = Math.max(300, width / 4);

    // Physics Force Layout
    const simulation = d3.forceSimulation(nodesData as any)
      .force("link", d3.forceLink(linksData).id((d: any) => d.id).distance((d: any) => d.target.depth * 30 + 100).strength(0.8))
      .force("charge", d3.forceManyBody().strength((d: any) => d.depth === 0 ? -2000 : -500).distanceMax(800))
      .force("collide", d3.forceCollide().radius((d: any) => d.depth === 0 ? 80 : (d.depth === 1 ? 50 : 35)).strength(0.9))
      .force("x", d3.forceX((d: any) => d.depth * adaptiveXSpacing).strength(1.2)) // Keeps layers distinct
      .force("y", d3.forceY(height / 2).strength(0.06));

    simulationRef.current = simulation;

    // Link Stream Effects (Dynamic energy beams)
    const linksGroup = g.selectAll(".link-group")
      .data(linksData)
      .enter()
      .append("g")
      .attr("class", "link-group");

    // Base thick path
    const linkPath = linksGroup.append("path")
      .attr("class", "link-bg")
      .attr("fill", "none")
      .attr("stroke", "url(#link-gradient)")
      .attr("stroke-width", (d: any) => Math.max(1.5, 6 - d.source.depth * 1.5))
      .style("opacity", 0.4);

    // Energy flow path
    const flowPath = linksGroup.append("path")
      .attr("class", "link-flow")
      .attr("fill", "none")
      .attr("stroke", theme === 'dark' ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.6)")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "5, 40") // Longer gaps for 'items passing' effect
      .style("filter", "url(#node-glow)");

    // Animate flow path
    flowPath.append("animate")
      .attr("attributeName", "stroke-dashoffset")
      .attr("from", "45")
      .attr("to", "0")
      .attr("dur", "1.5s")
      .attr("repeatCount", "indefinite");

    // Drag behavior to allow interactive bouncing
    const drag = d3.drag()
      .on("start", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const nodes = g.selectAll(".node")
      .data(nodesData)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(drag as any)
      .on("click", (event, d) => {
        setSelectedNodeData(d.data);
        setIsModalOpen(true);
        event.stopPropagation();
      })
      .style("cursor", "pointer");

    // Sub-clusters background ring to make it look like a "system"
    nodes.filter((d: any) => d.depth === 1)
      .append("circle")
      .attr("r", 100)
      .attr("fill", "rgba(59, 130, 246, 0.02)")
      .attr("stroke", "rgba(59, 130, 246, 0.1)")
      .attr("stroke-dasharray", "4, 8");

    // Depth-of-field pulse ring for core nodes
    nodes.filter((d: any) => d.depth === 0)
      .append("circle")
      .attr("r", 50)
      .attr("fill", "transparent")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .style("opacity", 0.5)
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", "50; 80; 50")
      .attr("dur", "4s")
      .attr("repeatCount", "indefinite");

    nodes.filter((d: any) => d.depth === 0)
      .append("animate")
      .attr("attributeName", "opacity")
      .attr("values", "1; 0.3; 1")
      .attr("dur", "4s")
      .attr("repeatCount", "indefinite");

    // Main Node Core
    nodes.append("rect")
      .attr("x", (d: any) => d.depth === 0 ? -30 : -18)
      .attr("y", (d: any) => d.depth === 0 ? -30 : -18)
      .attr("width", (d: any) => d.depth === 0 ? 60 : 36)
      .attr("height", (d: any) => d.depth === 0 ? 60 : 36)
      .attr("rx", (d: any) => d.depth === 0 ? 20 : 12)
      .attr("fill", (d: any) => {
        const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (isMatch) return "#eab308";
        if (learnedNodeIds.has(d.data.id)) return "#10b981";
        if (d.depth === 0) return "#3b82f6";
        if (d.depth === 1) return "#2563eb";
        return theme === 'dark' ? "#1e293b" : "#e2e8f0";
      })
      .attr("stroke", (d: any) => {
        const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (isMatch) return "#fde047";
        if (learnedNodeIds.has(d.data.id)) return "#34d399";
        return d.depth === 0 ? "#93c5fd" : (theme === 'dark' ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)");
      })
      .attr("stroke-width", (d: any) => {
        const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (isMatch) return d.depth === 0 ? 5 : 3;
        return d.depth === 0 ? 3 : 1.5;
      })
      .attr("filter", theme === 'dark' ? "url(#node-glow)" : "none");

    // Labels
    nodes.append("text")
      .attr("dy", "0.35em")
      .attr("x", (d: any) => d.children ? -45 : 30) // Root has children on right, standard d3 hierarchy layout means root is left. Oh wait, my x force pushes depth further right. So root is left. Children are right.
      .attr("text-anchor", (d: any) => d.depth === 0 ? "end" : "start") // Actually we want text on the right usually
      .text((d: any) => d.data.name)
      .attr("fill", theme === 'dark' ? "#f8fafc" : "#0f172a")
      .style("font-size", (d: any) => d.depth === 0 ? "26px" : d.depth === 1 ? "18px" : "15px")
      .style("font-weight", (d: any) => d.depth === 0 ? "900" : "800")
      .style("letter-spacing", "0.05em")
      .style("text-shadow", theme === 'dark' ? "0 0 20px rgba(59,130,246,0.8)" : "none");

    // D3 Tick
    simulation.on("tick", () => {
      // Bezier curve paths like dendrites connecting neurons
      const lineGenerator = d3.linkHorizontal<any, any>()
        .x((d: any) => d.x)
        .y((d: any) => d.y);
        
      linkPath.attr("d", lineGenerator);
      flowPath.attr("d", lineGenerator);
      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom and Space Parallax
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomScale(event.transform.k);
        // Parallax effect on background grid
        if (parallaxBgRef.current) {
          // Move background slower than foreground
          parallaxBgRef.current.style.transform = `translate(${event.transform.x * 0.15}px, ${event.transform.y * 0.15}px) scale(${1 + (event.transform.k - 1) * 0.1})`;
        }
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom as any);

    // Initial view focusing around the center logic
    const initialScale = Math.min(0.65, width / 1800);
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(width * 0.15, height / 2).scale(initialScale));

    return () => {
      simulation.stop();
    };
  }, [theme, learnedNodeIds, searchQuery]);


  const handleZoom = (direction: 'in' | 'out' | 'center') => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    if (direction === 'center') {
      svg.transition().duration(750)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(width * 0.15, height / 2).scale(0.65));
    } else {
      const factor = direction === 'in' ? 1.3 : 0.7;
      svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, factor);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col overflow-hidden select-none font-sans",
        theme === 'dark' ? "bg-[#030612] text-slate-100" : "bg-slate-50 text-slate-900"
      )}
    >
      {/* 3D Deep Parallax Space */}
      <div className="absolute inset-[-50%] overflow-hidden pointer-events-none">
        <div 
          ref={parallaxBgRef}
          className="absolute inset-[0%] transition-transform duration-75 ease-out opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            transformOrigin: '0 0'
          }}
        />
      </div>
      
      {/* Dynamic Nebulas / Glows */}
      <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", theme === 'dark' ? "mix-blend-screen opacity-70" : "mix-blend-multiply opacity-30")}>
        <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-accent text-white/20 blur-[180px] rounded-full animate-pulse duration-[12s]" />
        <div className="absolute top-[20%] -right-[20%] w-[70%] h-[70%] bg-indigo-600/20 blur-[180px] rounded-full animate-pulse duration-[15s]" />
        <div className="absolute -bottom-[30%] left-[20%] w-[60%] h-[60%] bg-purple-600/20 blur-[180px] rounded-full animate-pulse duration-[10s]" />
      </div>

      <header className={cn("relative z-[60] h-20 border-b flex items-center justify-between px-8 shadow-2xl backdrop-blur-3xl", theme === 'dark' ? "bg-slate-950/40 border-white/5" : "bg-white/40 border-slate-200")}>
        <div className="flex items-center gap-8">
          <button 
            onClick={onClose}
            className={cn("flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all border border-transparent group", theme === 'dark' ? "hover:bg-white/10 hover:border-white/10" : "hover:bg-slate-100 hover:border-slate-200 text-slate-700")}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-wide">退出重力场</span>
          </button>
          
          <div className={cn("h-8 w-px", theme === 'dark' ? "bg-white/10" : "bg-slate-200")} />
          
          <div className="flex items-center gap-5">
            <div className="p-3 bg-accent text-white/10 rounded-2xl border border-accent/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none uppercase drop-shadow-md">流光思维宇宙</h1>
              <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                <div className={cn("h-1.5 w-32 rounded-full overflow-hidden", theme === 'dark' ? "bg-slate-800" : "bg-slate-200")}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-accent text-white shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  />
                </div>
                <span className="text-[10px] font-black text-accent font-mono italic">{progressPercent}% SYNCED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-lg px-12 relative group">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
            <input 
              type="text"
              placeholder="跨宇宙搜索核心考点与网络模型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full border rounded-2xl py-3 pl-14 pr-4 text-sm outline-none transition-all shadow-inner",
                theme === 'dark' 
                  ? "bg-black/40 border-white/10 focus:bg-black/60 focus:border-accent/50 text-white placeholder:text-slate-600" 
                  : "bg-white/40 border-slate-200 focus:bg-white focus:border-accent text-slate-900 placeholder:text-slate-400"
              )}
            />
            
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn("absolute top-full left-0 right-0 mt-3 border rounded-2xl shadow-2xl overflow-hidden z-[70] backdrop-blur-3xl", theme === 'dark' ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200")}
                >
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        setSelectedNodeData(result);
                        setIsModalOpen(true);
                        setSearchQuery('');
                      }}
                      className={cn("w-full px-6 py-4 flex items-start gap-4 transition-colors border-b last:border-0 text-left", theme === 'dark' ? "hover:bg-accent text-white/10 border-white/5" : "hover:bg-blue-50 border-slate-100")}
                    >
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-accent text-white/10 border border-accent/20 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <div className={cn("text-sm font-bold mb-0.5", theme === 'dark' ? "text-white" : "text-slate-800")}>{result.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 uppercase tracking-tight italic">
                          引力点跳转 · {result.content?.slice(0, 20) || '详情检索'}
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={cn("flex items-center gap-1 p-1.5 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-white/50 border-slate-200")}>
            <button onClick={() => handleZoom('out')} className={cn("p-2 rounded-xl transition-colors", theme === 'dark' ? "hover:bg-white/10" : "hover:bg-slate-100")}><ZoomOut className={cn("w-4 h-4", theme === 'dark' ? "text-slate-300" : "text-slate-600")} /></button>
            <div className={cn("px-4 min-w-[3.5rem] text-center border-x", theme === 'dark' ? "border-white/10" : "border-slate-200")}>
              <span className="text-[10px] font-black text-accent font-mono italic">{Math.round(zoomScale * 100)}%</span>
            </div>
            <button onClick={() => handleZoom('in')} className={cn("p-2 rounded-xl transition-colors", theme === 'dark' ? "hover:bg-white/10" : "hover:bg-slate-100")}><ZoomIn className={cn("w-4 h-4", theme === 'dark' ? "text-slate-300" : "text-slate-600")} /></button>
            <button onClick={() => handleZoom('center')} className="ml-1 p-2 bg-accent text-white hover:bg-accent text-white rounded-xl transition-colors text-white shadow-lg shadow-accent/20"><Maximize className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="flex-1 relative cursor-grab active:cursor-grabbing"
        >
          <svg ref={svgRef} className="w-full h-full relative z-[10]" />
          
          <div className="absolute bottom-8 left-8 flex gap-6 z-[20] pointer-events-none">
            <div className={cn("px-5 py-2.5 border rounded-full backdrop-blur-xl flex items-center gap-3 shadow-2xl", theme === 'dark' ? "bg-black/50 border-white/5" : "bg-white/50 border-slate-200")}>
              <div className="w-2.5 h-2.5 rounded-full bg-accent text-white animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none mt-px", theme === 'dark' ? "text-white" : "text-slate-700")}>引力引擎在线</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isModalOpen && selectedNodeData && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={cn(
                  "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[450px] h-[700px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col overflow-hidden rounded-[2rem] border backdrop-blur-3xl transition-all duration-300",
                  theme === 'dark' 
                    ? "bg-[#030612]/95 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] shadow-blue-900/20" 
                    : "bg-white/95 border-slate-200 shadow-2xl shadow-accent/20"
                )}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={cn(
                    "absolute top-6 right-6 z-[80] p-2 rounded-full border transition-all hover:scale-105",
                    theme === 'dark' ? "bg-slate-800 border-white/10 text-slate-400 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
          {/* Subtle glowing edge to blend the junction */}
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
          
          <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
            <div className="space-y-10">
              <header>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl flex items-center justify-center border border-accent/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent text-white/10 animate-pulse" />
                    <Layers className="w-7 h-7 text-accent relative z-10" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                </div>
                
                <h2 className={cn("text-4xl font-black tracking-tight mb-6 leading-tight drop-shadow-md", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  {selectedNodeData.name}
                </h2>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => toggleLearned(selectedNodeData.id)}
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          learnedNodeIds.has(selectedNodeData.id) 
                            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                            : theme === 'dark' 
                              ? "bg-black/40 text-slate-400 border border-white/10 hover:border-accent/50 hover:bg-accent text-white/10"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:border-accent hover:bg-blue-50 hover:text-accent"
                        )}
                      >
                        {learnedNodeIds.has(selectedNodeData.id) ? (
                          <><CheckCircle2 className="w-4 h-4" /> 能量核心融合</>
                        ) : (
                          <><div className="w-3 h-3 rounded-full border-[2.5px] border-slate-500" /> 未激活核心</>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => toggleFavorite(selectedNodeData.id)}
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          favoriteNodeIds.has(selectedNodeData.id) 
                            ? "bg-rose-500/20 text-rose-500 border border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.2)]" 
                            : theme === 'dark'
                              ? "bg-black/40 text-slate-400 border border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                        )}
                      >
                        <Heart className={cn("w-4 h-4 transition-transform", favoriteNodeIds.has(selectedNodeData.id) && "fill-rose-400 scale-110")} />
                        {favoriteNodeIds.has(selectedNodeData.id) ? "取消固定坐标" : "固定关键坐标"}
                      </button>
                    </div>
                  </header>

                  {/* Math AI Compass - Synchronized Intelligent Assistant */}
                  <div className={cn("border rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl transition-all duration-500", theme === 'dark' ? "bg-gradient-to-br from-[#0b0c1b]/90 to-[#1e1b4b]/90 border-accent/30" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200")}>
                    {/* Dynamic Background Effects */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent text-white/10 blur-[80px] group-hover:bg-accent text-white/20 transition-all rounded-full" />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:rotate-12", theme === 'dark' ? "bg-accent text-white shadow-accent/20" : "bg-accent text-white shadow-accent/20")}>
                            <Brain className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                        </div>
                        <div>
                          <h4 className={cn("text-base font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>数学 AI 全能导师</h4>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent opacity-80">知识系统深度同步中</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => generateAIInsight()}
                          disabled={isGeneratingAi}
                          className={cn(
                            "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
                            theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white border border-white/10" : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
                          )}
                        >
                          <RotateCw className={cn("w-3.5 h-3.5", isGeneratingAi && "animate-spin")} />
                          重构解析
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10 min-h-[120px]">
                      {isGeneratingAi ? (
                        <div className="flex flex-col items-center justify-center py-12 text-accent/80 space-y-6">
                          <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin" />
                            <Sparkles className="absolute -top-3 -right-3 w-5 h-5 text-yellow-500 animate-bounce" />
                          </div>
                          <div className="text-center space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black block">Quantum Computing Math Matrix...</span>
                            <p className="text-xs italic opacity-60">正在为『{selectedNodeData.name}』生成专属学习路线与避坑指南</p>
                          </div>
                        </div>
                      ) : aiInsights[selectedNodeData.id] ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                          <div className={cn("text-sm font-medium leading-loose whitespace-pre-wrap markdown-body p-6 rounded-2xl border", theme === 'dark' ? "text-slate-200 bg-black/40 border-white/5 dark-markdown" : "text-slate-800 bg-white/60 border-indigo-100")}>
                            <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{aiInsights[selectedNodeData.id]}</Markdown>
                          </div>
                          
                          {/* Interactive Section */}
                          <div className="pt-4 space-y-4">
                            <div className="flex items-center gap-2 opacity-60">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-current" />
                              <span className="text-[10px] font-black uppercase tracking-widest">向伴学导师发起深度追问</span>
                              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-current" />
                            </div>
                            
                            <div className="relative group">
                              <input 
                                type="text"
                                placeholder={`不懂就问：比如“如何通过平行线证明三角形内角和？”`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                      generateAIInsight(val);
                                      e.currentTarget.value = "";
                                    }
                                  }
                                }}
                                className={cn(
                                  "w-full h-14 pl-6 pr-14 rounded-2xl text-xs font-bold border outline-none transition-all",
                                  theme === 'dark' 
                                    ? "bg-black/60 border-white/10 text-white focus:border-accent focus:ring-4 focus:ring-accent/10" 
                                    : "bg-white border-blue-100 text-slate-800 focus:border-accent focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                )}
                              />
                              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-accent text-white hover:bg-accent text-white text-white rounded-xl transition-all shadow-lg shadow-accent/20">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 space-y-6">
                           <div className={cn("text-sm italic font-medium text-center px-10 leading-loose", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                             尚未激活此节点的 AI 智能指南针。伴学导师将根据当前知识点，为你同步生成高阶解析、中考命题趋势及解题模型。
                           </div>
                           <button 
                            onClick={() => generateAIInsight()}
                            className="group flex flex-col items-center gap-4 transition-all"
                           >
                            <div className="w-20 h-20 rounded-3xl bg-accent text-white flex items-center justify-center shadow-[0_10px_30px_rgba(59,130,246,0.5)] transform transition-transform group-hover:scale-110 group-hover:rotate-6">
                               <Sparkles className="w-10 h-10 text-white animate-pulse" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">点击唤醒 AI 伴学大脑</span>
                           </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedNodeData.type === 'leaf-practice' && (
                    <div className="animate-in slide-in-from-bottom-6 duration-700">
                      <div className="flex justify-between items-end mb-6">
                        <h3 className={cn("text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3", theme === 'dark' ? "text-white" : "text-slate-900")}>
                          <Trophy className="w-5 h-5 text-amber-500" />
                          实战演金区
                        </h3>
                        <button 
                          onClick={() => setShowAddForm(!showAddForm)}
                          className={cn("flex items-center gap-2 px-4 py-2 hover:bg-accent text-white hover:text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg", 
                            theme === 'dark' ? "bg-accent text-white/10 border border-accent/20 text-accent" : "bg-blue-50 border border-blue-200 text-accent"
                          )}
                        >
                          <Plus className="w-3.5 h-3.5" /> 注入错题
                        </button>
                      </div>

                      <AnimatePresence>
                        {showAddForm && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn("border rounded-3xl overflow-hidden mb-8 shadow-2xl", theme === 'dark' ? "bg-[#0a0f1d] border-accent/30" : "bg-white border-blue-200")}
                          >
                            <div className="p-6 space-y-5">
                              <textarea 
                                value={newQuestion.q}
                                onChange={e => setNewQuestion({...newQuestion, q: e.target.value})}
                                className={cn("w-full border rounded-2xl p-5 text-sm focus:border-accent outline-none transition-all", theme === 'dark' ? "bg-black/40 border-white/5 text-white focus:bg-black/60 placeholder:text-slate-600" : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400")}
                                placeholder="输入题目干货..."
                                rows={3}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                  value={newQuestion.answer}
                                  onChange={e => setNewQuestion({...newQuestion, answer: e.target.value})}
                                  className={cn("w-full border rounded-2xl px-5 py-4 text-sm focus:border-accent outline-none transition-all", theme === 'dark' ? "bg-black/40 border-white/5 text-white focus:bg-black/60 placeholder:text-slate-600" : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400")}
                                  placeholder="唯一解或答案"
                                />
                                <input 
                                  value={newQuestion.analysis}
                                  onChange={e => setNewQuestion({...newQuestion, analysis: e.target.value})}
                                  className={cn("w-full border rounded-2xl px-5 py-4 text-sm focus:border-accent outline-none transition-all", theme === 'dark' ? "bg-black/40 border-white/5 text-white focus:bg-black/60 placeholder:text-slate-600" : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400")}
                                  placeholder="思维链条 (逻辑解析)"
                                />
                              </div>
                              <div className="flex gap-4 pt-2">
                                <button 
                                  onClick={() => addQuestion(selectedNodeData.id)}
                                  className="flex-1 py-4 bg-accent text-white hover:bg-accent text-white text-white rounded-2xl text-sm font-black tracking-wide transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                >
                                  录入神经元
                                </button>
                                <button 
                                  onClick={() => setShowAddForm(false)}
                                  className={cn("px-8 py-4 rounded-2xl text-sm font-black tracking-wide transition-all", theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600")}
                                >
                                  废弃
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-6">
                        {[
                          ...(selectedNodeData.examples || []),
                          ...(customExamples[selectedNodeData.id] || [])
                        ].map((ex, i) => (
                           <div key={ex.id || i} className={cn("backdrop-blur-md border rounded-3xl overflow-hidden group", theme === 'dark' ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200")}>
                              <div className="p-8">
                                <div className="flex items-center gap-3 mb-5">
                                  <div className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-[0.1em] border uppercase",
                                    ex.isCustom ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : 
                                      theme === 'dark' ? "bg-slate-800 text-slate-300 border-white/10" : "bg-slate-100 text-slate-500 border-slate-200"
                                  )}>
                                    {ex.isCustom ? '用户错误特征向量' : `典型构造 O${i+1}`}
                                  </div>
                                </div>
                                <p className={cn("text-xl font-bold leading-relaxed", theme === 'dark' ? "text-white" : "text-slate-800")}>{ex.q}</p>
                              </div>
                              
                              <div className={cn("mx-2 mb-2 p-6 rounded-2xl border space-y-4 shadow-inner", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-100")}>
                                <RevealAnswer answer={ex.answer} analysis={ex.analysis} theme={theme} />
                              </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type !== 'leaf-practice' && selectedNodeData.content && (
                    <div className={cn("p-8 rounded-3xl border relative overflow-hidden group shadow-lg", theme === 'dark' ? "bg-accent text-white/5 border-accent/10" : "bg-blue-50 border-blue-100")}>
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-accent text-white/80 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                      <div className="flex items-center gap-3 mb-4">
                        <Database className="w-5 h-5 text-accent" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">标准结构释义</h4>
                      </div>
                      <p className={cn("text-lg font-bold leading-relaxed", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>
                        {selectedNodeData.content}
                      </p>
                    </div>
                  )}

                  {selectedNodeData.type !== 'leaf-practice' && selectedNodeData.tips && selectedNodeData.tips.length > 0 && (
                    <div className="grid gap-4 mt-8">
                      {selectedNodeData.tips.map((tip, i) => (
                        <div key={i} className={cn("flex gap-5 p-6 border rounded-3xl group shadow-md transition-all", theme === 'dark' ? "bg-[#16130b] border-amber-500/20 hover:shadow-amber-500/5" : "bg-amber-50 border-amber-200 hover:shadow-amber-500/10")}>
                          <div className={cn("shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border", theme === 'dark' ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/10" : "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200")}>
                            <Lightbulb className="w-6 h-6 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                          </div>
                          <div className="pt-1">
                            <h5 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-2", theme === 'dark' ? "text-amber-500/70" : "text-amber-600")}>致命误区 / 关键提醒</h5>
                            <p className={cn("text-sm font-bold leading-relaxed", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>{tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

// Component for revealing answers gracefully
const RevealAnswer = ({ answer, analysis, theme = 'dark' }: { answer: string, analysis: string, theme?: 'light' | 'dark' }) => {
  const [revealed, setRevealed] = useState(false);
  
  if (!revealed) {
    return (
      <button 
        onClick={() => setRevealed(true)}
        className={cn("w-full py-6 border rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-3 tracking-widest uppercase hover:shadow-lg", theme === 'dark' ? "bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800")}
      >
        <ZoomIn className="w-5 h-5" /> 破解加密封印 (查阅解析)
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="space-y-3">
         <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
           <Brain className="w-4 h-4" /> 计算拓扑展开
         </div>
         <p className={cn("text-[15px] font-medium leading-relaxed p-5 rounded-2xl", theme === 'dark' ? "text-slate-300 bg-black/20" : "text-slate-700 bg-white shadow-sm border border-slate-100")}>{analysis}</p>
      </div>
      <div className={cn("p-5 border rounded-2xl flex items-center justify-between shadow-inner mt-4", theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-px">终端收敛态 (答案)</span>
         <span className={cn("text-2xl font-black tracking-widest", theme === 'dark' ? "text-white" : "text-emerald-700")}>{answer}</span>
      </div>
    </motion.div>
  );
};
