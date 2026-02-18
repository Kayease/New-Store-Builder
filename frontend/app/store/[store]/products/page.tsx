"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStoreCtx } from "../../../../contexts/StoreContext";
import {
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Switch,
    IconButton,
    MenuItem,
} from "@mui/material";
import Link from "next/link";
import Icon from "../../../../components/AppIcon";
import { MerchantAPI } from "../../../../lib/merchant-api";
import Loader from "../../../../components/Loader";

type Row = {
    id: string;
    name: string;
    category: string;
    brand: string;
    price: number;
    published: boolean;
    featured?: boolean;
    trending?: boolean;
    onSale?: boolean;
    image?: string;
    status?: string;
};

export default function Page() {
    const params = useParams();
    const storeSlug = params?.store as string;
    const { setPageTitle } = useStoreCtx();

    useEffect(() => {
        setPageTitle("Product Management");
    }, [setPageTitle]);

    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [brandFilter, setBrandFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    React.useEffect(() => {
        setLoading(true);
        // Note: MerchantAPI might need to know the store. 
        // If list() fetches for the *current user's* active store, it might work if the token has the store context.
        // However, usually detailed APIs need the store ID/Slug.
        // Assuming list() works for now as it did in Manager.
        MerchantAPI.products.list()
            .then((res: any) => {
                if (res.success && res.data) {
                    const formatted = res.data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        category: p.category_name || "Uncategorized",
                        brand: p.brand || "Generic",
                        price: Number(p.price),
                        published: p.status === "active",
                        featured: p.is_featured,
                        trending: p.is_trending,
                        onSale: !!p.compare_at_price,
                        image: p.images?.[0] || ""
                    }));
                    setRows(formatted);
                }
            })
            .catch(err => console.error("Products fetch error:", err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const inText = (r: Row) =>
            [r.name, r.category, r.brand].join(" ").toLowerCase().includes(q);
        const inBrand = (r: Row) => (brandFilter ? r.brand === brandFilter : true);
        const inCat = (r: Row) =>
            categoryFilter ? r.category === categoryFilter : true;
        const inPrice = (r: Row) => {
            const min = minPrice ? Number(minPrice) : -Infinity;
            const max = maxPrice ? Number(maxPrice) : Infinity;
            return r.price >= min && r.price <= max;
        };
        return rows.filter(
            (r) => inText(r) && inBrand(r) && inCat(r) && inPrice(r)
        );
    }, [rows, query, brandFilter, categoryFilter, minPrice, maxPrice]);

    const brands = useMemo(
        () => Array.from(new Set(rows.map((r) => r.brand))),
        [rows]
    );
    const categories = useMemo(
        () => Array.from(new Set(rows.map((r) => r.category))),
        [rows]
    );

    const allSelected =
        filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id));
    const toggleSelectAll = (checked: boolean) => {
        if (checked)
            setSelectedIds(
                Array.from(new Set([...selectedIds, ...filtered.map((r) => r.id)]))
            );
        else
            setSelectedIds((prev) =>
                prev.filter((id) => !filtered.some((r) => r.id === id))
            );
    };
    const toggleSelect = (id: string, checked: boolean) =>
        setSelectedIds((prev) =>
            checked ? [...prev, id] : prev.filter((x) => x !== id)
        );

    if (loading) return <Loader />;

    return (
        <>
            <div className="space-y-6 max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-between">
                    <Typography variant="h5" fontWeight={700} className="text-slate-800">
                        Products
                    </Typography>
                    <div className="flex items-center gap-2">
                        <TextField
                            size="small"
                            placeholder="Search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            sx={{ background: "white", minWidth: 260 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Icon name="Search" size={16} className="text-slate-400" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            component={Link}
                            href={`/store/${storeSlug}/products/new`}
                            variant="contained"
                            startIcon={<Icon name="Plus" />}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: "bold" }}
                        >
                            Add Product
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card
                    elevation={0}
                    sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "visible" }}
                >
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <TextField
                                size="small"
                                label="Min Price"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">$</InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                size="small"
                                label="Max Price"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">$</InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                size="small"
                                label="Brand"
                                select
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {brands.map((b) => (
                                    <MenuItem key={b} value={b}>
                                        {b}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                size="small"
                                label="Category"
                                select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {categories.map((c) => (
                                    <MenuItem key={c} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        setBrandFilter("");
                                        setCategoryFilter("");
                                        setMinPrice("");
                                        setMaxPrice("");
                                    }}
                                    startIcon={<Icon name="X" size={14} />}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    elevation={0}
                    sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}
                >
                    <Table>
                        <TableHead sx={{ bgcolor: "#f8fafc" }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={(e) => toggleSelectAll(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <div className="py-20 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                <Icon name="Package" size={32} className="text-slate-400" />
                                            </div>
                                            <Typography variant="h6" className="text-slate-800">
                                                No Products Found
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mt: 1, mb: 3 }}>
                                                Get started by adding your first product to the catalog.
                                            </Typography>
                                            <Button
                                                component={Link}
                                                href={`/store/${storeSlug}/products/new`}
                                                variant="contained"
                                                startIcon={<Icon name="Plus" />}
                                                sx={{ borderRadius: 2, textTransform: "none" }}
                                            >
                                                Add Product
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((r) => (
                                    <TableRow key={r.id} hover>
                                        <TableCell padding="checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(r.id)}
                                                onChange={(e) => toggleSelect(r.id, e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-50 border grid place-items-center">
                                                    {r.image ? (
                                                        <img
                                                            src={r.image}
                                                            alt={r.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Icon
                                                            name="Image"
                                                            size={16}
                                                            className="text-slate-400"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{r.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{r.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {r.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>{r.brand}</TableCell>
                                        <TableCell className="font-medium text-slate-900">{`$${r.price.toFixed(2)}`}</TableCell>
                                        <TableCell>
                                            <Switch
                                                size="small"
                                                checked={r.published}
                                                onChange={() => setRows(prev => prev.map(x => x.id === r.id ? { ...x, published: !x.published } : x))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <IconButton
                                                    component={Link}
                                                    href={`/store/${storeSlug}/products/new?edit=${r.id}`}
                                                    size="small"
                                                    className="hover:bg-indigo-50 hover:text-indigo-600"
                                                >
                                                    <Icon name="Pencil" size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    className="hover:bg-red-50 hover:text-red-600"
                                                    onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                                                >
                                                    <Icon name="Trash2" size={16} />
                                                </IconButton>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </>
    );
}
