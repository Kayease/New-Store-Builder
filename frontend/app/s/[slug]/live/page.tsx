
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../../lib/api";
import { CustomerAuthProvider } from "../api/auth";

// No legacy bundled themes needed anymore. All themes are dynamic.

export default function LiveStorePage() {
    const params = useParams();
    const storeSlug = params?.slug as string;
    const [store, setStore] = useState<any>(null);
    const [theme, setTheme] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [automatedUrl, setAutomatedUrl] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
    const API_BASE = API_URL.replace('/api/v1', '');

    useEffect(() => {
        if (storeSlug) loadStore();
    }, [storeSlug]);

    const loadStore = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/s/live/${storeSlug}`);
            const data = res.data?.data;
            if (data) {
                setStore(data.store);
                setTheme(data.theme);

                console.log("🏪 Store Loaded:", data.store.slug);
                console.log("🎨 Theme Assigned:", data.theme?.slug);

                // Check for AI-Automated Static Export (Iframe Mode)
                if (data.theme?.slug) {
                    const tSlug = data.theme.slug;
                    const entryPoints = [
                        `/uploads/themes/${tSlug}/out/index.html`,
                        `/uploads/themes/${tSlug}/index.html`
                    ];

                    for (const path of entryPoints) {
                        const target = `${API_BASE}${path}`;
                        try {
                            console.log("🔍 Checking entry point:", target);
                            const checkRes = await fetch(target, { method: 'HEAD' });
                            if (checkRes.ok) {
                                console.log("✅ Found valid automated theme at:", target);
                                setAutomatedUrl(`${target}?store=${storeSlug}`);
                                setLoading(false);
                                return;
                            }
                        } catch (e) {
                            console.error("❌ Link check failed:", target);
                        }
                    }
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Store unreachable");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black font-mono">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="animate-pulse">INITIALIZING_STORE_V2...</p>
                </div>
            </div>
        );
    }

    if (error || !store) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center font-mono">
                <div>
                    <h1 className="text-6xl font-black mb-4 text-red-500">404</h1>
                    <p className="tracking-widest text-sm opacity-50 uppercase">{error || "STORE_NOT_FOUND"}</p>
                </div>
            </div>
        );
    }

    // CASE 1: AI-Uploaded Theme (Renders in Iframe)
    if (automatedUrl) {
        return (
            <div className="fixed inset-0 w-full h-full bg-white overflow-hidden">
                <iframe
                    src={automatedUrl}
                    className="w-full h-full border-none"
                    title={store.name}
                />
            </div>
        );
    }

    // CASE 2: No Theme Assigned Fallback
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-mono">
            <div className="max-w-md w-full text-center">
                <div className="text-6xl mb-6">🏜️</div>
                <h1 className="text-2xl font-bold mb-2">STORE_EMPTY</h1>
                <p className="text-gray-500 text-sm">No theme has been assigned to this store yet. Visit the Admin Dashboard to customize your storefront.</p>
            </div>
        </div>
    );
}
