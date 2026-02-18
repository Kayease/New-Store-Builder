// @ts-nocheck
"use client";
import React, { useRef, useState, useEffect } from "react";
import ManagerLayout from "../../../../../components/manager/ManagerLayout";
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
import { useRouter } from "next/navigation";
import { useStoreCtx } from "../../../../../contexts/StoreContext";
import { toast } from "react-toastify";
import { Products } from "../../../../../lib/api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "quill/dist/quill.snow.css";

export default function NewProductPage() {
  const router = useRouter();
  const { storeSlug, storeId } = useStoreCtx();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [foreignPrice, setForeignPrice] = useState("");
  const [qty, setQty] = useState("");
  const [stockStatus, setStockStatus] = useState("in_stock");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("IPEST");
  const [featured, setFeatured] = useState("No");
  const [publish, setPublish] = useState("Publish");
  const [productType, setProductType] = useState("Simple");
  const [isReturnable, setIsReturnable] = useState("No");
  const [allowCod, setAllowCod] = useState("No");
  const [isAvailable, setIsAvailable] = useState("Yes");
  const [allowReviews, setAllowReviews] = useState("Yes");
  const [hsnCode, setHsnCode] = useState("");
  const [sgst, setSgst] = useState("");
  const [cgst, setCgst] = useState("");
  const [igst, setIgst] = useState("");
  const [madeIn, setMadeIn] = useState("India");
  const [currency, setCurrency] = useState("INR (₹)");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");

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
        tax: { sgst, cgst, igst },
        metadata: {
          note,
          hsnCode,
          isReturnable,
          allowCod,
          isAvailable,
          allowReviews,
          madeIn,
          currency,
          weight,
          dimensions: { height, width, length }
        }
      };

      await Products.create(payload);
      toast.success("Product created successfully!");
      router.push(`/manager/${storeSlug}/products`);
    } catch (error: any) {
      console.error("Product creation failed:", error);
      toast.error(error?.response?.data?.message || "Failed to create product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ManagerLayout title="Create Products">
      <div className="space-y-6 max-w-7xl mx-auto pb-24 px-4">

        {/* 1. General Section */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <div className="bg-[#f8fafc] px-6 py-3 border-b uppercase tracking-wider text-xs font-bold text-gray-500">
            General Information
          </div>
          <CardContent sx={{ p: 4 }}>
            <div className="space-y-4">
              <TextField label="Product name *" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              <div className="space-y-1">
                <Typography variant="body2" fontWeight={600} sx={{ color: 'gray.700', mb: 1 }}>Description</Typography>
                <div className="border rounded-md min-h-[220px] p-4 bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <textarea
                    className="w-full h-full min-h-[200px] outline-none border-none resize-none text-sm text-gray-700"
                    placeholder="Describe your product details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Pricing Section */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <div className="bg-[#f8fafc] px-6 py-3 border-b text-gray-500 font-bold uppercase text-xs tracking-wider">
            Pricing and Exclusive Sale
          </div>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid size={6}><TextField label="Regular price *" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth /></Grid>
              <Grid size={6}><TextField label="Sale price" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} fullWidth /></Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 3. Inventory Section */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <div className="bg-[#f8fafc] px-6 py-3 border-b text-gray-500 font-bold uppercase text-xs tracking-wider">Inventory</div>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid size={6}><TextField label="Stock quantity" value={qty} onChange={(e) => setQty(e.target.value)} fullWidth /></Grid>
              <Grid size={6}><TextField select label="Stock status" value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} fullWidth>
                <MenuItem value="in_stock">In stock</MenuItem>
                <MenuItem value="out_of_stock">Out of stock</MenuItem>
              </TextField></Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 4. Media Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
            <div className="bg-[#f8fafc] px-6 py-3 border-b uppercase text-xs font-bold text-gray-500">Product image</div>
            <CardContent sx={{ p: 4 }}>
              <div onClick={openCoverPicker} className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-primary transition-all cursor-pointer min-h-[220px]">
                {cover ? <img src={cover} className="h-40 object-contain shadow-sm rounded-lg" /> : (
                  <div className="text-center">
                    <Icon name="UploadCloud" size={48} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-500">Click to upload cover image</p>
                  </div>
                )}
                <input type="file" ref={coverInputRef} className="hidden" onChange={onCoverChange} />
              </div>
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
            <div className="bg-[#f8fafc] px-6 py-3 border-b uppercase text-xs font-bold text-gray-500">Extra images</div>
            <CardContent sx={{ p: 4 }}>
              <div onClick={openExtraPicker} className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-primary transition-all cursor-pointer min-h-[220px]">
                <Icon name="Images" size={48} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-500">Drop gallery images here</p>
                <input type="file" ref={extraInputRef} className="hidden" onChange={onExtraChange} multiple />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5. Attributes & Variants */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <div className="bg-[#f8fafc] px-6 py-3 border-b font-bold flex justify-between items-center text-xs text-gray-500 uppercase">
            <span>Attributes & Variants</span>
            <Button size="small" variant="text" startIcon={<Icon name="Plus" size={14} />} onClick={() => setAttributes([...attributes, { name: "", values: [] }])}>Add Attribute</Button>
          </div>
          <CardContent sx={{ p: 4 }}>
            <div className="space-y-4">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <TextField label="Attribute Name" size="small" placeholder="e.g. Color" value={attr.name} onChange={e => {
                    const n = [...attributes]; n[idx].name = e.target.value; setAttributes(n);
                  }} />
                  <TextField label="Values" size="small" fullWidth placeholder="Red, Blue, Green (comma separated)" onBlur={e => {
                    const n = [...attributes]; n[idx].values = e.target.value.split(",").map(v => v.trim()).filter(Boolean); setAttributes(n);
                  }} />
                  <IconButton color="error" onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}><Icon name="Trash2" size={18} /></IconButton>
                </div>
              ))}

              {attributes.length > 0 && (
                <div className="pt-6 border-t mt-4">
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'gray.600' }}>Variant Generation Preview</Typography>
                  <Table size="small">
                    <TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>VARIANT</TableCell><TableCell sx={{ fontWeight: 700 }}>PRICE</TableCell><TableCell sx={{ fontWeight: 700 }}>STOCK</TableCell><TableCell sx={{ fontWeight: 700 }}>IMAGE</TableCell></TableRow></TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-gray-400 italic">Dynamic variants list will appear here</TableCell>
                        <TableCell><TextField size="small" type="number" /></TableCell>
                        <TableCell><TextField size="small" type="number" /></TableCell>
                        <TableCell><IconButton size="small"><Icon name="Image" size={16} /></IconButton></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 flex justify-end gap-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <Button variant="outlined" size="large" sx={{ px: 8, borderRadius: '8px' }} onClick={() => router.back()}>Discard</Button>
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 10,
              bgcolor: "#0ea5e9",
              borderRadius: '8px',
              boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.39)',
              '&:hover': { bgcolor: '#0284c7' }
            }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Create Product"}
          </Button>
        </div>
      </div>
    </ManagerLayout>
  );
}
