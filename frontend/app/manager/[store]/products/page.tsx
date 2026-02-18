"use client";
import React, { useMemo, useState, useEffect } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
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
    <ManagerLayout title="Product Management">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Typography variant="h6" fontWeight={700}>
            Product List
          </Typography>
          <div className="flex items-center gap-2">
            <TextField
              size="small"
              placeholder="Search Product..."
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
            <Button variant="outlined" startIcon={<Icon name="FileDown" />}>
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Icon name="FileSpreadsheet" />}
            >
              Export XLSX
            </Button>
            <Button
              component={Link}
              href="./products/new"
              variant="contained"
              startIcon={<Icon name="Plus" />}
            >
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedIds.length > 0 && (
          <Card
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <CardContent>
              <div className="flex items-center justify-between">
                <Typography>{selectedIds.length} selected</Typography>
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<Icon name="Trash2" />}
                    onClick={() =>
                      setRows((prev) =>
                        prev.filter((r) => !selectedIds.includes(r.id))
                      )
                    }
                  >
                    Delete
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon name="Download" />}
                  >
                    Export selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Show / Hide</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell>Trending</TableCell>
                  <TableCell>On Sale</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <div className="py-16 grid place-items-center text-center">
                        <Icon
                          name="Boxes"
                          size={48}
                          className="text-slate-400"
                        />
                        <Typography variant="h6" className="mt-2">
                          No Products Found
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Click the Add Product button to create your first
                          product.
                        </Typography>
                        <div className="mt-4">
                          <Button
                            component={Link}
                            href="./products/new"
                            variant="contained"
                            startIcon={<Icon name="Plus" />}
                          >
                            Add Product
                          </Button>
                        </div>
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
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded overflow-hidden bg-slate-50 border grid place-items-center">
                            {r.image ? (
                              <img
                                src={r.image}
                                alt={r.name}
                                className="h-9 w-9 object-cover"
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
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-slate-500">{r.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.brand}</TableCell>
                      <TableCell>{`$${r.price.toFixed(2)}`}</TableCell>
                      <TableCell>
                        <Switch
                          checked={r.published}
                          onChange={() =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, published: !x.published }
                                  : x
                              )
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!r.featured}
                          onChange={() =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, featured: !x.featured }
                                  : x
                              )
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!r.trending}
                          onChange={() =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, trending: !x.trending }
                                  : x
                              )
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!r.onSale}
                          onChange={() =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, onSale: !x.onSale } : x
                              )
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          component={Link}
                          href={`./products/new?edit=${encodeURIComponent(
                            r.id
                          )}`}
                        >
                          <Icon name="Pencil" />
                        </IconButton>
                        <IconButton>
                          <Icon name="Eye" />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            setRows((prev) => prev.filter((x) => x.id !== r.id))
                          }
                        >
                          <Icon name="Trash2" className="text-rose-500" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
  );
}
