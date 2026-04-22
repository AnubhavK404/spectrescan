import { Scanner } from '@/components/scanner/Scanner';
import { ShieldAlert, Cpu, Database, Network } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan/10 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-magenta/10 blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-3 px-3 md:px-4 py-2 glass rounded-full border border-cyan/30 text-cyan text-[10px] md:text-sm font-bold tracking-[0.1em] md:tracking-[0.2em] mb-4">
            <ShieldAlert className="w-3 h-3 md:w-4 md:h-4" />
            Version 0.0.21
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-4 glow-cyan">
            SPECTRE<span className="text-slate-500">SCAN</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed px-4">
            Real-time cybersecurity intelligence platform for domain analysis,
            threat detection, and vulnerability scoring AI Powered summaries for better superficial understanding.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 pt-10 text-slate-500">
            <div className="flex items-center gap-3 px-4 md:px-8">
              <Cpu className="w-5 h-5 text-cyan/70" />
              <span className="text-[10px] md:text-xs uppercase font-bold tracking-[0.2em]">Async Processing</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-3 px-4 md:px-8">
              <Database className="w-5 h-5 text-cyan/70" />
              <span className="text-[10px] md:text-xs uppercase font-bold tracking-[0.2em]">Global Intelligence</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-3 px-4 md:px-8">
              <Network className="w-5 h-5 text-cyan/70" />
              <span className="text-[10px] md:text-xs uppercase font-bold tracking-[0.2em]">3D Visualization</span>
            </div>
          </div>
        </header>

        {/* Scanner Component */}
        <Scanner />

        {/* Footer info */}
        <footer className="mt-24 text-center text-slate-600 text-[10px] md:text-xs font-mono uppercase tracking-[0.1em] md:tracking-[0.3em] px-4">
          &copy; 2026 SPECTER-SYSTEMS // SECURE_ACCESS_GRANTED
        </footer>
      </div>
    </main>
  );
}
