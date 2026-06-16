"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Calendar, Shield, ExternalLink, BookOpen } from "lucide-react";

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-4">
        <div className="bg-blue-500/10 p-3 rounded-xl">
          <FileText className="h-8 w-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Research Reports</h1>
          <p className="text-sm text-slate-400">
            View generated natural language reports detailing analysis, financial health scores, and risk profiles.
          </p>
        </div>
      </div>

      {/* Grid of reports */}
      {reports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl h-80 flex flex-col items-center justify-center text-slate-500">
          <BookOpen className="h-12 w-12 text-slate-700 mb-2" />
          <p className="text-sm">No research reports currently available.</p>
          <p className="text-xs text-slate-600 mt-1">Run an agent analysis to generate reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div 
              key={report.ticker} 
              className="bg-slate-900 border border-slate-850 hover:border-slate-750 p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl font-extrabold text-white">{report.ticker}</span>
                    <h3 className="text-sm font-semibold text-slate-300 mt-0.5">{report.company_name}</h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      report.risk_level === "Low" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : report.risk_level === "High"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {report.risk_level} Risk
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-800/60">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Score</span>
                    <span className="text-lg font-bold text-white mt-0.5">{report.score} / 100</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{report.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => router.push(`/stocks/${report.ticker}`)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
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
