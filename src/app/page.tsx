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
          <div className="inline-flex items-center gap-3 px-4 py-2 glass rounded-full border border-cyan/30 text-cyan text-sm font-bold tracking-[0.2em] mb-4">
            <ShieldAlert className="w-4 h-4" />
            LIVE SECURITY ANALYSIS SYSTEM
          </div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 glow-cyan">
            SPECTER<span className="text-slate-500">SCAN</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Real-time cybersecurity intelligence platform for domain analysis, 
            threat detection, and vulnerability scoring. 
          </p>

          <div className="flex items-center justify-center gap-12 pt-8 text-slate-500">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-widest">Async Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-widest">Global Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-widest">3D Visualization</span>
            </div>
          </div>
        </header>

        {/* Scanner Component */}
        <Scanner />

        {/* Footer info */}
        <footer className="mt-24 text-center text-slate-600 text-[10px] font-mono uppercase tracking-[0.3em] space-y-4">
          <div>
            &copy; 2026 SPECTER-SYSTEMS // SECURE_ACCESS_GRANTED
          </div>
          <div className="text-cyan/40">
            Made by <span className="text-cyan/60 font-bold">Anubhav Kumar</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
