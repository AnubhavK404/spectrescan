'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, AlertTriangle, CheckCircle, Globe, Lock, Activity, Terminal, Download, Share2, Camera, Database, Info } from 'lucide-react';
import { NetworkGraph } from '@/components/visualization/NetworkGraph';
import { ScanResults } from '@/lib/types';

interface ScanStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

const INITIAL_STEPS: ScanStep[] = [
  { id: 'dns', label: 'Resolving DNS & GeoIP...', status: 'pending' },
  { id: 'whois', label: 'Querying WHOIS Database...', status: 'pending' },
  { id: 'ssl', label: 'Validating SSL Certificate...', status: 'pending' },
  { id: 'threat', label: 'Aggregating Intelligence...', status: 'pending' },
  { id: 'urlscan', label: 'Deep Page Analysis...', status: 'pending' },
  { id: 'score', label: 'Calculating Risk Score...', status: 'pending' },
];

export const Scanner = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [steps, setSteps] = useState<ScanStep[]>(INITIAL_STEPS);
  const [results, setResults] = useState<ScanResults | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setResults(null);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));

    try {
      // Simulate terminal start
      updateStep('dns', 'loading');
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Scan failed');

      const data = await response.json();
      
      // We update steps sequentially to simulate a real process even if data comes back at once
      await updateStepSequentially();
      
      setResults(data);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const updateStep = (id: string, status: 'loading' | 'completed' | 'error') => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const updateStepSequentially = async () => {
    const sequence = ['dns', 'whois', 'ssl', 'threat', 'urlscan', 'score'];
    for (const id of sequence) {
      updateStep(id, 'loading');
      if (id !== 'ssl') {
        await new Promise(resolve => setTimeout(resolve, 800)); // Short delay for cinematic effect
      }
      updateStep(id, 'completed');
    }
    setIsScanning(false);
  };

  const handleExport = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `specterscan_${results.domain}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleShare = () => {
    if (!results) return;
    navigator.clipboard.writeText(`${window.location.origin}/?domain=${results.domain}`);
    alert('Shareable link copied to clipboard!');
  };

  const handleScreenshot = () => {
    window.print(); // Basic screenshot mode (printable view)
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 md:space-y-8">
      {/* Search Input */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 md:p-8 rounded-2xl border-glow-cyan"
      >
        <form onSubmit={handleScan} className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full">
            <div className="relative w-full">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan w-5 h-5 md:w-6 md:h-6 z-10" />
              <input
                type="text"
                placeholder="Enter URL or Domain"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 pl-14 pr-4 md:pr-36 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 text-base md:text-lg terminal-text transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 mt-4 md:mt-0 w-full md:w-auto px-8 py-2.5 bg-cyan text-slate-950 font-bold rounded-lg hover:bg-cyan/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan/20 z-20"
            >
              {isScanning ? <Activity className="animate-spin" /> : <Search className="w-4 h-4 md:w-5 md:h-5" />}
              <span className="md:inline">SCAN</span>
            </button>
          </div>
        </form>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Terminal / Status */}
        <div className="lg:col-span-1 space-y-6">
          <AnimatePresence mode="wait">
            {(isScanning || results) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass p-6 rounded-2xl h-full border-l-4 border-cyan"
              >
                <div className="flex items-center gap-2 mb-4 text-cyan font-bold text-sm">
                  <Terminal className="w-4 h-4 md:w-5 md:h-5" />
                  <span>SCAN SEQUENCE</span>
                </div>
                    <div className="space-y-4" ref={terminalRef}>
                      {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3">
                          {step.status === 'loading' && (
                            step.id === 'ssl' ? (
                              <div className="w-4 h-4 border-2 border-cyan/50 border-t-cyan rounded-full" />
                            ) : (
                              <Activity className="w-4 h-4 text-cyan animate-spin" />
                            )
                          )}
                          {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-green" />}
                      {step.status === 'pending' && <div className="w-4 h-4 border border-slate-600 rounded-full" />}
                      {step.status === 'error' && <AlertTriangle className="w-4 h-4 text-red" />}
                      <span className={`text-sm ${step.status === 'loading' ? 'text-cyan' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {results && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 pt-6 border-t border-slate-700"
                  >
                    <div className="text-sm text-slate-400 mb-2">RISK SCORE</div>
                    <div className={`text-4xl md:text-5xl font-black mb-2 ${results.score > 70 ? 'text-red' : results.score > 40 ? 'text-yellow-500' : 'text-green'}`}>
                      {results.score}/100
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-6">
                      VERDICT: {results.riskLevel}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={handleExport} className="py-3 px-2 glass hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 text-[9px] font-bold text-slate-400 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Download className="w-4 h-4 text-cyan" /> EXPORT
                      </button>
                      <button onClick={handleShare} className="py-3 px-2 glass hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 text-[9px] font-bold text-slate-400 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Share2 className="w-4 h-4 text-magenta" /> SHARE
                      </button>
                      <button onClick={handleScreenshot} className="py-3 px-2 glass hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 text-[9px] font-bold text-slate-400 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Camera className="w-4 h-4 text-green" /> PRINT
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Visualization / Results */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {results ? (
              <div
                className="glass rounded-2xl overflow-hidden min-h-[350px] md:min-h-[500px]"
              >
                <NetworkGraph data={results} />
                
                {/* Expert Security Analysis */}
                {results.expert_analysis && (
                  <div className="p-6 border-t border-slate-700 bg-cyan/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-cyan/10 rounded-lg">
                        <Shield className="w-6 h-6 text-cyan" />
                      </div>
                      <div>
                        <h3 className="text-cyan font-bold leading-none">EXECUTIVE SECURITY ANALYSIS</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Specialized Intelligence Assessment</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                        &quot;{results.expert_analysis.overview}&quot;
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-yellow-500" /> Detected Risk Factors
                          </h4>
                          <ul className="space-y-2">
                            {results.expert_analysis.risks.map((risk, i) => (
                              <li key={i} className="text-xs text-slate-400 flex gap-2">
                                <span className="text-cyan">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-4 rounded-xl border border-cyan/20 bg-cyan/5">
                          <h4 className="text-[10px] text-cyan uppercase tracking-widest font-bold flex items-center gap-2 mb-3">
                            <Info className="w-3 h-3" /> Professional Recommendation
                          </h4>
                          <p className="text-xs text-slate-300 font-bold leading-relaxed">
                            {results.expert_analysis.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-700">
                  <div className="space-y-4">
                    <h3 className="text-cyan font-bold flex items-center gap-2 text-sm md:text-base">
                      <Shield className="w-4 h-4 md:w-5 md:h-5" /> THREAT ANALYSIS
                    </h3>
                    <div className="text-sm text-slate-300 space-y-3">
                      <p className="leading-relaxed">{results.explanation[0]}</p>
                      {results.abuse_reputation && (
                        <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                          <Activity className="w-4 h-4 text-magenta" />
                          <span className="text-xs text-slate-400">
                            IP Abuse Score: <span className="text-magenta font-bold">{results.abuse_reputation.abuseConfidenceScore}%</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-cyan font-bold flex items-center gap-2 text-sm md:text-base">
                      <Lock className="w-4 h-4 md:w-5 md:h-5" /> SSL CERTIFICATE
                    </h3>
                    <div className="glass p-5 rounded-xl border border-slate-800 bg-slate-900/40">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</p>
                          <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${results.ssl_status?.valid ? 'bg-green/10 text-green border border-green/20' : 'bg-red/10 text-red border border-red/20'}`}>
                            {results.ssl_status?.valid ? 'SECURE / VALID' : 'INSECURE / INVALID'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Time Left</p>
                          <span className={`text-sm font-mono font-bold ${results.ssl_status?.daysRemaining < 30 ? 'text-yellow-500' : 'text-slate-300'}`}>
                            {results.ssl_status?.daysRemaining} Days
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                        <div className="pl-4 border-l-2 border-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Common Name (CN)</p>
                          <p className="text-xs text-slate-300 font-mono truncate" title={results.ssl_status?.subject}>{results.ssl_status?.subject}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Issuer (CA)</p>
                          <p className="text-xs text-slate-300 font-mono truncate" title={results.ssl_status?.issuer}>{results.ssl_status?.issuer}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Protocol</p>
                          <p className="text-xs text-slate-300 font-mono">{results.ssl_status?.protocol || 'Unknown'}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Cipher Suite</p>
                          <p className="text-xs text-slate-300 font-mono truncate" title={results.ssl_status?.cipher}>{results.ssl_status?.cipher || 'Unknown'}</p>
                        </div>
                        <div className="sm:col-span-2 pl-4 border-l-2 border-cyan/20 bg-cyan/5 py-3 rounded-r-lg">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Fingerprint (SHA1)</p>
                          <p className="text-[10px] font-mono text-cyan/70 break-all leading-relaxed">
                            {results.ssl_status?.fingerprint}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {results.url_scan && (
                  <div className="p-6 border-t border-slate-700 bg-slate-900/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-cyan font-bold flex items-center gap-2">
                        <Camera className="w-4 h-4" /> DEEP PAGE ANALYSIS
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${results.url_scan.score > 50 ? 'bg-red/20 text-red border border-red/30' : 'bg-green/20 text-green border border-green/30'}`}>
                        {results.url_scan.score}/100 RISK
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Screenshot & Core Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="relative group">
                          <img 
                            src={results.url_scan.screenshot} 
                            alt="URLScan Screenshot" 
                            className="w-full h-auto rounded-lg border border-slate-800 transition-all duration-700 group-hover:grayscale-0 grayscale"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            {results.url_scan.malicious_details?.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red/80 text-white text-[9px] font-bold rounded uppercase">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-cyan/30 transition-colors group/item">
                            <p className="text-[9px] text-slate-500 uppercase mb-1.5 font-bold tracking-tight">Server</p>
                            <p className="text-xs text-slate-300 font-mono truncate group-hover/item:text-cyan transition-colors">{results.url_scan.pageDetails?.server || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-cyan/30 transition-colors group/item">
                            <p className="text-[9px] text-slate-500 uppercase mb-1.5 font-bold tracking-tight">IP Address</p>
                            <p className="text-xs text-slate-300 font-mono truncate group-hover/item:text-cyan transition-colors">{results.url_scan.pageDetails?.ip || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-cyan/30 transition-colors group/item">
                            <p className="text-[9px] text-slate-500 uppercase mb-1.5 font-bold tracking-tight">Country</p>
                            <p className="text-xs text-slate-300 font-mono group-hover/item:text-cyan transition-colors">{results.url_scan.pageDetails?.country || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-cyan/30 transition-colors group/item">
                            <p className="text-[9px] text-slate-500 uppercase mb-1.5 font-bold tracking-tight">Requests</p>
                            <p className="text-xs text-slate-300 font-mono group-hover/item:text-cyan transition-colors">{results.url_scan.stats?.requests || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tech Stack & Details */}
                      <div className="space-y-4">
                        <div className="p-4 glass rounded-xl border border-slate-800 h-full">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Detected Technologies</p>
                          <div className="flex flex-wrap gap-2">
                            {results.url_scan.technologies.length > 0 ? (
                              results.url_scan.technologies.map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-cyan/10 text-cyan text-[10px] rounded border border-cyan/20">
                                  {tech}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">No technologies detected</span>
                            )}
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Infrastructure Details</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">ASN</span>
                                <span className="text-slate-300 font-mono">{results.url_scan.pageDetails?.asn || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Provider</span>
                                <span className="text-slate-300 font-mono truncate max-w-[120px]" title={results.url_scan.pageDetails?.asnname}>
                                  {results.url_scan.pageDetails?.asnname || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Page Links</span>
                                <span className="text-slate-300 font-mono">{results.url_scan.stats?.links || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Abuse Intelligence Detailed View */}
                {results.abuse_reputation && (
                  <div className="p-6 border-t border-slate-700 bg-slate-900/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-magenta font-bold flex items-center gap-2">
                        <Database className="w-4 h-4" /> ABUSE INTELLIGENCE
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${results.abuse_reputation.abuseConfidenceScore > 50 ? 'bg-red/20 text-red border border-red/30' : 'bg-green/20 text-green border border-green/30'}`}>
                        {results.abuse_reputation.abuseConfidenceScore}% CONFIDENCE
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div className="glass p-4 rounded-xl border-l-2 border-magenta">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Infrastructure</div>
                          <div className="text-sm font-mono text-slate-300">{results.abuse_reputation.isp}</div>
                        </div>
                        <div className="glass p-4 rounded-xl border-l-2 border-magenta">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Usage Type</div>
                          <div className="text-sm font-mono text-slate-300">{results.abuse_reputation.usageType}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="glass p-4 rounded-xl border-l-2 border-magenta">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Total Reports</div>
                          <div className="text-2xl font-black text-magenta">{results.abuse_reputation.totalReports}</div>
                        </div>
                        <div className="glass p-4 rounded-xl border-l-2 border-magenta">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Whitelisted</div>
                          <div className={`text-sm font-bold ${results.abuse_reputation.isWhitelisted ? 'text-green' : 'text-slate-400'}`}>
                            {results.abuse_reputation.isWhitelisted ? 'YES' : 'NO'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {results.abuse_reputation.reports.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Recent Incident Logs</p>
                        {results.abuse_reputation.reports.map((report, idx) => (
                          <div key={idx} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 text-[11px] font-mono">
                            <div className="flex justify-between text-slate-500 mb-1">
                              <span>{new Date(report.reportedAt).toLocaleDateString()}</span>
                              <span className="text-magenta/70">CAT: {report.categories.join(', ')}</span>
                            </div>
                            <div className="text-slate-300 italic">
                              &quot;{report.comment.length > 100 ? report.comment.substring(0, 100) + '...' : report.comment}&quot;
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : isScanning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl h-[350px] md:h-[500px] flex items-center justify-center relative overflow-hidden"
              >
                <div className="scan-line absolute inset-0 pointer-events-none opacity-20" />
                <div className="text-center space-y-4">
                  <Activity className="w-12 h-12 text-cyan animate-spin mx-auto" />
                  <p className="text-cyan animate-pulse font-mono">INITIALIZING DEEP SCAN...</p>
                </div>
              </motion.div>
            ) : (
              <div className="glass rounded-2xl h-[350px] md:h-[500px] flex items-center justify-center text-slate-600 border-dashed border-2 border-slate-800">
                <p>Awaiting Target URL</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
