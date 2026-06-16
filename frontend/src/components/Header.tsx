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
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8 text-slate-300 ml-64">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative w-96">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search ticker symbol (e.g. AAPL, NVDA)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />
      </form>

      {/* Backend Status Indicator */}
      <div className="flex items-center space-x-3 text-sm font-medium">
        <span className="text-slate-500 text-xs">Agent Server:</span>
        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          backendStatus === "connected" 
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}>
          {backendStatus === "connected" ? (
            <>
              <Wifi className="h-3 w-3 animate-pulse" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
