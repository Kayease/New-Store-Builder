"use client";
import React, { useEffect, useState, use as reactUse } from 'react';
import { useRouter } from 'next/navigation';

export default function ThemePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = reactUse(params);
    const [theme, setTheme] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isNextJs, setIsNextJs] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [simMode, setSimMode] = useState<'view' | 'login' | 'signup'>('view');
    const [diagnostics, setDiagnostics] = useState<string[]>([]);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const API_BASE = API_URL.replace('/api/v1', '');

    const addLog = (msg: string) => setDiagnostics(prev => [...prev.slice(-10), msg]);

    useEffect(() => {
        const checkTheme = async () => {
            try {
                addLog(`🔍 Initializing session: ${slug}`);

                // 1. Fetch Metadata
                const res = await fetch(`${API_URL}/platform/themes/${slug}`);
                if (!res.ok) throw new Error(`Theme Metadata 404: ${res.status}`);
                const themeData = await res.json();
                setTheme(themeData);
                addLog(`✅ Metadata OK: ${themeData.name}`);

                // 2. Scan Entry Points with absolute URLs to avoid relative path confusion
                const checks = [
                    { path: `/uploads/themes/${slug}/index.html`, type: 'static' },
                    { path: `/uploads/themes/${slug}/out/index.html`, type: 'static' },
                    { path: `/uploads/themes/${slug}/package.json`, type: 'source' },
                    { path: `/uploads/themes/${slug}/next.config.js`, type: 'source' },
                    { path: `/uploads/themes/${slug}/${slug}/package.json`, type: 'source' }
                ];

                let bestStatic = null;
                let foundSource = false;

                for (const check of checks) {
                    const target = `${API_BASE}${check.path}`;
                    try {
                        addLog(`📡 Checking: ${check.path}`);
                        const response = await fetch(target, { method: 'GET' }); // Using GET to be safer than HEAD
                        if (response.ok) {
                            addLog(`📍 Success! Found ${check.type}`);
                            if (check.type === 'static' && !bestStatic) bestStatic = target;
                            if (check.type === 'source') foundSource = true;
                        }
                    } catch (e) {
                        addLog(`❌ Connection failed to: ${target}`);
                    }
                }

                if (bestStatic) {
                    setPreviewUrl(bestStatic);
                    setIsNextJs(false);
                    addLog("🚀 Rendering Live Iframe...");
                } else {
                    setIsNextJs(true);
                    addLog("💎 Virtual Blueprint Mode Active");
                }
            } catch (err: any) {
                console.error("Preview Page Error:", err);
                setError(err.message);
                addLog(`🛑 CRITICAL: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (slug) checkTheme();
    }, [slug, API_URL, API_BASE]);

    const getThumbnail = () => {
        if (!theme?.thumbnailUrl) return "https://placehold.co/1920x1080?text=Theme+Preview";
        const thumb = theme.thumbnailUrl.startsWith('http') ? theme.thumbnailUrl : `${API_BASE}${theme.thumbnailUrl}`;
        return thumb;
    };

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#070709] text-white">
            <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin mb-10"></div>
            <div className="max-w-sm w-full bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    Diagnostics Trace
                </div>
                <div className="space-y-1.5">
                    {diagnostics.map((log, i) => (
                        <div key={i} className="text-[#666] text-[10px] font-mono leading-tight">
                            <span className="text-white/20 mr-2">[{i}]</span> {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="h-screen w-full flex items-center justify-center bg-[#070709] p-8">
            <div className="max-w-md w-full border border-red-500/20 bg-red-500/5 p-10 rounded-[32px] text-center">
                <h2 className="text-white text-xl font-bold mb-4 uppercase italic">Simulation Crash</h2>
                <p className="text-red-500 text-[10px] font-mono mb-8 uppercase px-4">{error}</p>
                <button onClick={() => window.location.href = '/admin/themes'} className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-xl">Exit Console</button>
            </div>
        </div>
    );

    if (isNextJs) return (
        <div className="h-screen w-full bg-[#050507] flex flex-col font-sans overflow-hidden">
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-10 bg-black/50 backdrop-blur-3xl z-50">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-white text-[11px] font-black uppercase italic tracking-tighter">{theme?.name || slug}</span>
                        <span className="text-blue-500 text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">Source Environment</span>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                        <button onClick={() => setSimMode('view')} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${simMode === 'view' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>Design</button>
                        <button onClick={() => setSimMode('login')} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${simMode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>Auth Logic</button>
                    </div>
                </div>
                <button onClick={() => window.location.href = '/admin/themes'} className="text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Exit Hub</button>
            </div>

            <div className="flex-1 relative bg-black">
                <img src={getThumbnail()} className={`w-full h-full object-cover transition-all duration-[2s] ${simMode !== 'view' ? 'blur-3xl scale-125 opacity-20' : 'opacity-100'}`} alt="Background" />

                {simMode === 'login' && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 backdrop-blur-sm">
                        <div className="w-full max-w-sm bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[48px] p-12 text-center animate-[fadeIn_0.5s_ease-out]">
                            <h2 className="text-white text-2xl font-black uppercase italic mb-8">Auth Integration</h2>
                            <div className="space-y-4 mb-10 opacity-30">
                                <div className="h-12 bg-white/10 rounded-xl"></div>
                                <div className="h-12 bg-white/10 rounded-xl"></div>
                                <div className="h-12 bg-blue-600 rounded-xl shadow-2xl shadow-blue-500/50"></div>
                            </div>
                            <div className="py-2 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-full inline-block">
                                <span className="text-yellow-500 text-[9px] font-black uppercase tracking-widest">Compiler Required for Live Fields</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } } `}</style>
        </div>
    );

    return (
        <div className="h-screen w-full bg-[#050507] flex flex-col font-sans overflow-hidden">
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-10 bg-black/50 backdrop-blur-3xl z-50">
                <div className="flex flex-col">
                    <span className="text-white text-[11px] font-black uppercase italic tracking-tighter">{theme?.name || slug}</span>
                    <span className="text-green-500 text-[9px] font-black uppercase tracking-widest mt-1">Live Environment Mode</span>
                </div>
                <button onClick={() => window.location.href = '/admin/themes'} className="text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Exit</button>
            </div>
            <div className="flex-1 w-full bg-white">
                <iframe src={previewUrl || ''} className="w-full h-full border-none" title="Preview" />
            </div>
        </div>
    );
}
