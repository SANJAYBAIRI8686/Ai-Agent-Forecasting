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

    // Poll immediately, then every 2 seconds
    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => clearInterval(intervalId);
  }, [taskId]);

  useEffect(() => {
    // Auto-scroll to bottom of terminal logs
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
        return <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-emerald-400" />;
      case "failed":
        return <AlertTriangle className="h-6 w-6 text-rose-400" />;
      default:
        return <Cpu className="h-6 w-6 text-slate-500" />;
    }
  };

  const getStepProgress = () => {
    const steps = ["Fetch Market Data", "Analyze Fundamentals", "Calculate Scoring", "LLM Risk Report"];
    
    return (
      <div className="flex justify-between items-center w-full max-w-2xl mx-auto py-6">
        {steps.map((step, index) => {
          let stepStatus = "pending";
          if (status === "completed") stepStatus = "completed";
          else if (status === "running") {
            const currentLower = currentStep.toLowerCase();
            if (index === 0 && (currentLower.includes("fetching") || currentLower.includes("starting"))) stepStatus = "active";
            else if (index === 1 && currentLower.includes("scoring")) stepStatus = "active";
            else if (index === 2 && currentLower.includes("ai")) stepStatus = "active";
            else if (index === 3 && currentLower.includes("completed")) stepStatus = "completed";
          }

          return (
            <div key={step} className="flex flex-col items-center relative flex-1">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-4 left-1/2 right-[-50%] h-0.5 bg-slate-800 z-0" />
              )}
              {/* Circle */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-colors ${
                stepStatus === "completed" 
                  ? "bg-emerald-500 text-slate-950" 
                  : stepStatus === "active"
                  ? "bg-blue-500 text-white animate-pulse"
                  : "bg-slate-800 text-slate-500"
              }`}>
                {index + 1}
              </div>
              <span className={`text-[10px] mt-2 font-semibold ${
                stepStatus === "active" ? "text-blue-400" : "text-slate-500"
              }`}>{step}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 p-3 rounded-xl">
            {getStatusIcon()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Agent Monitoring</h1>
            <p className="text-sm text-slate-400">
              {status === "running" ? `Currently executing: ${currentStep}` : `Agent state: ${status}`}
            </p>
          </div>
        </div>
        
        {taskId && (status === "completed" || status === "failed") && (
          <button
            onClick={clearActiveTask}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Clear Run
          </button>
        )}
      </div>

      {taskId && getStepProgress()}

      {/* Terminal logs */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-400">agent_execution_logs.sh</span>
          </div>
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* Terminal Screen */}
        <div className="p-6 font-mono text-xs text-slate-300 space-y-2.5 h-96 overflow-y-auto bg-black/60">
          {!taskId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <p>No active agent running.</p>
              <Link 
                href="/" 
                className="mt-2 text-emerald-400 hover:underline font-bold text-xs"
              >
                Go to Dashboard to trigger analysis &rarr;
              </Link>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-slate-600 animate-pulse">Initializing agent pipelines...</div>
          ) : (
            <>
              {logs.map((log, i) => (
                <div key={i} className="flex items-start">
                  <span className="text-slate-600 mr-2 selection:bg-none">&gt;</span>
                  <span className={
                    log.includes("Failed") || log.includes("Error") 
                      ? "text-rose-400" 
                      : log.includes("Completed") || log.includes("Finished")
                      ? "text-emerald-400 font-semibold"
                      : log.includes("Scoring")
                      ? "text-amber-400"
                      : "text-slate-300"
                  }>
                    {log}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
