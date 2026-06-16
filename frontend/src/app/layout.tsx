import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "AI Stock Market Research Agent Dashboard",
  description: "Monitor and analyze stock market stocks with an automated AI research agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-row">
        {/* Sidebar Nav */}
        <Sidebar />
        
        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header Bar */}
          <Header />
          
          {/* Dynamic Content */}
          <main className="flex-1 ml-64 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

