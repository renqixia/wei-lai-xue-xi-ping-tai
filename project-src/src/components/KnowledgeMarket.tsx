import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Zap, 
  Clock, 
  Wallet, 
  BarChart3,
  ChevronRight,
  Info,
  AlertCircle,
  Sparkles,
  Award,
  Calendar,
  History,
  PieChart,
  ArrowRightLeft,
  X,
  Target,
  Activity,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { mathData } from '../data';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Stock {
  id: string;
  name: string;
  price: number;
  change: number;
  history: { time: string; open: number; close: number; high: number; low: number }[];
  category: string;
  volume: number;
  status: 'normal' | 'limit-up' | 'limit-down';
}

interface MarketEvent {
  id: string;
  title: string;
  description: string;
  type: 'bull' | 'bear';
  impact: number;
  timestamp: string;
}

interface KnowledgeMarketProps {
  theme: 'dark' | 'light';
  credits: number;
  setCredits: (credits: number) => void;
  masteryState: Record<string, any>;
  quizState: Record<string, any>;
  portfolio: Record<string, number>;
  setPortfolio: (p: any) => void;
  checkInHistory: string[];
  setCheckInHistory: (h: string[]) => void;
  marketIndex: number;
  setMarketIndex: (val: number) => void;
  onBack: () => void;
}

const KLineChart = ({ data, theme, height = 300 }: { data: any[], theme: string, height?: number }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    if (chartWidth <= 0) return;

    const x = d3.scaleBand()
      .domain(data.map(d => d.time))
      .range([0, chartWidth])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.low) * 0.99,
        d3.max(data, d => d.high) * 1.01
      ])
      .range([chartHeight, 0]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("stroke", theme === 'dark' ? "#1e293b" : "#e2e8f0")
      .attr("stroke-opacity", 0.1)
      .call(d3.axisLeft(y).tickSize(-chartWidth).tickFormat(() => ""));

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 5 === 0)))
      .attr("color", theme === 'dark' ? "#475569" : "#94a3b8")
      .selectAll("text")
      .style("font-size", "8px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", theme === 'dark' ? "#475569" : "#94a3b8")
      .selectAll("text")
      .style("font-size", "8px");

    // Candlesticks
    const candles = g.selectAll(".candle")
      .data(data)
      .enter().append("g")
      .attr("class", "candle");

    candles.append("line")
      .attr("x1", d => x(d.time)! + x.bandwidth() / 2)
      .attr("x2", d => x(d.time)! + x.bandwidth() / 2)
      .attr("y1", d => y(d.high))
      .attr("y2", d => y(d.low))
      .attr("stroke", d => d.close >= d.open ? "#ef4444" : "#22c55e")
      .attr("stroke-width", 1.5);

    candles.append("rect")
      .attr("x", d => x(d.time)!)
      .attr("y", d => y(Math.max(d.open, d.close)))
      .attr("width", x.bandwidth())
      .attr("height", d => Math.max(2, Math.abs(y(d.open) - y(d.close))))
      .attr("fill", d => d.close >= d.open ? "#ef4444" : "#22c55e")
      .attr("rx", 1);

    // MA5 Line
    const ma5Line = d3.line<any>()
      .x(d => x(d.time)! + x.bandwidth() / 2)
      .y((d, i) => {
        const slice = data.slice(Math.max(0, i - 4), i + 1);
        const avg = d3.mean(slice, s => s.close);
        return y(avg!);
      })
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", ma5Line);

    // MA10 Line
    const ma10Line = d3.line<any>()
      .x(d => x(d.time)! + x.bandwidth() / 2)
      .y((d, i) => {
        const slice = data.slice(Math.max(0, i - 9), i + 1);
        const avg = d3.mean(slice, s => s.close);
        return y(avg!);
      })
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 2)
      .attr("d", ma10Line);

  }, [data, theme, width, height]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
};

