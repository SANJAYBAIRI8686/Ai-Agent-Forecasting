"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Cpu, 
  FileText, 
  Search, 
  Activity 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Top 10 Stocks", href: "/top10", icon: TrendingUp },
    { name: "Agent Activity", href: "/agent", icon: Cpu },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <Activity className="h-8 w-8 text-emerald-500 animate-pulse" />
        <div>
          <h1 className="font-bold text-lg text-white leading-none">StockAgent</h1>
          <span className="text-xs text-slate-500 font-medium">Educational AI</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500 pl-3"
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Demo Mode • Free APIs
      </div>
    </aside>
  );
}
