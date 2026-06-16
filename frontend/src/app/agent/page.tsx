"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Terminal as TerminalIcon, Cpu, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export default function AgentStatus() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [currentStep, setCurrentStep] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = localStorage.getItem("active_task_id");
    if (id) {
      setTaskId(id);
    } else {
      // Query server for active task
      fetch("http://localhost:8000/api/agent/active")
        .then((res) => res.json())
        .then((data) => {
          if (data.task_id) {
            setTaskId(data.task_id.toString());
            localStorage.setItem("active_task_id", data.task_id.toString());
          }
        })
        .catch((err) => console.error("Error fetching active task:", err));
    }
  }, []);

  useEffect(() => {
    if (!taskId) return;

    let intervalId: NodeJS.Timeout;

    const pollStatus = () => {
      fetch(`http://localhost:8000/api/agent/status/${taskId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Task not found");
          return res.json();
        })
        .then((data) => {
          setStatus(data.status);
          setCurrentStep(data.current_step || "");
          
          if (data.logs) {
            try {
              setLogs(JSON.parse(data.logs));
            } catch {
              setLogs([data.logs]);
            }
          }

          if (data.status === "completed" || data.status === "failed") {
            clearInterval(intervalId);
          }
        })
        .catch((err) => {
          console.error("Error polling task status:", err);
          clearInterval(intervalId);
        });
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => clearInterval(intervalId);
  }, [taskId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearActiveTask = () => {
    localStorage.removeItem("active_task_id");
    setTaskId(null);
    setStatus("idle");
    setLogs([]);
    setCurrentStep("");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case "failed":
        return <AlertTriangle className="h-5 w-5 text-rose-450" />;
      default:
        return <Cpu className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStepProgress = () => {
    const steps = ["Screening Sector", "Fetch Fundamentals", "Scoring Financials", "AI Research Report"];
    
    return (
      <div className="flex justify-between items-center w-full max-w-3xl mx-auto py-8">
        {steps.map((step, index) => {
          let stepStatus = "pending";
          if (status === "completed") stepStatus = "completed";
          else if (status === "running") {
            const currentLower = currentStep.toLowerCase();
            if (index === 0 && currentLower.includes("screening")) stepStatus = "active";
            else if (index === 1 && currentLower.includes("fetching")) stepStatus = "active";
            else if (index === 2 && currentLower.includes("scoring")) stepStatus = "active";
            else if (index === 3 && currentLower.includes("generating")) stepStatus = "active";
            
            // Mark previous steps as completed
            if (index === 0 && (currentLower.includes("fetching") || currentLower.includes("scoring") || currentLower.includes("generating"))) stepStatus = "completed";
            if (index === 1 && (currentLower.includes("scoring") || currentLower.includes("generating"))) stepStatus = "completed";
            if (index === 2 && currentLower.includes("generating")) stepStatus = "completed";
          }

          return (
            <div key={step} className="flex flex-col items-center relative flex-1">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`absolute top-4 left-1/2 right-[-50%] h-[2px] z-0 transition-colors duration-500 ${
                  stepStatus === "completed" ? "bg-emerald-500/50" : "bg-slate-900"
                }`} />
              )}
              {/* Circle indicator */}
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all duration-500 border ${
                stepStatus === "completed" 
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30 glow-emerald" 
                  : stepStatus === "active"
                  ? "bg-blue-950/80 text-blue-400 border-blue-500/30 animate-pulse glow-blue"
                  : "bg-slate-950/40 text-slate-600 border-slate-900"
              }`}>
                {index + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider mt-3 transition-colors ${
                stepStatus === "active" ? "text-blue-400" : stepStatus === "completed" ? "text-emerald-400" : "text-slate-650"
              }`}>{step}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 bg-slate-900/40 border border-slate-900 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-950/80 p-3.5 border border-slate-900 rounded-2xl flex items-center justify-center">
            {getStatusIcon()}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Agent Monitor</h1>
            <p className="text-xs text-slate-450 font-medium leading-none">
              {status === "running" ? `Executing: ${currentStep}` : `Status: ${status}`}
            </p>
          </div>
        </div>
        
        {taskId && (status === "completed" || status === "failed") && (
          <button
            onClick={clearActiveTask}
            className="px-4.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Clear Monitor
          </button>
        )}
      </div>

      {taskId && getStepProgress()}

      {/* Terminal Screen */}
      <div className="bg-black/85 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none z-10 opacity-70" />
        
        {/* Terminal Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-900 flex items-center justify-between z-20 relative">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="h-4 w-4 text-slate-500" />
            <span className="text-[10px] font-bold font-mono text-slate-550 uppercase tracking-widest">agent_core_logger.sh</span>
          </div>
          <div className="flex space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
          </div>
        </div>

        {/* Terminal Screen */}
        <div className="p-6 font-mono text-xs text-slate-350 space-y-3.5 h-[450px] overflow-y-auto bg-black/40 z-20 relative select-text">
          {!taskId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-650">
              <p className="font-bold">No active agent process detected.</p>
              <Link 
                href="/" 
                className="mt-3 text-emerald-450 hover:underline font-extrabold uppercase tracking-widest text-[10px] bg-slate-950/80 px-4 py-2 border border-slate-900 rounded-xl"
              >
                Launch Research Agent &rarr;
              </Link>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-slate-600 animate-pulse">Initializing execution pipeline ...</div>
          ) : (
            <>
              {logs.map((log, i) => (
                <div key={i} className="flex items-start">
                  <span className="text-slate-650 mr-3.5 select-none font-bold">~</span>
                  <span className={
                    log.includes("Failed") || log.includes("Error") 
                      ? "text-rose-400 font-bold" 
                      : log.includes("Completed") || log.includes("Finished")
                      ? "text-emerald-400 font-black"
                      : log.includes("Scoring")
                      ? "text-amber-400"
                      : log.includes("LangChain")
                      ? "text-indigo-400 font-semibold"
                      : log.includes("Screener")
                      ? "text-blue-400 font-semibold"
                      : "text-slate-300"
                  }>
                    {log}
                  </span>
                </div>
              ))}
              {status === "running" && (
                <div className="flex items-center text-emerald-500 font-bold">
                  <span className="text-slate-650 mr-3.5 select-none">~</span>
                  <span className="cursor-blink">Listening for agent updates</span>
                </div>
              )}
              <div ref={logEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
