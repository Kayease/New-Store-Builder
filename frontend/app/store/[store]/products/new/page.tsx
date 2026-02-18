// @ts-nocheck
"use client";
import React, { useRef, useState, useEffect } from "react";

import {
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Divider,
    Switch,
    Select,
    MenuItem,
    FormControlLabel,
    RadioGroup,
    Radio,
    InputAdornment,
    IconButton,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import dynamic from "next/dynamic";
import Icon from "../../../../../components/AppIcon";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useStoreCtx } from "../../../../../contexts/StoreContext";
import { toast } from "react-toastify";
import { Products } from "../../../../../lib/api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "quill/dist/quill.snow.css";

export default function NewProductPage() {
    const router = useRouter();
    const params = useParams();
    const storeSlug = params?.store as string;
    const { storeId, setPageTitle } = useStoreCtx();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setPageTitle("Create Products");
    }, [setPageTitle]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [note, setNote] = useState("");
    const [price, setPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [qty, setQty] = useState("");
    const [stockStatus, setStockStatus] = useState("in_stock");
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("IPEST");
    const [publish, setPublish] = useState("Publish");
    const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([]);

    // Media handling
    const coverInputRef = useRef<HTMLInputElement | null>(null);
    const extraInputRef = useRef<HTMLInputElement | null>(null);

    const [cover, setCover] = useState<string>("");
    const [extra, setExtra] = useState<string[]>([]);

    const openCoverPicker = () => coverInputRef.current?.click();
    const openExtraPicker = () => extraInputRef.current?.click();

    const onCoverChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setCover(URL.createObjectURL(f));
    };
    const onExtraChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const list = e.target.files ? Array.from(e.target.files) : [];
        const urls = list.map((f) => URL.createObjectURL(f));
        setExtra((prev) => [...prev, ...urls]);
    };

    const handleSave = async () => {
        if (!name || !price) {
            toast.error("Product name and price are required");
            return;
        }

        if (!storeId) {
            toast.error("Store ID not found. Please refresh the page.");
            return;
        }

        setIsSaving(true);
        try {
            console.log("Saving product with storeId:", storeId);
            const payload = {
                name,
                description,
                price: Number(price),
                compareAtPrice: salePrice ? Number(salePrice) : undefined,
                inventoryQuantity: Number(qty) || 0,
                stockStatus,
                category,
                brand,
                status: publish === 'Publish' ? 'active' : 'draft',
                storeId, // REQUIRED by backend
                attributes,
                metadata: {
                    note,
                }
            };

            await Products.create(payload);
            toast.success("Product created successfully!");
            router.push(`/store/${storeSlug}/products`);
        } catch (error: any) {
            console.error("Product creation failed:", error);
            const msg = error?.response?.data?.detail || error?.response?.data?.message || "Failed to create product";
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="space-y-6 max-w-7xl mx-auto pb-24 px-4 bg-white/50 min-h-screen">

                {/* Header */}
                <div className="flex items-center gap-4 py-4">
                    <Button
                        startIcon={<Icon name="ArrowLeft" />}
                        onClick={() => router.back()}
                        sx={{ color: 'text.secondary', fontWeight: 'bold' }}
                    >
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. General Section */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Icon name="Box" size={18} className="text-indigo-500" />
                                <span className="uppercase tracking-wider text-xs font-bold text-slate-500">General Information</span>
                            </div>
                            <CardContent sx={{ p: 4 }}>
                                <div className="space-y-6">
                                    <TextField
                                        label="Product Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        fullWidth
                                        required
                                        placeholder="e.g. Summer Floral Dress"
                                        helperText="Give your product a short, clear name."
                                    />
                                    <div className="space-y-2">
                                        <Typography variant="body2" fontWeight={600} sx={{ color: 'gray.700' }}>Description</Typography>
                                        <div className="border border-slate-300 rounded-lg min-h-[220px] p-4 bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                            <textarea
                                                className="w-full h-full min-h-[200px] outline-none border-none resize-none text-sm text-slate-700 placeholder-slate-400"
                                                placeholder="Describe your product in detail..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Media Section */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Icon name="Image" size={18} className="text-indigo-500" />
                                <span className="uppercase tracking-wider text-xs font-bold text-slate-500">Media</span>
                            </div>
                            <CardContent sx={{ p: 4 }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Cover Image</Typography>
                                        <div onClick={openCoverPicker} className="border-2 border-dashed border-indigo-100 rounded-xl p-8 flex flex-col items-center justify-center bg-indigo-50/30 hover:bg-indigo-50 transition-all cursor-pointer min-h-[200px] group relative overflow-hidden">
                                            {cover ? (
                                                <img src={cover} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                        <Icon name="UploadCloud" size={24} className="text-indigo-500" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600">Click to upload cover</p>
                                                </div>
                                            )}
                                            <input type="file" ref={coverInputRef} className="hidden" onChange={onCoverChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Gallery</Typography>
                                        <div onClick={openExtraPicker} className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-slate-50 transition-all cursor-pointer min-h-[200px]">
                                            <Icon name="Images" size={32} className="text-slate-300 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-slate-500">Drop additional images</p>
                                            <input type="file" ref={extraInputRef} className="hidden" onChange={onExtraChange} multiple />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">

                        {/* 2. Pricing Section */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 font-bold uppercase text-xs tracking-wider text-slate-500">
                                Pricing
                            </div>
                            <CardContent sx={{ p: 4 }}>
                                <div className="space-y-4">
                                    <TextField
                                        label="Price"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        fullWidth
                                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    />
                                    <TextField
                                        label="Compare at Price"
                                        value={salePrice}
                                        onChange={(e) => setSalePrice(e.target.value)}
                                        fullWidth
                                        helperText="Show a sale price"
                                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Inventory Section */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 font-bold uppercase text-xs tracking-wider text-slate-500">Inventory</div>
                            <CardContent sx={{ p: 4 }}>
                                <div className="space-y-4">
                                    <TextField label="Quantity" type="number" value={qty} onChange={(e) => setQty(e.target.value)} fullWidth />
                                    <TextField select label="Stock Status" value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} fullWidth>
                                        <MenuItem value="in_stock">In Stock</MenuItem>
                                        <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                                    </TextField>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organization */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 font-bold uppercase text-xs tracking-wider text-slate-500">Organization</div>
                            <CardContent sx={{ p: 4 }}>
                                <div className="space-y-4">
                                    <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth />
                                    <TextField label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} fullWidth />
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 flex justify-end gap-3 z-50">
                    <Button variant="outlined" size="large" sx={{ px: 4, borderRadius: '12px', fontWeight: 'bold' }} onClick={() => router.back()}>Cancel</Button>
                    <Button
                        variant="contained"
                        size="large"
                        disabled={isSaving}
                        onClick={handleSave}
                        sx={{
                            px: 6,
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            bgcolor: '#4f46e5',
                            '&:hover': { bgcolor: '#4338ca' }
                        }}
                    >
                        {isSaving ? "Creating..." : "Save Product"}
                    </Button>
                </div>
            </div>
        </>
    );
}
