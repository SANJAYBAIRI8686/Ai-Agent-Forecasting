"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { 
  ArrowLeft, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";

interface StockDetails {
  ticker: string;
  company_name: string;
  sector: string;
  latest_price: number;
  market_cap: number;
}

interface HistoricalData {
  date: string;
  price: number;
}

interface FinancialMetrics {
  ticker: string;
  revenue_growth: number | null;
  profit_margin: number | null;
  pe_ratio: number | null;
  debt_to_equity: number | null;
  free_cashflow: number | null;
  market_cap: number | null;
}

interface AIReport {
  ticker: string;
  company_name: string;
  score: number;
  report_text: string;
  risk_level: string;
  timestamp: string;
}

export default function StockDetail() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker as string;

  const [details, setDetails] = useState<StockDetails | null>(null);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`http://localhost:8000/api/stocks/${ticker}`).then(res => res.ok ? res.json() : null),
      fetch(`http://localhost:8000/api/stocks/${ticker}/history`).then(res => res.ok ? res.json() : null),
      fetch(`http://localhost:8000/api/stocks/${ticker}/financials`).then(res => res.ok ? res.json() : null),
      fetch(`http://localhost:8000/api/stocks/${ticker}/report`).then(res => res.ok ? res.json() : null)
    ])
      .then(([detailsData, historyData, metricsData, reportData]) => {
        if (detailsData) setDetails(detailsData);
        if (historyData && historyData.history) setHistory(historyData.history);
        if (metricsData) setMetrics(metricsData);
        if (reportData) setReport(reportData);
      })
      .catch((err) => {
        console.error("Error fetching stock detail page data:", err);
        setError("Could not load stock data. Please make sure the stock has been analyzed first.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ticker]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Activity className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">Running data analytics...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto animate-bounce" />
        <h2 className="text-xl font-black text-white uppercase tracking-wider">Analysis Not Found</h2>
        <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto uppercase">
          {error || `The ticker "${ticker}" has not been analyzed by the agent yet. You can trigger an analysis run on the homepage.`}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-black rounded-xl text-xs uppercase tracking-wider inline-flex items-center space-x-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workspace</span>
        </button>
      </div>
    );
  }

  const formatMoney = (val: number | null) => {
    if (val === null) return "N/A";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const formatPercent = (val: number | null) => {
    if (val === null) return "N/A";
    return `${(val * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-6">
        <div className="space-y-2.5">
          <button
            onClick={() => router.back()}
            className="text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-widest flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go Back</span>
          </button>
          
          <div className="flex items-baseline space-x-4">
            <h1 className="text-4xl font-black text-white leading-none tracking-wide uppercase">{details.ticker}</h1>
            <h2 className="text-sm text-slate-450 font-bold uppercase tracking-wider">{details.company_name}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sector • {details.sector}</p>
        </div>

        {/* Real-time stats */}
        <div className="flex gap-6 bg-slate-900/20 border border-slate-900 p-6 rounded-2xl shadow-xl">
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Latest Close</span>
            <div className="text-2xl font-black text-emerald-450 mt-1.5 leading-none">${details.latest_price?.toFixed(2)}</div>
          </div>
          <div className="border-l border-slate-900" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Market Cap</span>
            <div className="text-2xl font-black text-white mt-1.5 leading-none">{formatMoney(details.market_cap)}</div>
          </div>
          {report && (
            <>
              <div className="border-l border-slate-900" />
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Agent Score</span>
                <div className="text-2xl font-black text-blue-450 mt-1.5 leading-none">
                  {report.score} <span className="text-xs text-slate-500 font-semibold">/ 100</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Chart & Metrics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Price history AreaChart */}
          <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl shadow-lg">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider mb-6 flex items-center space-x-2 border-b border-slate-900 pb-3">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              <span>Historical Price performance (1 Year)</span>
            </h3>
            
            {history.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-650 font-bold text-xs uppercase tracking-widest">
                No price history chart available.
              </div>
            ) : (
              <div className="h-72 w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      tick={{ fontSize: 9, fontWeight: 700 }} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#475569" 
                      tick={{ fontSize: 9, fontWeight: 700 }} 
                      domain={['auto', 'auto']}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}
                      itemStyle={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Key Fundamentals Cards Grid */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl shadow-sm space-y-1">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">P/E Ratio</span>
                <p className="text-xl font-black text-white">{metrics.pe_ratio?.toFixed(2) || "N/A"}</p>
              </div>
              <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl shadow-sm space-y-1">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Revenue Growth (YoY)</span>
                <p className={`text-xl font-black ${
                  metrics.revenue_growth && metrics.revenue_growth > 0 ? "text-emerald-450" : "text-rose-450"
                }`}>
                  {formatPercent(metrics.revenue_growth)}
                </p>
              </div>
              <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl shadow-sm space-y-1">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Net Profit Margin</span>
                <p className="text-xl font-black text-white">{formatPercent(metrics.profit_margin)}</p>
              </div>
              <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl shadow-sm space-y-1">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Debt to Equity</span>
                <p className="text-xl font-black text-white">{metrics.debt_to_equity?.toFixed(2) || "N/A"}</p>
              </div>
              <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl shadow-sm space-y-1">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Free Cash Flow</span>
                <p className="text-xl font-black text-white">{formatMoney(metrics.free_cashflow)}</p>
              </div>
              <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl shadow-sm space-y-1.5">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Risk Profile</span>
                <div>
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                    report?.risk_level === "Low" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : report?.risk_level === "High"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {report?.risk_level === "Low" && <CheckCircle className="h-3 w-3" />}
                    {report?.risk_level === "High" && <AlertTriangle className="h-3 w-3" />}
                    {report?.risk_level === "Medium" && <Info className="h-3 w-3" />}
                    <span>{report?.risk_level || "Medium"}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: AI generated Research Report */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between h-full shadow-lg relative overflow-hidden">
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-slate-900 pb-3 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>AI Investment Research Report</span>
              </h3>
              
              {report ? (
                <div className="text-[11px] text-slate-350 leading-relaxed font-sans whitespace-pre-line space-y-3 h-[420px] overflow-y-auto pr-2 select-text scrollbar-thin">
                  {report.report_text}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-slate-650 text-xs">
                  <p className="font-semibold uppercase tracking-wider">Report details empty.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-900 text-[9px] text-slate-550 font-bold uppercase tracking-wide italic mt-6 leading-relaxed">
              Disclaimer: Generated automatically by an AI Research agent using LangChain. Educational use only. No financial advice.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
