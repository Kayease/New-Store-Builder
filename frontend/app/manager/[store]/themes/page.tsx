"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
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
    IconButton,
} from "@mui/material";
import { toast } from "react-toastify";

type ThemeItem = {
    id: string;
    _id: string; // compatibility
    name: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    status: string;
};

export default function MerchantThemesPage() {
    const params = useParams();
    const storeSlug = params?.store as string;
    const [themes, setThemes] = useState<ThemeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<any>(null);

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

                // Fetch full plan details if planId exists
                if (storeRes.data.planId) {
                    const { PublicSubscriptionPlans } = await import("../../../../lib/api");
                    try {
                        // Assuming list and filter or a direct get if available
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
        if (!currentPlan) return false; // Default to unlocked if plan unknown

        const planName = currentPlan.name?.toLowerCase() || "";
        const themeName = theme.name?.toLowerCase() || "";

        // Define locking logic:
        // Starter and Basic plans are limited to "Modern" themes
        if (planName.includes("starter") || planName.includes("basic")) {
            if (themeName.includes("luxury") || themeName.includes("premium")) {
                return true;
            }
        }

        // Everything else is unlocked for now, or add more levels if needed
        return false;
    };

    const handleSelectTheme = async (theme: ThemeItem) => {
        const themeId = theme.id || theme._id;
        if (themeId === activeThemeId) return;

        setUpdating(themeId);
        try {
            // Using the specialized apply endpoint which triggers AI theme activation
            await PublicThemes.apply(storeSlug, theme.slug);
            setActiveThemeId(themeId);
            toast.success("Theme update initiated! AI processing is running in the background.");

            // Refresh data to show processing status if applicable
            setTimeout(() => loadData(), 2000);
        } catch (err) {
            console.error("Failed to update theme:", err);
            toast.error("Failed to update theme. Please try again.");
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <Loader />;

    return (
        <ManagerLayout title="Store Appearance | Themes">
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col gap-1">
                    <Typography variant="h5" fontWeight={700}>
                        Select a Theme
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Choose the perfect look for your store. You can change this at any time.
                    </Typography>
                </div>

                <Grid container spacing={4}>
                    {themes.map((theme) => {
                        const isActive = theme.id === activeThemeId || theme._id === activeThemeId;
                        const isProcessing = updating === theme.id || updating === theme._id;
                        const isLocked = isThemeLocked(theme);

                        return (
                            <Grid item xs={12} sm={6} md={4} key={theme.id || theme._id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: isActive ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                                        transition: "all 0.3s ease",
                                        position: "relative",
                                        overflow: "hidden",
                                        filter: isLocked ? "grayscale(0.5)" : "none",
                                        opacity: isLocked ? 0.9 : 1,
                                        "&:hover": {
                                            transform: isLocked ? "none" : "translateY(-4px)",
                                            boxShadow: isLocked ? "none" : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                        },
                                    }}
                                >
                                    {isActive && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <Chip
                                                label="Active"
                                                color="primary"
                                                size="small"
                                                sx={{ fontWeight: "bold" }}
                                            />
                                        </div>
                                    )}

                                    {isLocked && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <Tooltip title="Upgrade your plan to unlock this theme">
                                                <Chip
                                                    icon={<Icon name="Lock" size={14} />}
                                                    label="Premium"
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                        fontWeight: "bold",
                                                        bgcolor: "rgba(255,255,255,0.9)",
                                                        color: "text.secondary",
                                                        borderColor: "divider"
                                                    }}
                                                />
                                            </Tooltip>
                                        </div>
                                    )}

                                    <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden group">
                                        {theme.thumbnailUrl ? (
                                            <img
                                                src={theme.thumbnailUrl}
                                                alt={theme.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full grid place-items-center bg-slate-100">
                                                <Icon name="Image" size={48} className="text-slate-300" />
                                            </div>
                                        )}

                                        {/* Hover actions */}
                                        <div className={`absolute inset-0 bg-black/40 ${isLocked ? "flex" : "opacity-0 group-hover:opacity-100"} transition-opacity items-center justify-center gap-3`}>
                                            {isLocked ? (
                                                <div className="text-white text-center p-4">
                                                    <Icon name="Lock" size={32} className="mx-auto mb-2 opacity-80" />
                                                    <Typography variant="caption" sx={{ display: "block", fontWeight: "bold" }}>
                                                        LOCKED
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="warning"
                                                        sx={{ mt: 1, fontSize: "10px" }}
                                                        onClick={() => window.open(`/store/${storeSlug}/plans`, "_self")}
                                                    >
                                                        Upgrade Plan
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="inherit"
                                                    sx={{ bgcolor: "white", color: "black", fontWeight: "bold" }}
                                                    onClick={() => window.open(`/theme/${theme.slug}/preview`, "_blank")}
                                                    startIcon={<Icon name="Eye" size={16} />}
                                                >
                                                    Preview
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <CardContent>
                                        <Typography variant="h6" fontWeight={700} noWrap color={isLocked ? "text.secondary" : "inherit"}>
                                            {theme.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mt: 1,
                                                height: "40px",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                opacity: isLocked ? 0.6 : 1,
                                            }}
                                        >
                                            {theme.description || "No description provided for this theme."}
                                        </Typography>
                                    </CardContent>

                                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                                        {isActive ? (
                                            <>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => window.location.href = `/manager/${storeSlug}/settings`}
                                                    startIcon={<Icon name="Settings" size={16} />}
                                                    sx={{ borderRadius: 2, fontWeight: "bold", textTransform: "none" }}
                                                >
                                                    Customize
                                                </Button>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    color="primary"
                                                    disabled
                                                    sx={{ borderRadius: 2, fontWeight: "bold", textTransform: "none", opacity: 0.8 }}
                                                >
                                                    Active
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color={isLocked ? "inherit" : "primary"}
                                                disabled={isProcessing || isLocked}
                                                onClick={() => handleSelectTheme(theme)}
                                                sx={{ borderRadius: 2, fontWeight: "bold", textTransform: "none" }}
                                            >
                                                {isProcessing ? "Applying..." : isLocked ? "Plan Restricted" : "Apply Theme"}
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {themes.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                        <Icon name="Palette" size={64} className="text-slate-200 mx-auto mb-4" />
                        <Typography variant="h6" color="text.secondary">
                            No themes available at the moment
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                            Please check back later or contact support.
                        </Typography>
                    </div>
                )}
            </div>
        </ManagerLayout>
    );
}
