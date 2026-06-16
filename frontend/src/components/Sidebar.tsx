"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Cpu, 
  FileText, 
  Activity 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Top 10 Stocks", href: "/top10", icon: TrendingUp },
    { name: "Agent Activity", href: "/agent", icon: Cpu },
    { name: "Reports Archive", href: "/reports", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-900 flex flex-col h-screen fixed left-0 top-0 text-slate-400 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-900 flex items-center space-x-3.5">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl glow-emerald">
          <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-white tracking-wide uppercase leading-none">StockAgent</h1>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">LangChain Engine</span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-4 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border-l-4 border-emerald-500 pl-3.5 shadow-lg shadow-emerald-500/5"
                  : "hover:bg-slate-900/50 hover:text-slate-200 hover:translate-x-1"
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-5 border-t border-slate-900 text-center">
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Version 1.2.0 • Free Tier
        </div>
      </div>
    </aside>
  );
}
