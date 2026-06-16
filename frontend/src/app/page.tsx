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
        // Save task id in local storage so other components can track it
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
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 animate-spin-slow text-blue-400" />
              <span>Research Agent Active</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">An autonomous screening and report generation task is running in the background.</p>
          </div>
          <button
            onClick={() => router.push("/agent")}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 cursor-pointer transition-colors"
          >
            Monitor Logs
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-panel rounded-2xl glow-blue">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI Stock Analysis Workspace
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl">
            Trigger autonomous research agents to fetch financials, calculate scores, and generate investment reports using free endpoints and NVIDIA NIM LLMs.
          </p>
        </div>
        
        {/* Status Quick Widget */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl">
          <Cpu className={`h-5 w-5 text-emerald-400 ${activeTaskId ? "animate-spin" : "animate-spin-slow"}`} />
          <div className="text-xs">
            <div className="font-semibold text-slate-200">Agent Core</div>
            <div className="text-emerald-400 font-medium">{activeTaskId ? "Analyzing..." : "Ready for task"}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Total Analyzed</span>
            <h3 className="text-2xl font-black text-white mt-1">{stats.totalAnalyzed} Stocks</h3>
          </div>
          <Layers className="h-10 w-10 text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl" />
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Top Financial Score</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.topScore} / 100</h3>
          </div>
          <TrendingUp className="h-10 w-10 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl animate-pulse" />
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Top Pick Stock</span>
            <h3 className="text-2xl font-black text-blue-400 mt-1">{stats.topStockTicker}</h3>
          </div>
          <ShieldAlert className="h-10 w-10 text-blue-400 bg-blue-500/10 p-2.5 rounded-xl" />
        </div>
      </div>

      {/* Main Trigger Card & Quick Analysis List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Run Agent Control Panel */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between h-80">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center space-x-2">
              <span>Launch Research Agent</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Select a sector preset or enter custom ticker symbols separated by commas.
            </p>

            {/* Form */}
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Sector (e.g. tech) or symbols (e.g. AAPL, NVDA)"
                value={sectorInput}
                onChange={(e) => setSectorInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              
              {/* Presets */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSectorInput("tech")}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Tech Preset
                </button>
                <button
                  onClick={() => setSectorInput("finance")}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Finance Preset
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerAnalysis(sectorInput)}
            disabled={loading || !sectorInput}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900 disabled:text-emerald-600 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 text-sm shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{loading ? "Initializing..." : "Start Research Agent"}</span>
          </button>
        </div>

        {/* Top Scored Stocks Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-lg mb-4">Top Ranked Research Stocks</h3>
          
          {topStocks.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm">No analysis reports generated yet.</p>
              <p className="text-xs mt-1">Use the panel on the left to trigger the AI Agent.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase">
                    <th className="pb-3">Ticker</th>
                    <th className="pb-3">Company Name</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3 text-center">Risk Level</th>
                    <th className="pb-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                  {topStocks.map((stock) => (
                    <tr key={stock.ticker} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-bold text-emerald-400">{stock.ticker}</td>
                      <td className="py-3 text-slate-200">{stock.company_name}</td>
                      <td className="py-3 text-center font-bold text-slate-100">{stock.score} / 100</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          stock.risk_level === "Low" 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : stock.risk_level === "High"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {stock.risk_level}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => router.push(`/stocks/${stock.ticker}`)}
                          className="text-xs text-blue-400 hover:underline font-semibold"
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