export default function KnowledgeMarket({ 
  theme, 
  credits, 
  setCredits, 
  masteryState, 
  quizState,
  portfolio,
  setPortfolio,
  checkInHistory,
  setCheckInHistory,
  marketIndex,
  setMarketIndex,
  onBack
}: KnowledgeMarketProps) {
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'history'>('market');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [indexChange, setIndexChange] = useState(0);

  // Generate stocks based on mathData
  const [marketSentiment, setMarketSentiment] = useState(65); // 0-100

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketSentiment(prev => {
        const delta = (Math.random() - 0.5) * 5;
        return Math.max(10, Math.min(90, prev + delta));
      });
      setIndexChange((Math.random() - 0.4) * 2); // Dynamic index change
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stocks = useMemo(() => {
    return mathData.nodes.map(node => {
      const mastery = masteryState[node.id] || 'unlearned';
      const quiz = quizState[node.id];
      
      let basePrice = 100 + (node.grade - 7) * 50 + (node.difficulty === 'hard' ? 100 : node.difficulty === 'medium' ? 50 : 0);
      
      let multiplier = 1;
      if (mastery === 'mastered') multiplier += 0.5;
      if (mastery === 'familiar') multiplier += 0.2;
      if (quiz?.correct) multiplier += 0.3;
      if (quiz?.answered && !quiz.correct) multiplier -= 0.2;

      const currentPrice = basePrice * multiplier * (marketIndex / 1000);
      const prevPrice = currentPrice / (1 + (Math.random() * 0.1 - 0.04));
      const change = ((currentPrice - prevPrice) / prevPrice) * 100;

      const history = Array.from({ length: 30 }).map((_, i) => {
        const time = `${i < 10 ? '0'+i : i}:00`;
        const open = currentPrice / (1 + (Math.random() * 0.05));
        const close = currentPrice * (1 + (Math.random() * 0.02 - 0.01));
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);
        return { time, open, close, high, low };
      });

      return {
        id: node.id,
        name: node.name,
        price: currentPrice,
        change,
        history,
        category: node.category,
        volume: Math.floor(Math.random() * 10000),
        status: 'normal'
      } as Stock;
    });
  }, [masteryState, quizState, marketIndex]);

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => s.name.includes(searchQuery));
  }, [stocks, searchQuery]);

  const marketEvents: MarketEvent[] = [
    { id: 'e1', title: '今日数学作业全对', description: '全班正确率突破 90%，带动大盘上涨。', type: 'bull', impact: 3.2, timestamp: '10:30' },
    { id: 'e2', title: '老师发布利好公告', description: '本周五数学作业减半，市场情绪高涨。', type: 'bull', impact: 5.0, timestamp: '09:15' },
    { id: 'e3', title: '连续 3 题做错', description: '部分知识点出现恐慌性下跌。', type: 'bear', impact: -2.1, timestamp: '14:20' },
    { id: 'e4', title: '帮同学讲懂一道题', description: '获得知识分红 20 金币，利好个人持仓。', type: 'bull', impact: 1.5, timestamp: '16:45' },
  ];

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return stocks.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [stocks, searchQuery]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTrade = (type: 'buy' | 'sell') => {
    if (!selectedStock) return;
    const cost = selectedStock.price * tradeAmount;
    
    if (type === 'buy') {
      if (credits >= cost) {
        setCredits(credits - cost);
        setPortfolio({ ...portfolio, [selectedStock.id]: (portfolio[selectedStock.id] || 0) + tradeAmount });
      }
    } else {
      if ((portfolio[selectedStock.id] || 0) >= tradeAmount) {
        setCredits(credits + cost);
        const newAmount = portfolio[selectedStock.id] - tradeAmount;
        if (newAmount === 0) {
          const { [selectedStock.id]: _, ...rest } = portfolio;
          setPortfolio(rest);
        } else {
          setPortfolio({ ...portfolio, [selectedStock.id]: newAmount });
        }
      }
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = checkInHistory.includes(today);

  const handleCheckIn = () => {
    if (!hasCheckedInToday) {
      setCredits(credits + 50);
      setCheckInHistory([...checkInHistory, today]);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden font-sans",
      "text-[var(--app-text)]"
    )} style={{ background: 'var(--app-bg-gradient, var(--app-bg))' }}>
      {/* Market Ticker */}
      <div className={cn(
        "h-10 flex items-center px-4 gap-8 overflow-hidden whitespace-nowrap border-b text-[10px] font-bold uppercase tracking-widest z-50",
        theme === 'dark' ? "bg-slate-900/80 border-white/10 backdrop-blur-md" : "bg-white/80 border-slate-200 backdrop-blur-md"
      )}>
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="w-3 h-3 text-accent" />
          <span className="text-slate-500">数学大盘指数:</span>
          <span className="text-accent font-black">{marketIndex.toFixed(2)}</span>
          <span className={cn("flex items-center", indexChange >= 0 ? "text-emerald-500" : "text-red-500")}>
            {indexChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {indexChange >= 0 ? '+' : ''}{indexChange}%
          </span>
        </div>
        <div className="flex gap-12 animate-marquee">
          {stocks.map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-slate-500">{s.name}</span>
              <span className={s.change >= 0 ? "text-emerald-500" : "text-red-500"}>
                {s.price.toFixed(1)} {s.change >= 0 ? '▲' : '▼'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden">
        {/* Left Sidebar - Market List */}
        <div className={cn(
          "w-80 flex flex-col border-r shrink-0",
          theme === 'dark' ? "border-slate-800" : "border-slate-200"
        )}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black tracking-tighter">知识市场</h2>
              <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-500/10 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                <div className={cn(
                  "w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs outline-none focus-within:ring-2 transition-all relative",
                  theme === 'dark' ? "bg-slate-900 border-slate-800 focus-within:ring-white/10" : "bg-white border-slate-200 focus-within:ring-black/5"
                )} style={{ borderColor: 'var(--accent, #3b82f6)44' }}>
                  <input 
                    type="text"
                    placeholder="搜索数学股..."
                    value={searchQuery || ''}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-transparent outline-none"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-500/10 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-slate-500" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "absolute top-full left-0 w-full mt-2 rounded-2xl border shadow-2xl z-[100] overflow-hidden",
                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                      )}
                    >
                      <div className="p-2 space-y-1">
                        {suggestions.map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedStock(s);
                              setSearchQuery(s.name);
                              setShowSuggestions(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group",
                              theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-accent text-white/10 rounded-lg group-hover:bg-accent text-white/20 transition-colors">
                                <Search className="w-3 h-3 text-accent" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs">{s.name}</h4>
                                <p className="text-[10px] text-slate-500">{s.category}</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* Market Sentiment Bar */}
            <div className={cn(
              "p-4 rounded-2xl border backdrop-blur-xl flex flex-col gap-3",
              theme === 'dark' ? "bg-slate-900/40 border-white/10" : "bg-white/40 border-slate-200"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={cn("w-4 h-4", marketSentiment > 50 ? "text-emerald-500" : "text-red-500")} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">市场情绪</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono font-bold",
                  marketSentiment > 50 ? "text-emerald-500" : "text-red-500"
                )}>{marketSentiment.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: `${marketSentiment}%` }}
                  className={cn(
                    "h-full transition-colors duration-1000",
                    marketSentiment > 50 ? "bg-emerald-500" : "bg-red-500"
                  )}
                />
              </div>
              <p className="text-[9px] text-slate-500 italic leading-tight">
                {marketSentiment > 70 ? "市场情绪高涨，知识点吸收率提升 15%" : 
                 marketSentiment < 30 ? "市场情绪低迷，建议进行基础巩固" : 
                 "市场运行平稳，适合按计划学习"}
              </p>
            </div>
            
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {['market', 'portfolio'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "flex-grow py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap px-4",
                    activeTab === tab 
                      ? "text-white shadow-lg" 
                      : theme === 'dark' ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                  )}
                  style={{ 
                    backgroundColor: activeTab === tab ? 'var(--accent)' : undefined,
                    boxShadow: activeTab === tab ? '0 10px 15px -3px var(--accent)44' : undefined
                  }}
                >
                  {tab === 'market' ? '股市行情' : '我的持仓'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {(activeTab === 'market' ? filteredStocks : stocks.filter(s => portfolio[s.id])).map(stock => (
              <button
                key={stock.id}
                onClick={() => setSelectedStock(stock)}
                className={cn(
                  "w-full p-5 flex items-center justify-between border-b transition-all text-left group",
                  theme === 'dark' ? "border-slate-800/50 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50",
                  selectedStock?.id === stock.id && (theme === 'dark' ? "bg-accent text-white/10 border-accent/30" : "bg-blue-50 border-blue-100")
                )}
              >
                <div>
                  <h4 className="font-bold text-sm group-hover:text-accent transition-colors">{stock.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{stock.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">{stock.price.toFixed(1)}</p>
                  <p className={cn(
                    "text-[10px] font-bold flex items-center justify-end",
                    stock.change >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    {stock.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(stock.change).toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center - Stock Detail */}
        <div className="flex-grow flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedStock ? (
              <motion.div
                key={selectedStock.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-grow flex flex-col p-8 overflow-y-auto custom-scrollbar"
              >
                {/* Stock Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-5xl font-black tracking-tighter">{selectedStock.name}</h2>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500"
                      )}>{selectedStock.id}</div>
                    </div>
                <div className={cn(
                  "flex items-center gap-6",
                  "text-[var(--accent, #3b82f6)]"
                )}>
                  <span className="text-6xl font-black tracking-tighter">{selectedStock.price.toFixed(2)}</span>
                  <div className={cn(
                    "flex flex-col font-bold",
                    selectedStock.change >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                        <span className="text-2xl flex items-center">
                          {selectedStock.change >= 0 ? <TrendingUp className="w-6 h-6 mr-1" /> : <TrendingDown className="w-6 h-6 mr-1" />}
                          {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                        </span>
                        <span className="text-xs opacity-60 uppercase tracking-widest">今日涨跌幅</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className={cn(
                      "p-4 rounded-2xl border transition-all hover:scale-105",
                      theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-50"
                    )}>
                      <History className="w-6 h-6 text-slate-500" />
                    </button>
                    <button className={cn(
                      "p-4 rounded-2xl border transition-all hover:scale-105",
                      theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-50"
                    )}>
                      <PieChart className="w-6 h-6 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* K-Line Chart */}
                <div className={cn(
                  "p-10 rounded-[3.5rem] border mb-10",
                  theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
                )}>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-6">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">分时 K 线图</h3>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-accent">
                          <div className="w-3 h-1 bg-accent text-white rounded-full" /> MA5
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500">
                          <div className="w-3 h-1 bg-amber-500 rounded-full" /> MA10
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 bg-slate-500/5 p-1 rounded-xl">
                      {['1H', '1D', '1W', '1M'].map(p => (
                        <button key={p} className={cn(
                          "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                          p === '1D' ? "bg-accent text-white text-white shadow-lg shadow-accent/20" : "text-slate-500 hover:bg-slate-500/10"
                        )}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full flex justify-center">
                    <KLineChart data={selectedStock.history} theme={theme} height={350} />
                  </div>
                </div>

                {/* Trading & Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className={cn(
                    "p-10 rounded-[3.5rem] border",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
                  )}>
                    <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                      <div className="p-2 bg-accent text-white/10 rounded-xl">
                        <ArrowRightLeft className="w-6 h-6 text-accent" />
                      </div>
                      交易面板
                    </h3>
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                          <span>交易数量 (股)</span>
                          <span>可用余额: <span className="text-accent">{credits.toFixed(1)}</span></span>
                        </div>
                        <div className="flex items-center gap-6 bg-slate-500/5 p-4 rounded-3xl border border-slate-500/10">
                          <button 
                            onClick={() => setTradeAmount(Math.max(1, tradeAmount - 1))}
                            className={cn(
                              "w-12 h-12 rounded-2xl border flex items-center justify-center font-bold transition-all",
                              theme === 'dark' ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"
                            )}
                          >-</button>
                          <input 
                            type="number" 
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                            className={cn(
                              "flex-grow text-center font-black text-3xl bg-transparent outline-none",
                              theme === 'dark' ? "text-white" : "text-slate-900"
                            )}
                          />
                          <button 
                            onClick={() => setTradeAmount(tradeAmount + 1)}
                            className={cn(
                              "w-12 h-12 rounded-2xl border flex items-center justify-center font-bold transition-all",
                              theme === 'dark' ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"
                            )}
                          >+</button>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleTrade('buy')}
                          className="flex-grow py-5 rounded-[2rem] bg-red-600 hover:bg-red-500 text-white font-black text-base transition-all shadow-xl shadow-red-500/25 hover:scale-[1.02] active:scale-95"
                        >
                          买入 (加仓)
                        </button>
                        <button 
                          onClick={() => handleTrade('sell')}
                          className="flex-grow py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base transition-all shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-95"
                        >
                          卖出 (清仓)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-10 rounded-[3.5rem] border",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
                  )}>
                    <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-xl">
                        <Info className="w-6 h-6 text-amber-500" />
                      </div>
                      知识资产详情
                    </h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-500/10">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">所属领域</span>
                        <span className="text-sm font-black">{selectedStock.category}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-slate-500/10">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">掌握状态</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          masteryState[selectedStock.id] === 'mastered' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                        )}>
                          {masteryState[selectedStock.id] === 'mastered' ? '已精通' : masteryState[selectedStock.id] === 'familiar' ? '已熟悉' : '未学习'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-slate-500/10">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">当前持仓</span>
                        <span className="text-lg font-black text-accent">{portfolio[selectedStock.id] || 0} 股</span>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          “每一个数学知识点都是你的资产。通过解题、作业和考试，你可以提升其价值。彻底掌握后清仓，可获得大量知识金币。”
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={cn(
                    "w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-premium",
                    theme === 'dark' ? "bg-slate-900" : "bg-white"
                  )}
                >
                  <BarChart3 className="w-12 h-12 text-accent" />
                </motion.div>
                <h2 className="text-3xl font-black mb-4 tracking-tighter">欢迎来到数学知识市场</h2>
                <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
                  在这里，每一个知识点都是一支股票。你的学习行为将直接决定市场的涨跌。选择左侧知识点开始交易。
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Events & Portfolio Summary */}
        <div className={cn(
          "w-80 flex flex-col border-l shrink-0",
          theme === 'dark' ? "border-slate-800" : "border-slate-200"
        )}>
          <div className="p-6 space-y-10 overflow-y-auto custom-scrollbar">
            {/* Wallet Summary */}
            <div 
              className={cn(
                "p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
              )}
              style={{ 
                background: `linear-gradient(135deg, var(--accent) 0%, #1e293b 100%)`,
                boxShadow: '0 25px 50px -12px var(--accent)44'
              }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet className="w-20 h-20" />
              </div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Wallet className="w-5 h-5 text-white/70" />
                </div>
                <button 
                  onClick={handleCheckIn}
                  disabled={hasCheckedInToday}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    hasCheckedInToday ? "bg-white/10 text-white/50" : "bg-white text-accent hover:scale-105 shadow-lg"
                  )}
                >
                  {hasCheckedInToday ? '今日已签到' : '每日签到'}
                </button>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">我的知识金币</p>
              <h3 className="text-4xl font-black mb-6 tracking-tighter">{credits.toFixed(1)}</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 p-2.5 rounded-2xl relative z-10">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>今日学习收益: <span className="text-emerald-300">+12.5%</span></span>
              </div>
            </div>

            {/* Market Events */}
            <div className="space-y-6">
              <h3 className="font-black text-sm flex items-center gap-2 uppercase tracking-widest text-slate-500">
                <Zap className="w-4 h-4 text-amber-500" />
                市场利好/利空事件
              </h3>
              <div className="space-y-4">
                {marketEvents.map(event => (
                  <motion.div 
                    key={event.id} 
                    whileHover={{ x: 5 }}
                    className={cn(
                      "p-5 rounded-3xl border transition-all cursor-pointer group",
                      theme === 'dark' ? "bg-slate-900/50 border-slate-800 hover:border-accent/30" : "bg-white border-slate-100 shadow-sm hover:border-accent/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-xs group-hover:text-accent transition-colors">{event.title}</h4>
                      <span className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded-lg",
                        event.type === 'bull' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {event.type === 'bull' ? '+' : ''}{event.impact}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-1.5 mt-3 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                      <Clock className="w-2.5 h-2.5" />
                      {event.timestamp}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Level Progress */}
            <div className="space-y-6">
              <h3 className="font-black text-sm flex items-center gap-2 uppercase tracking-widest text-slate-500">
                <Award className="w-4 h-4 text-accent" />
                数学股神之路
              </h3>
              <div className={cn(
                "p-6 rounded-3xl border relative overflow-hidden",
                theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">当前称号</p>
                    <h4 className="font-black text-accent text-lg tracking-tight">操盘手</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black">Lv.12</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-500/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  />
                </div>
                <p className="text-[8px] text-slate-500 mt-3 text-center font-bold uppercase tracking-widest">
                  距离 “基金经理” 还需 2400 经验
                </p>
              </div>
            </div>

            {/* Daily Summary Button */}
            <button className={cn(
              "w-full py-4 rounded-2xl border flex items-center justify-center gap-3 text-xs font-bold transition-all",
              theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-50"
            )}>
              <MessageSquare className="w-4 h-4 text-accent" />
              查看今日学习总结
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
