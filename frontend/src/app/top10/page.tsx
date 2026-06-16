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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-4">
        <div className="bg-emerald-500/10 p-3 rounded-xl">
          <TrendingUp className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Top 10 Ranked Stocks</h1>
          <p className="text-sm text-slate-400">
            Automated scoring rankings based on financial metrics, balance sheets, and cash flow calculations.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {topStocks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Award className="h-12 w-12 text-slate-700 mb-2" />
            <p className="text-sm">No recommended stocks found.</p>
            <p className="text-xs text-slate-600 mt-1">Run an agent analysis from the dashboard to populate rankings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase">
                  <th className="p-5">Rank</th>
                  <th className="p-5">Ticker</th>
                  <th className="p-5">Company Name</th>
                  <th className="p-5 text-center">Score</th>
                  <th className="p-5 text-center">Risk Assessment</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {topStocks.map((stock, index) => (
                  <tr key={stock.ticker} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-5 font-bold text-slate-400">#{index + 1}</td>
                    <td className="p-5 font-extrabold text-emerald-400">{stock.ticker}</td>
                    <td className="p-5 font-semibold text-slate-200">{stock.company_name}</td>
                    <td className="p-5 text-center font-bold text-slate-100">{stock.score} / 100</td>
                    <td className="p-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        stock.risk_level === "Low" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : stock.risk_level === "High"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {stock.risk_level}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => router.push(`/stocks/${stock.ticker}`)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg font-bold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
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
