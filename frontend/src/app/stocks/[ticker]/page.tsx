"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  LineChart, 
  Line, 
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
  TrendingDown, 
  Activity, 
  FileText, 
  DollarSign, 
  Layers 
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

    // Fetch all stock data concurrently
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
        <p className="text-sm font-semibold">Gathering stock intelligence...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Stock Analysis Not Found</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          {error || `The ticker "${ticker}" has not been analyzed by the agent yet. You can search for a different ticker or trigger a run on the homepage.`}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs inline-flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  // Formatting helpers
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
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="text-xs text-slate-400 hover:text-white font-bold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go Back</span>
          </button>
          
          <div className="flex items-baseline space-x-3">
            <h1 className="text-3xl font-black text-white">{details.ticker}</h1>
            <h2 className="text-lg text-slate-400 font-medium">{details.company_name}</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Sector: {details.sector}</p>
        </div>

        {/* Real-time stats */}
        <div className="flex gap-6 bg-slate-900 border border-slate-850 p-5 rounded-2xl">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Latest Price</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">${details.latest_price?.toFixed(2)}</div>
          </div>
          <div className="border-l border-slate-800" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Market Cap</span>
            <div className="text-2xl font-black text-white mt-1">{formatMoney(details.market_cap)}</div>
          </div>
          {report && (
            <>
              <div className="border-l border-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Agent Score</span>
                <div className="text-2xl font-black text-blue-400 mt-1">{report.score} <span className="text-xs text-slate-500">/ 100</span></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Chart & Metrics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Price history Chart */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl">
            <h3 className="font-bold text-white text-base mb-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <span>Historical Performance (1 Year)</span>
            </h3>
            
            {history.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-600 font-medium text-sm">
                No price history chart available.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#4b5563" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      tick={{ fontSize: 10 }} 
                      domain={['auto', 'auto']}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f3f4f6' }}
                      labelClassName="text-slate-400 text-xs font-semibold"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Key Fundamentals Cards Grid */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">P/E Ratio</span>
                <p className="text-xl font-bold text-white mt-1">{metrics.pe_ratio?.toFixed(2) || "N/A"}</p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Revenue Growth (YoY)</span>
                <p className={`text-xl font-bold mt-1 ${
                  metrics.revenue_growth && metrics.revenue_growth > 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {formatPercent(metrics.revenue_growth)}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Net Profit Margin</span>
                <p className="text-xl font-bold text-white mt-1">{formatPercent(metrics.profit_margin)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Debt to Equity</span>
                <p className="text-xl font-bold text-white mt-1">{metrics.debt_to_equity?.toFixed(2) || "N/A"}</p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Free Cash Flow</span>
                <p className="text-xl font-bold text-white mt-1">{formatMoney(metrics.free_cashflow)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Level</span>
                <span className={`inline-block px-2.5 py-0.5 mt-1 rounded-full text-xs font-bold ${
                  report?.risk_level === "Low" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : report?.risk_level === "High"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {report?.risk_level || "Medium"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: AI generated Research Report */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col h-full justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base mb-4 flex items-center space-x-2 border-b border-slate-800 pb-3">
                <FileText className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>AI Investment Research Report</span>
              </h3>
              
              {report ? (
                <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line space-y-2 h-[420px] overflow-y-auto pr-2">
                  {report.report_text}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-slate-600 text-xs">
                  <p>AI Report has not been generated for this stock.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 italic mt-6 leading-relaxed">
              Disclaimer: This report is generated by an educational AI agent. It does not constitute formal financial advice.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
