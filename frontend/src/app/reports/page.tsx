"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Calendar, BookOpen, ExternalLink } from "lucide-react";

interface ReportSummary {
  ticker: string;
  company_name: string;
  score: number;
  risk_level: string;
  timestamp: string;
}

export default function ReportsList() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:8000/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((err) => console.error("Error loading reports:", err));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-8 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center space-x-4.5 shadow-lg">
        <div className="bg-indigo-500/10 p-3.5 border border-indigo-500/20 rounded-2xl glow-indigo">
          <FileText className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Research Reports Archive</h1>
          <p className="text-xs text-slate-450 font-medium leading-relaxed">
            Browse through generated analysis reports, financial scores, and risk profiles written by the LangChain research agent.
          </p>
        </div>
      </div>

      {/* Grid of reports */}
      {reports.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl h-80 flex flex-col items-center justify-center text-slate-650 p-6 shadow-2xl">
          <BookOpen className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">No research reports currently available.</p>
          <p className="text-[10px] text-slate-700 mt-1 uppercase tracking-widest font-black">Run an agent analysis to generate reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div 
              key={report.ticker} 
              className="bg-slate-900/20 border border-slate-900/60 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-850 hover:shadow-xl transition-all duration-300 relative overflow-hidden group shadow-md"
            >
              {/* Backlight shine */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/2 rounded-full blur-2xl group-hover:bg-indigo-500/5 transition-all duration-500" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-2xl font-black text-white tracking-wide">{report.ticker}</span>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-none">{report.company_name}</h3>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                    report.risk_level === "Low" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : report.risk_level === "High"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {report.risk_level} RISK
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/40 border border-slate-900/60 p-4 rounded-xl shadow-inner">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Score</span>
                    <span className="text-base font-extrabold text-white mt-1.5 leading-none">{report.score} <span className="text-[10px] text-slate-650 font-medium">/ 100</span></span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{report.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-900/60 z-10 relative">
                <button
                  onClick={() => router.push(`/stocks/${report.ticker}`)}
                  className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer hover:shadow-md"
                >
                  <span>Read Full Report</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
