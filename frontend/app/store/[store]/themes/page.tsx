"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStoreCtx } from "../../../../contexts/StoreContext";
import { PublicThemes, Store as StoreAPI } from "../../../../lib/api";
import Icon from "../../../../components/AppIcon";
import Loader from "../../../../components/Loader";
import {
    Card,
    CardContent,
    CardActions,
    Button,
    Grid,
    Typography,
    Chip,
    Tooltip,
} from "@mui/material";
import { toast } from "react-toastify";

type ThemeItem = {
    id: string;
    _id: string; // compatibility
    name: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    thumbnail_url?: string; // snake_case from DB
    zip_url?: string;
    buildPath?: string;
    status: string;
};

export default function MerchantStoreThemesPage() {
    const params = useParams();
    const storeSlug = params?.store as string;
    const [themes, setThemes] = useState<ThemeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<any>(null);

    const { setPageTitle } = useStoreCtx();

    useEffect(() => {
        setPageTitle("Themes & Customization");
    }, [setPageTitle]);

    useEffect(() => {
        loadData();
    }, [storeSlug]);

    const loadData = async () => {
        try {
            setLoading(true);
            const themesRes = await PublicThemes.list();
            const storeRes = await StoreAPI.getBySlug(storeSlug);

            if (themesRes?.data) setThemes(themesRes.data);

            if (storeRes?.data) {
                if (storeRes.data.themeId) {
                    setActiveThemeId(storeRes.data.themeId);
                }

                if (storeRes.data.planId) {
                    const { PublicSubscriptionPlans } = await import("../../../../lib/api");
                    try {
                        const plansRes = await PublicSubscriptionPlans.list();
                        const plan = plansRes?.data?.find((p: any) => p.id === storeRes.data.planId);
                        setCurrentPlan(plan);
                    } catch (e) {
                        console.warn("Failed to fetch plan details", e);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load themes data:", err);
            toast.error("Failed to load themes");
        } finally {
            setLoading(false);
        }
    };

    const isThemeLocked = (theme: ThemeItem) => {
        if (!currentPlan) return false;
        const planName = currentPlan.name?.toLowerCase() || "";
        const themeName = theme.name?.toLowerCase() || "";
        if (planName.includes("starter") || planName.includes("basic")) {
            if (themeName.includes("luxury") || themeName.includes("premium")) {
                return true;
            }
        }
        return false;
    };

    const handleSelectTheme = async (themeSlug: string, themeId: string) => {
        if (themeId === activeThemeId) return;
        setUpdating(themeId);
        try {
            const res = await PublicThemes.apply(storeSlug, themeSlug);

            if (res.status === "processing") {
                // Keep 'updating' active to show AI loader
                toast.info("AI Activation Started! Optimizing your theme...");

                // Polling to wait for build
                let attempts = 0;
                const interval = setInterval(async () => {
                    attempts++;
                    const check = await StoreAPI.getBySlug(storeSlug);
                    if (check.data?.themeId === themeId) {
                        // Success!
                        setActiveThemeId(themeId);
                        setUpdating(null);
                        clearInterval(interval);
                        toast.success(
                            <div>
                                <strong>AI Activation Complete!</strong><br />
                                <span className="text-sm">Universal Auth injected & built. <a href={`/s/${storeSlug}/live`} target="_blank" className="underline font-bold">View Live Store →</a></span>
                            </div>
                        );
                    }
                    if (attempts > 30) {
                        setUpdating(null);
                        clearInterval(interval);
                    }
                }, 3000);
            } else {
                setActiveThemeId(themeId);
                setUpdating(null);
                toast.success("Theme applied!");
            }
        } catch (err) {
            console.error("Failed to update theme:", err);
            toast.error("Failed to update theme");
            setUpdating(null);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context-aware Header */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-24 translate-x-24 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center text-white shadow-xl shadow-indigo-900/20">
                            <Icon name="Palette" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Themes & Style</h1>
                            <p className="text-slate-500 font-medium">Elevate your brand with premium templates and interactive components.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Go Live Banner - shows when a theme is active */}
            {activeThemeId && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Icon name="Zap" size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Your Store is Live!</h3>
                            <p className="text-white/80 text-sm">Theme applied. Add products and share your store link with customers.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={`/s/${storeSlug}/live`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2.5 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all duration-300 shadow-md text-sm"
                        >
                            View Live Store →
                        </a>
                        <a
                            href={`/store/${storeSlug}/products`}
                            className="px-6 py-2.5 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-md border border-white/20 text-sm"
                        >
                            Add Products
                        </a>
                    </div>
                </div>
            )}

            <Grid container spacing={4}>
                {themes.map((theme) => {
                    const isActive = theme.id === activeThemeId || theme._id === activeThemeId;
                    const isProcessing = updating === theme.id || updating === theme._id;
                    const isLocked = isThemeLocked(theme);

                    return (
                        <Grid item xs={12} sm={6} md={4} key={theme.id || theme._id}>
                            <Card
                                elevation={isActive ? 4 : 0}
                                sx={{
                                    borderRadius: 4,
                                    border: isActive ? "3px solid #6366f1" : "1px solid #e2e8f0",
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    position: "relative",
                                    overflow: "hidden",
                                    filter: isLocked ? "grayscale(0.7)" : "none",
                                    opacity: isLocked ? 0.8 : 1,
                                    "&:hover": {
                                        transform: isLocked ? "none" : "translateY(-8px)",
                                        boxShadow: isLocked ? "none" : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                    },
                                }}
                            >
                                {isActive && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <Chip
                                            label="Current"
                                            color="primary"
                                            size="small"
                                            sx={{ fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                        />
                                    </div>
                                )}

                                {isLocked && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <Tooltip title="Upgrade your plan to unlock premium themes">
                                            <Chip
                                                icon={<Icon name="Lock" size={14} />}
                                                label="Locked"
                                                size="small"
                                                sx={{
                                                    fontWeight: "bold",
                                                    bgcolor: "rgba(255,255,255,0.9)",
                                                    backdropFilter: "blur(4px)",
                                                    color: "text.secondary",
                                                    border: "1px solid #e2e8f0"
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                )}

                                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden group">
                                    {theme.thumbnailUrl ? (
                                        <img
                                            src={(() => {
                                                const url = theme.thumbnailUrl || theme.thumbnail_url;
                                                if (url?.startsWith("/")) {
                                                    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace("/api/v1", "");
                                                    return `${apiBase}${url}`;
                                                }
                                                return url;
                                            })()}
                                            alt={theme.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://placehold.co/600x400?text=Theme+Preview";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full grid place-items-center">
                                            <Icon name="Image" size={64} className="text-slate-300" />
                                        </div>
                                    )}

                                    <div className={`absolute inset-0 bg-neutral-900/60 ${isLocked ? "flex" : "opacity-0 group-hover:opacity-100"} transition-all duration-300 items-center justify-center`}>
                                        {isLocked ? (
                                            <div className="text-white text-center p-6">
                                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                                    <Icon name="Lock" size={24} />
                                                </div>
                                                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                                    Premium Theme
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    color="warning"
                                                    size="small"
                                                    onClick={() => window.open(`/store/${storeSlug}/plans`, "_self")}
                                                    sx={{ fontWeight: "bold", borderRadius: 2 }}
                                                >
                                                    Upgrade to Unlock
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => window.open(`/theme/${theme.slug}/preview?store=${storeSlug}`, "_blank")}
                                                startIcon={<Icon name="Eye" size={18} />}
                                                sx={{
                                                    fontWeight: "bold",
                                                    borderRadius: 2,
                                                    bgcolor: "white",
                                                    color: "neutral.900",
                                                    "&:hover": { bgcolor: "#f8fafc" }
                                                }}
                                            >
                                                Live Preview
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" fontWeight={800} gutterBottom>
                                        {theme.name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            height: "40px",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {theme.description || "A clean, modern design perfect for any online business."}
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant={isActive ? "outlined" : "contained"}
                                        disabled={isActive || isProcessing || isLocked}
                                        onClick={() => handleSelectTheme(theme.slug, theme.id || theme._id)}
                                        sx={{
                                            borderRadius: 2.5,
                                            py: 1.2,
                                            fontWeight: "bold",
                                            textTransform: "none",
                                            boxShadow: isActive ? "none" : "0 4px 6px -1px rgba(99, 102, 241, 0.2)"
                                        }}
                                    >
                                        {isProcessing ? "Applying..." : isActive ? "Currently Active" : isLocked ? "Requires Pro Plan" : "Set as Store Theme"}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {themes.length === 0 && (
                <div className="py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="Palette" size={40} className="text-slate-300" />
                    </div>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        Preparing New Themes
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        Our designers are working on fresh templates for you.
                    </Typography>
                </div>
            )}
        </div>
    );
}
