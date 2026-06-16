"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, TrendingUp, ShieldAlert, Cpu, Layers } from "lucide-react";

interface StockAnalysis {
  ticker: string;
  company_name: string;
  score: number;
  risk_level: string;
}

export default function Home() {
  const [sectorInput, setSectorInput] = useState("");
  const [topStocks, setTopStocks] = useState<StockAnalysis[]>([]);
  const [stats, setStats] = useState({
    totalAnalyzed: 0,
    topScore: 0,
    topStockTicker: "N/A",
  });
  const [loading, setLoading] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch top recommendations
    fetch("http://localhost:8000/api/recommendations/top10")
      .then((res) => res.json())
      .then((data: StockAnalysis[]) => {
        setTopStocks(data);
        if (data.length > 0) {
          setStats({
            totalAnalyzed: data.length,
            topScore: data[0].score,
            topStockTicker: data[0].ticker,
          });
        }
      })
      .catch((err) => console.error("Error loading recommendations:", err));

    // Check if there is an active running task in the background
    fetch("http://localhost:8000/api/agent/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.task_id) {
          setActiveTaskId(data.task_id);
          localStorage.setItem("active_task_id", data.task_id.toString());
        } else {
          setActiveTaskId(null);
        }
      })
      .catch((err) => console.error("Error checking active task:", err));
  }, []);

  const triggerAnalysis = async (sectorOrTickers: string) => {
    if (!sectorOrTickers.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/agent/analyze?sector=${encodeURIComponent(sectorOrTickers)}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.task_id) {
        localStorage.setItem("active_task_id", data.task_id.toString());
        router.push("/agent");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Active Task Banner */}
      {activeTaskId && (
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/20 text-blue-400 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl glow-blue animate-pulse">
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 animate-spin text-blue-400" />
              <span>Research Agent Active</span>
            </h4>
            <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
              An autonomous analysis is running in the background, executing yfinance calculations and generating LangChain reports.
            </p>
          </div>
          <button
            onClick={() => router.push("/agent")}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all uppercase tracking-wider cursor-pointer"
          >
            Monitor Logs
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 glass-panel rounded-2xl glow-indigo">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent uppercase">
            AI Stock Analysis Workspace
          </h1>
          <p className="text-slate-400 text-xs font-medium max-w-2xl leading-relaxed">
            Trigger autonomous LangChain research agents to fetch financials, calculate scores, and generate investment reports using free endpoints and NVIDIA NIM LLMs.
          </p>
        </div>
        
        {/* Status Quick Widget */}
        <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800/80 px-5 py-3 rounded-2xl backdrop-blur">
          <div className="relative flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeTaskId ? "bg-blue-400" : "bg-emerald-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${activeTaskId ? "bg-blue-500" : "bg-emerald-500"}`}></span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider">
            <div className="text-slate-500">Agent Core</div>
            <div className={activeTaskId ? "text-blue-400" : "text-emerald-400"}>{activeTaskId ? "Analyzing..." : "Standby"}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Total Tracked</span>
            <h3 className="text-2xl font-black text-white">{stats.totalAnalyzed} Stocks</h3>
          </div>
          <Layers className="h-10 w-10 text-indigo-400 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20" />
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Highest Score</span>
            <h3 className="text-2xl font-black text-emerald-400">{stats.topScore} / 100</h3>
          </div>
          <TrendingUp className="h-10 w-10 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 glow-emerald" />
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Top Pick Stock</span>
            <h3 className="text-2xl font-black text-blue-450">{stats.topStockTicker}</h3>
          </div>
          <ShieldAlert className="h-10 w-10 text-blue-450 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20" />
        </div>
      </div>

      {/* Main Trigger Card & Quick Analysis List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Run Agent Control Panel */}
        <div className="lg:col-span-1 bg-slate-900/30 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between h-96 shadow-lg">
          <div className="space-y-2">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider border-b border-slate-900 pb-3">
              Launch Research Agent
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Select a sector preset or enter custom ticker symbols separated by commas. The agent will run screening and analysis automatically.
            </p>

            {/* Form */}
            <div className="pt-4 space-y-4">
              <input
                type="text"
                placeholder="Sector (e.g. tech) or symbols (e.g. AAPL, NVDA)"
                value={sectorInput}
                onChange={(e) => setSectorInput(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-xs uppercase font-semibold tracking-wider placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              
              {/* Presets */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSectorInput("tech")}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-800 transition-colors"
                >
                  Tech Sector
                </button>
                <button
                  onClick={() => setSectorInput("finance")}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-800 transition-colors"
                >
                  Finance Sector
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerAnalysis(sectorInput)}
            disabled={loading || !sectorInput}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-900 disabled:text-slate-650 text-slate-950 font-black rounded-xl flex items-center justify-center space-x-2 text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{loading ? "Initializing..." : "Start Research Agent"}</span>
          </button>
        </div>

        {/* Top Scored Stocks Table */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-900 p-6 rounded-2xl shadow-lg">
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wider mb-6 border-b border-slate-900 pb-3">
            Top Ranked Research Stocks
          </h3>
          
          {topStocks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-900 rounded-2xl p-6">
              <p className="text-xs font-semibold">No analysis reports generated yet.</p>
              <p className="text-[10px] text-slate-700 mt-1 uppercase tracking-wider font-bold">Use the command panel on the left to trigger the AI Agent.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-4">Ticker</th>
                    <th className="pb-4">Company Name</th>
                    <th className="pb-4 text-center">Score</th>
                    <th className="pb-4 text-center">Risk Level</th>
                    <th className="pb-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs text-slate-300">
                  {topStocks.map((stock) => (
                    <tr key={stock.ticker} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 font-black text-emerald-450">{stock.ticker}</td>
                      <td className="py-4 text-slate-200 font-semibold">{stock.company_name}</td>
                      <td className="py-4 text-center font-bold text-slate-100">{stock.score} / 100</td>
                      <td className="py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          stock.risk_level === "Low" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : stock.risk_level === "High"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {stock.risk_level}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => router.push(`/stocks/${stock.ticker}`)}
                          className="text-[10px] font-black uppercase tracking-wider text-blue-450 hover:underline cursor-pointer"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
