"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Alert,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { TableLoadingWrapper } from "../../../../components/ui/LoadingWrapper";
import Snackbar from "@mui/material/Snackbar";
import { ManagerAPI } from "../../../../lib/manager-api";

export default function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<
    {
      id: string;
      name: string;
      image?: string;
      level: number;
      featured: boolean;
    }[]
  >([]);
  const [form, setForm] = useState({
    name: "",
    parent: "",
    featured: false,
  });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  // Fetch all categories from backend
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res: any = await ManagerAPI.categories.list();
      // Try res.items, res.data, res.categories, res directly (compat)
      const categoryArr = res.items || res.data || res.categories || res || [];
      setRows(
        categoryArr.map((c: any) => ({
          id: c._id,
          name: c.name,
          image: c.image,
          level: c.level || 1,
          featured: c.featured || false,
          parent: c.parent,
        }))
      );
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to load categories",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      let formData: FormData | null = null;
      if (categoryImageFile) {
        formData = new FormData();
        formData.append("name", form.name);
        if (form.parent) formData.append("parent", form.parent);
        formData.append("featured", String(form.featured));
        formData.append("image", categoryImageFile);
        // === DEBUG LOGGING ===
        Array.from(formData.entries()).forEach((pair) => {});
        // === END DEBUG ===
      }
      let result: any;
      if (formData) {
        result = await ManagerAPI.categories.create(formData);
      } else {
        // No image. send as simple JSON
        const payload: any = { name: form.name, featured: form.featured };
        if (form.parent) payload.parent = form.parent;
        result = await ManagerAPI.categories.create(payload);
      }
      if (result && result.success && result.data) {
        setSnackbar({
          open: true,
          message: "Category created successfully",
          severity: "success",
        });
        setOpen(false);
        setForm({ name: "", parent: "", featured: false });
        setPreview("");
        setCategoryImageFile(null);
        if (fileRef.current) fileRef.current.value = "";
        await fetchRows();
      }
    } catch (err: any) {
      let message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create category";
      if (message.includes("E11000") || message.includes("duplicate key error")) {
        message =
          "A category with this name already exists. Please choose a unique name.";
      }
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openPicker = () => fileRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
    setCategoryImageFile(f);
  };
  const onUrlChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, image: val }));
    setPreview(val);
  };
  const clearImage = () => {
    setPreview("");
    setCategoryImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Delete category logic
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await ManagerAPI.categories.delete(deleteId);
      setSnackbar({ open: true, message: "Category deleted", severity: "success" });
      setDeleteId(null);
      fetchRows();
    } catch (err: any) {
      let message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete category";
      // Friendlier message for duplicate
      if (message.includes("E11000") || message.includes("duplicate key error")) {
        message =
          "A category with this name already exists. Please choose a unique name.";
      }
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const isEmpty = filtered.length === 0;

  return (
    <ManagerLayout title="Categories Management">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Typography variant="h6" fontWeight={700}>
            Product Categories
          </Typography>
          <div className="flex items-center gap-2">
            <TextField
              size="small"
              placeholder="Search Category..."
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
              variant="contained"
              startIcon={<Icon name="Plus" />}
              onClick={() => setOpen(true)}
            >
              Add Category
            </Button>
          </div>
        </div>

        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            <TableLoadingWrapper isLoading={loading}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Featured</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isEmpty ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="py-16 grid place-items-center text-center">
                          <Icon
                            name="Layers"
                            size={48}
                            className="text-slate-400"
                          />
                          <Typography variant="h6" className="mt-2">
                            No Categories Added Yet
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Click the Add Category button to create a new one.
                          </Typography>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.name}
                            color="default"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{r.level}</TableCell>
                        <TableCell>
                          <Switch
                            checked={r.featured}
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
                          <IconButton>
                            <Icon name="Pencil" />
                          </IconButton>
                          <IconButton onClick={() => setDeleteId(r.id)}>
                            <Icon name="Trash2" className="text-rose-500" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableLoadingWrapper>
          </CardContent>
        </Card>

        {/* Create Category */}
        <Dialog
          open={open}
          onClose={() => (saving ? undefined : setOpen(false))}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Create Category</DialogTitle>
          <DialogContent
            dividers
            style={saving ? { opacity: 0.7, pointerEvents: "none" } : {}}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Select
                value={form.parent}
                onChange={(e) =>
                  setForm({ ...form, parent: String(e.target.value) })
                }
                displayEmpty
              >
                <MenuItem value="">Select Parent Category</MenuItem>
                {rows.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
              <div className="lg:col-span-2 border-2 border-dashed rounded-lg p-8 text-center text-slate-600">
                {!preview ? (
                  <>
                    <div className="font-medium">
                      Drop file here or click to upload
                    </div>
                    <div className="my-2 text-xs">&nbsp;</div>
                    <div>
                      <Button
                        variant="outlined"
                        startIcon={<Icon name="Upload" />}
                        onClick={openPicker}
                      >
                        Select Files
                      </Button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                      />
                    </div>
                    <div className="mt-3 text-xs">
                      Only image files are allowed (required)
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-52  object-cover rounded"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Icon name="RefreshCcw" />}
                        onClick={openPicker}
                      >
                        Change
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<Icon name="Trash2" />}
                        onClick={clearImage}
                      >
                        Remove
                      </Button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 lg:col-span-2">
                <Switch
                  checked={form.featured}
                  onChange={(_, v) => setForm({ ...form, featured: v })}
                />
                <span className="text-sm">Featured Category</span>
              </div>
            </div>
            {saving && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(255,255,255,0.7)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  name="Loader"
                  className="animate-spin text-blue-500"
                  size={32}
                />
                <span className="ml-2 text-blue-500 font-medium">
                  Saving...
                </span>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={saving}
              startIcon={
                saving ? (
                  <Icon name="Loader" className="animate-spin" size={16} />
                ) : undefined
              }
            >
              {saving ? "Saving..." : "Save Category"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent dividers>
            <Typography>
              Are you sure you want to delete this category?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar  */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() =>
            setSnackbar({ open: false, message: "", severity: "success" })
          }
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ManagerLayout>
  );
}
