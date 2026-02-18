"use client";
import React, { useMemo, useRef, useState } from "react";
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
  InputAdornment,
  Snackbar,
  Alert,
  Switch,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";

export default function BrandsPage() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", featured: false });
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [brandImageFile, setBrandImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });
  const [editId, setEditId] = useState<string | null>(null);
  const [currentForDelete, setCurrentForDelete] = useState<any | null>(null);

  // --- Fetch all brands ---
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res: any = await ManagerAPI.brands.list();
      const brandArr = res.items || res.data || res.brands || res || [];
      setRows(
        brandArr.map((b: any) => ({
          id: b._id,
          name: b.name,
          image: b.image,
          featured: b.featured,
          createdAt: b.createdAt, // <-- keep the date!
        }))
      );
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to load brands",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRows();
  }, []);

  // --- Save (create/update) ---
  const save = async () => {
    if (!form.name.trim()) {
      setSnackbar({
        open: true,
        message: "Brand name is required.",
        severity: "error",
      });
      return;
    }
    setSaving(true);
    try {
      let formData = new FormData();
      formData.append("name", form.name);
      formData.append("featured", String(form.featured));
      if (brandImageFile) formData.append("image", brandImageFile);

      let result: any;
      if (editId) {
        result = await ManagerAPI.brands.update(editId, formData);
        if (result && result.success) {
          setSnackbar({
            open: true,
            message: "Brand updated successfully!",
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: result?.message || "Failed to update brand",
            severity: "error",
          });
        }
      } else {
        result = await ManagerAPI.brands.create(formData);
        if (result && result.success) {
          setSnackbar({
            open: true,
            message: "Brand created successfully!",
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: result?.message || "Failed to create brand",
            severity: "error",
          });
        }
      }

      if (result && result.success && result.data) {
        setOpen(false);
        setForm({ name: "", featured: false });
        setPreview("");
        setBrandImageFile(null);
        setEditId(null);
        await fetchRows();
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to save brand",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteId) {
      setSnackbar({
        open: true,
        message: "No brand selected for deletion.",
        severity: "error",
      });
      return;
    }
    setSaving(true);
    try {
      const result = await ManagerAPI.brands.delete(deleteId);
      if (result) {
        setSnackbar({
          open: true,
          message: "Brand deleted successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to delete brand",
          severity: "error",
        });
      }
      setDeleteId(null);
      fetchRows();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete brand",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const openPicker = () => pickerRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
    setBrandImageFile(f);
    setSnackbar({
      open: true,
      message: "Image ready for upload. Don't forget to save!",
      severity: "warning",
    });
  };
  const clearImage = () => {
    setPreview("");
    setBrandImageFile(null);
    if (pickerRef.current) pickerRef.current.value = "";
    setSnackbar({
      open: true,
      message: "Image removed.",
      severity: "warning",
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const isEmpty = filtered.length === 0;

  // --- Toggle Featured ---
  const toggleFeatured = async (row: any) => {
    try {
      const result = await ManagerAPI.brands.update(row.id, {
        featured: !row.featured,
      });
      if (result) {
        setSnackbar({
          open: true,
          message: `Brand "${row.name}" is ${
            row.featured ? "no longer" : "now"
          } featured.`,
          severity: "success",
        });
        fetchRows();
      } else {
        setSnackbar({
          open: true,
          message: "Failed to update featured status",
          severity: "error",
        });
      }
    } catch (e: any) {
      setSnackbar({
        open: true,
        message: "Failed to update featured status",
        severity: "error",
      });
    }
  };

  // --- Open EDIT ---
  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({ name: b.name, featured: b.featured });
    setPreview(b.image || "");
    setOpen(true);
    setBrandImageFile(null);
    setSnackbar({
      open: true,
      message: "Editing brand details.",
      severity: "warning",
    });
  };

  // --- Open DELETE with context ---
  const onDeleteRequest = (row: any) => {
    setCurrentForDelete(row);
    setDeleteId(row.id);
    setSnackbar({
      open: true,
      message: `Ready to delete "${row.name}". Please confirm.`,
      severity: "warning",
    });
  };

  return (
    <ManagerLayout title="Brands Management">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Typography variant="h6" fontWeight={700}>
            Brands
          </Typography>
          <div className="flex items-center gap-2">
            <TextField
              size="small"
              placeholder="Search Brands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ background: "white", minWidth: 220 }}
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
              onClick={() => {
                setOpen(true);
                setEditId(null);
                setForm({ name: "", featured: false });
                setPreview("");
                setBrandImageFile(null);
              }}
              startIcon={<Icon name="Plus" />}
            >
              Add Brand
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Logo</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="py-16 grid place-items-center text-center">
                        <Icon
                          name="Briefcase"
                          size={48}
                          className="text-slate-400"
                        />
                        <Typography variant="h6" className="mt-2">
                          No Brands Added Yet
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Create your first brand by clicking the + button
                          above.
                        </Typography>
                        <div className="mt-4">
                          <Button
                            variant="contained"
                            onClick={() => {
                              setOpen(true);
                              setEditId(null);
                            }}
                            startIcon={<Icon name="Plus" />}
                          >
                            Add Brand
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>
                        {r.image ? (
                          <img
                            src={r.image}
                            alt={r.name}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <Icon
                            name="Image"
                            size={24}
                            className="text-slate-400"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!r.featured}
                          onChange={() => toggleFeatured(r)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        {r.createdAt ? (
                          <Typography variant="body2" color="text.secondary">
                            {new Date(r.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() => openEdit(r)}
                          >
                            <Icon name="Pencil" className="text-green-500" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => onDeleteRequest(r)}
                          >
                            <Icon name="Trash2" className="text-rose-500" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Brand Dialog */}
        <Dialog
          open={open}
          onClose={() => {
            setOpen(false);
            setEditId(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{editId ? "Edit Brand" : "Create Brand"}</DialogTitle>
          <DialogContent dividers>
            <div className="space-y-4">
              <TextField
                label="Brand Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                fullWidth
              />
              <div className="flex items-center gap-3 mt-2">
                <Switch
                  checked={!!form.featured}
                  onChange={(_, v) => setForm((f) => ({ ...f, featured: v }))}
                  color="primary"
                />
                <span className="text-sm">Featured Brand</span>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-600">
                {!preview ? (
                  <>
                    <Icon
                      name="Upload"
                      className="text-slate-400 text-center mx-auto"
                    />
                    <div className="mt-2 font-medium">
                      Drop file here or click to upload
                    </div>
                    <Button
                      variant="outlined"
                      startIcon={<Icon name="Upload" />}
                      onClick={openPicker}
                    >
                      Select Files
                    </Button>
                    <input
                      ref={pickerRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={preview}
                      alt="Logo Preview"
                      className="h-32 object-contain rounded"
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
                    </div>
                    <input
                      ref={pickerRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpen(false);
                setEditId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={16} className="text-blue-500" />
                ) : (
                  <Icon name="Save" />
                )
              }
            >
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Enhanced Delete Confirm Dialog */}
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Delete Brand</DialogTitle>
          <DialogContent dividers>
            {currentForDelete && (
              <div style={{ textAlign: "center" }}>
                {currentForDelete.image ? (
                  <img
                    src={currentForDelete.image}
                    alt={currentForDelete.name}
                    style={{
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 12,
                      marginBottom: 12,
                      display: "inline",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  />
                ) : (
                  <Icon
                    name="Image"
                    size={56}
                    style={{
                      marginBottom: 12,
                      color: "#cbd5e1",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  />
                )}
                <Typography variant="h6" gutterBottom>
                  {currentForDelete.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Are you sure you want to delete this brand?
                </Typography>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={16} className="text-blue-500" />
                ) : (
                  <Icon name="Trash2" />
                )
              }
            >
              {saving ? "Deleting..." : "Delete"}
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
