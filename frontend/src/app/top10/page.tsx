"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, ArrowRight, Award } from "lucide-react";

interface StockAnalysis {
  ticker: string;
  company_name: string;
  score: number;
  risk_level: string;
}

export default function Top10() {
  const [topStocks, setTopStocks] = useState<StockAnalysis[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:8000/api/recommendations/top10")
      .then((res) => res.json())
      .then((data: StockAnalysis[]) => setTopStocks(data))
      .catch((err) => console.error("Error loading top 10:", err));
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header card */}
      <div className="p-8 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center space-x-4.5 shadow-lg">
        <div className="bg-emerald-500/10 p-3.5 border border-emerald-500/20 rounded-2xl glow-emerald">
          <TrendingUp className="h-6 w-6 text-emerald-400 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Top 10 Recommendations</h1>
          <p className="text-xs text-slate-450 font-medium leading-relaxed">
            Automated ranking of the most profitable stocks evaluated by financial health scores and LLM risk reports.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        {topStocks.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-650 p-6">
            <Award className="h-12 w-12 text-slate-800 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider">No recommended stocks found.</p>
            <p className="text-[10px] text-slate-700 mt-1 uppercase tracking-widest font-black">Run an agent analysis from the dashboard to populate rankings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-5">Rank</th>
                  <th className="p-5">Ticker</th>
                  <th className="p-5">Company Name</th>
                  <th className="p-5 text-center">Score</th>
                  <th className="p-5 text-center">Risk Assessment</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/55 text-xs text-slate-350">
                {topStocks.map((stock, index) => (
                  <tr key={stock.ticker} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-5 font-black text-slate-500">#{index + 1}</td>
                    <td className="p-5 font-black text-emerald-450 text-sm">{stock.ticker}</td>
                    <td className="p-5 font-semibold text-slate-200">{stock.company_name}</td>
                    <td className="p-5 text-center font-bold text-slate-100">{stock.score} / 100</td>
                    <td className="p-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                        stock.risk_level === "Low" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : stock.risk_level === "High"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {stock.risk_level} RISK
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => router.push(`/stocks/${stock.ticker}`)}
                        className="text-[9px] font-black bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl uppercase tracking-wider inline-flex items-center space-x-1.5 transition-all cursor-pointer hover:translate-x-0.5"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="h-3.5 w-3.5" />
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
  );
}
