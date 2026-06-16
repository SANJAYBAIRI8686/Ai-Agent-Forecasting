"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Wifi, WifiOff } from "lucide-react";

export default function Header() {
  const [query, setQuery] = useState("");
  const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected">("disconnected");
  const router = useRouter();

  useEffect(() => {
    // Check connection to the FastAPI backend
    fetch("http://localhost:8000/api")
      .then((res) => {
        if (res.ok) setBackendStatus("connected");
      })
      .catch(() => setBackendStatus("disconnected"));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/stocks/${query.trim().toUpperCase()}`);
      setQuery("");
    }
  };

  return (
    <header className="h-20 border-b border-slate-900/60 bg-slate-950/20 backdrop-blur-md flex items-center justify-between px-8 text-slate-300 ml-64 z-20">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="relative w-96 group">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
        <input
          type="text"
          placeholder="Lookup ticker (e.g. AAPL, TSLA, NVDA)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-900/40 border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-900/90 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-300 shadow-inner"
        />
      </form>

      {/* Backend Status Indicator */}
      <div className="flex items-center space-x-3.5 text-xs font-bold uppercase tracking-wider">
        <span className="text-slate-500">Agent Core:</span>
        <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-[10px] font-black border transition-all duration-500 ${
          backendStatus === "connected" 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 glow-emerald" 
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        }`}>
          {backendStatus === "connected" ? (
            <>
              <Wifi className="h-3 w-3 animate-pulse" />
              <span>ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>OFFLINE</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
