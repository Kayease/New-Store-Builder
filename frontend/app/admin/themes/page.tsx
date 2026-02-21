"use client";
import React, { useEffect, useMemo, useState } from "react";
import AdminGuard from "../../../components/AdminGuard";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import Icon from "../../../components/AppIcon";
import { PlatformThemes } from "../../../lib/api";
import Link from "next/link";

type ThemeItem = {
  thumbnail: any;
  buildZip: any;
  _id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  buildPath: string;
  createdAt?: string;
  status?: string;
};

function slugify(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function Page() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [buildZip, setBuildZip] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [query, setQuery] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<ThemeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [editBuildZip, setEditBuildZip] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<ThemeItem | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  // Real-time Build Logging
  const [logOpen, setLogOpen] = useState(false);
  const [activeLogSlug, setActiveLogSlug] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState("");
  const [isLogPolling, setIsLogPolling] = useState(false);

  const getThumbnailUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const apiBase = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
    ).replace("/api/v1", "");
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success"
  ) => setSnackbar({ open: true, message, severity });

  const slug = useMemo(() => slugify(name), [name]);

  const load = async () => {
    try {
      const res = await PlatformThemes.list();
      if (res?.items) setThemes(res.items);
    } catch (err) {
      console.error("Failed to load themes:", err);
      showSnackbar("Failed to load themes. The server may be busy.", "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Create preview URL for new thumbnail
  useEffect(() => {
    if (!thumbnail) {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumbnail);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  // Create preview URL for edit thumbnail
  useEffect(() => {
    if (!editThumbnail) {
      if (editThumbnailPreview) URL.revokeObjectURL(editThumbnailPreview);
      setEditThumbnailPreview(null);
      return;
    }
    const url = URL.createObjectURL(editThumbnail);
    setEditThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editThumbnail]);

  // Log Polling Logic
  useEffect(() => {
    let interval: any;
    if (logOpen && activeLogSlug) {
      const fetchLogs = async () => {
        try {
          const res = await PlatformThemes.getLogs(activeLogSlug);
          if (res?.logs) setBuildLogs(res.logs);
        } catch (err) {
          console.error("Log fetch error:", err);
        }
      };

      fetchLogs(); // Initial fetch
      interval = setInterval(fetchLogs, 2000); // Poll every 2s
    }
    return () => clearInterval(interval);
  }, [logOpen, activeLogSlug]);

  const openLogs = (slug: string) => {
    setActiveLogSlug(slug);
    setBuildLogs("Loading real-time logs...");
    setLogOpen(true);
  };

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !buildZip) {
      await load();
      return;
    }
    setSubmitting(true);
    setUploadProgress(0);
    try {
      await PlatformThemes.upload({
        name,
        slug,
        description,
        thumbnail,
        buildZip,
        onProgress: (percent) => setUploadProgress(percent)
      });
      const uploadedSlug = slug; // capture before clear
      setName("");
      setDescription("");
      setThumbnail(null);
      setBuildZip(null);
      setNewOpen(false);
      setNewOpen(false);

      // Auto-open logs for the new upload
      setTimeout(() => openLogs(uploadedSlug), 500);
    } catch (err) {
      console.error(err);
      showSnackbar("Upload failed", "error");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const openEdit = (t: ThemeItem) => {
    console.log("Opening edit for theme:", t.slug);
    setEditing(t);
    setEditName(t.name || "");
    setEditDescription(t.description || "");
    setEditStatus(t.status || "active");
    setEditThumbnail(null);
    setEditThumbnailPreview(null);
    setEditBuildZip(null);
    setNewOpen(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    console.log("Saving theme edits for:", editing.slug);
    setSubmitting(true);
    try {
      await PlatformThemes.update(editing.slug, {
        name: editName,
        description: editDescription,
        status: editStatus,
        thumbnail: editThumbnail || undefined,
        buildZip: editBuildZip || undefined,
      } as any);
      setEditing(null);
      await load();
      showSnackbar("Theme updated", "success");
    } catch (err) {
      console.error("Update error:", err);
      showSnackbar("Update failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (t: ThemeItem) => setDeleting(t);
  const doDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await PlatformThemes.remove(deleting.slug);
      setDeleting(null);
      await load();
      showSnackbar("Theme deleted", "success");
      setNewOpen(false);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Delete failed";
      showSnackbar(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return themes;
    return themes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [themes, query]);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Typography variant="h6" fontWeight={700}>
              Theme Management
            </Typography>
            <div className="flex items-center gap-2">
              <TextField
                size="small"
                placeholder="Search themes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ background: "white", minWidth: 260 }}
              />
              <Tooltip title="Upload a new theme from a build ZIP">
                <Button
                  variant="contained"
                  onClick={() => setNewOpen(true)}
                  startIcon={<Icon name="Upload" />}
                >
                  Upload Theme
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* New Theme Upload Dialog */}
          <Dialog
            open={newOpen}
            onClose={(_e, _r) => {
              if (submitting) return;
              setNewOpen(false);
            }}
            maxWidth="md"
            fullWidth
            PaperProps={{
              className: "rounded-lg",
            }}
          >
            <DialogTitle className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Upload New Theme
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Add a new theme to your collection
                  </p>
                </div>
                <IconButton
                  onClick={() => {
                    if (submitting) return;
                    setNewOpen(false);
                  }}
                  size="small"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="X" size={16} />
                </IconButton>
              </div>
            </DialogTitle>

            <DialogContent className="pt-6 pb-4">
              <form onSubmit={onUpload} className="space-y-6">
                {/* Theme Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 my-3">
                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Theme Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Theme Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      fullWidth
                      variant="outlined"
                      placeholder="Enter theme name"
                      helperText="Choose a descriptive name for your theme"
                    />

                    <TextField
                      label="Slug"
                      value={slug}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                        className: "bg-gray-50",
                      }}
                      helperText="Auto-generated from theme name"
                    />
                  </div>

                  <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    placeholder="Describe your theme's features and style..."
                    helperText={`${description.length}/500 characters`}
                    inputProps={{ maxLength: 500 }}
                  />
                </div>

                {/* File Uploads Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Files
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Thumbnail Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Thumbnail Image
                        <span className="text-gray-400 ml-1">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setThumbnail(e.target.files?.[0] || null)
                          }
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <label
                          htmlFor="thumbnail-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {thumbnailPreview ? (
                            <div className="flex flex-col items-center gap-2">
                              <img src={thumbnailPreview} alt="Thumbnail preview" className="h-24 w-36 object-cover rounded" />
                              <span className="text-xs text-gray-500">Click to change</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Icon
                                name="Upload"
                                size={16}
                                className="text-gray-400 mb-2"
                              />
                              <span className="text-sm text-gray-600">
                                Upload thumbnail
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                PNG, JPG up to 5MB
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Build ZIP Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Build ZIP
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".zip"
                          onChange={(e) =>
                            setBuildZip(e.target.files?.[0] || null)
                          }
                          required
                          className="hidden"
                          id="build-zip-upload"
                        />
                        <label
                          htmlFor="build-zip-upload"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${buildZip
                            ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                            }`}
                        >
                          {buildZip ? (
                            <div className="flex flex-col items-center">
                              <Icon
                                name="FolderZip"
                                size={16}
                                className="text-blue-600 mb-2"
                              />
                              <span className="text-sm text-gray-600 font-medium truncate max-w-full px-2">
                                {buildZip.name}
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                Click to change
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Icon
                                name="Upload"
                                size={16}
                                className="text-gray-400 mb-2"
                              />
                              <span className="text-sm text-gray-600">
                                Upload build ZIP
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                ZIP files only
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </DialogContent>

            <DialogActions className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <Button
                onClick={() => setNewOpen(false)}
                variant="outlined"
                disabled={submitting}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={(e) => onUpload(e as any)}
                disabled={submitting || !name || !buildZip}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 min-w-[140px]"
              >
                {submitting ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <CircularProgress size={16} className="text-white" />
                      <span>{uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Processing...'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Icon name="Upload" size={16} />
                    <span>Upload Theme</span>
                  </div>
                )}
              </Button>
            </DialogActions>
            {submitting && (
              <Box sx={{ width: '100%', px: 0 }}>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 4 }} />
              </Box>
            )}
          </Dialog>

          <Card
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Theme</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow key="no-themes">
                      <TableCell colSpan={5}>
                        <div className="py-16 grid place-items-center text-center">
                          <Icon
                            name="Palette"
                            size={48}
                            className="text-slate-400"
                          />
                          <Typography variant="h6" className="mt-2">
                            No Themes Found
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Upload a built theme zip to get started.
                          </Typography>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t, idx) => (
                      <TableRow key={t._id || t.slug || `theme-${idx}`} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-16 rounded overflow-hidden bg-slate-50 border grid place-items-center">
                              {t.thumbnailUrl ? (
                                // Using plain img for quick preview
                                <img
                                  src={getThumbnailUrl(t.thumbnailUrl) || ""}
                                  alt={t.name}
                                  className="h-10 w-16 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/600x400?text=No+Preview";
                                  }}
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
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{t.name}</div>
                                {t.status === "building" && (
                                  <div className="flex flex-col gap-1 w-full max-w-[140px]">
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100 animate-pulse">
                                      <CircularProgress size={8} thickness={6} />
                                      AI BUILDING
                                    </div>
                                    <div className="w-full">
                                      <LinearProgress
                                        variant="determinate"
                                        value={parseInt(t.description?.match(/\((\d+)%\)/)?.[1] || "0")}
                                        sx={{ height: 4, borderRadius: 2, mb: 0.5 }}
                                      />
                                      <div className="text-[9px] font-medium text-slate-400 italic px-1 truncate">
                                        {t.description || "Initializing..."}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {t.status === "failed" && (
                                  <div className="px-1.5 py-0.5 rounded bg-red-50 text-[10px] font-bold text-red-600 border border-red-100">
                                    FAILED
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(t.createdAt || "").toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            title={t.description}
                          >
                            {t.description || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <code>{t.slug}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {t.status === "building" && (
                              <Tooltip title="View Build Logs">
                                <IconButton onClick={() => openLogs(t.slug)} size="small">
                                  <Icon name="Terminal" size={18} className="text-gray-600" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {t.status === "active" ? (
                              <Tooltip title="Preview Theme">
                                <IconButton
                                  component="a"
                                  href={`/theme/${t.slug}/preview`}
                                  target="_blank"
                                  size="small"
                                >
                                  <Icon name="Eye" size={18} className="text-blue-500" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title={t.status === "building" ? "AI is currently building this theme..." : "Build failed"}>
                                <span>
                                  <IconButton size="small" onClick={() => openLogs(t.slug)}>
                                    <Icon name="EyeOff" size={18} className="text-slate-300" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            <Tooltip title="Edit Theme">
                              <IconButton onClick={() => openEdit(t)} size="small">
                                <Icon name="Pencil" size={18} className="text-green-600" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Theme">
                              <IconButton onClick={() => confirmDelete(t)} size="small">
                                <Icon name="Trash2" size={18} className="text-rose-500" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Theme Dialog */}
          <Dialog
            open={!!editing}
            onClose={() => setEditing(null)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              className: "rounded-lg",
            }}
          >
            <DialogTitle className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Edit Theme
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Update theme information and files
                  </p>
                </div>
                <IconButton
                  onClick={() => setEditing(null)}
                  size="small"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="X" size={16} />
                </IconButton>
              </div>
            </DialogTitle>

            <DialogContent className="pt-6 pb-4">
              <div className="space-y-6">
                {/* Theme Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Theme Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Theme Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder="Enter theme name"
                    />

                    <TextField
                      label="Slug"
                      value={editing?.slug || ""}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                        className: "bg-gray-50",
                      }}
                      helperText="Slug cannot be changed"
                    />
                  </div>

                  <TextField
                    label="Description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Describe your theme's features and style..."
                    helperText={`${editDescription.length}/500 characters`}
                    inputProps={{ maxLength: 500 }}
                  />

                  <TextField
                    select
                    label="Status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    fullWidth
                    variant="outlined"
                    helperText="Set theme availability"
                  >
                    <MenuItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Active</span>
                      </div>
                    </MenuItem>
                    <MenuItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span>Inactive</span>
                      </div>
                    </MenuItem>
                  </TextField>
                </div>

                {/* Current Files Section */}
                {(editing?.thumbnailUrl || editing?.buildPath) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-5 bg-purple-600 rounded-full" />
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Current Files
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editing?.thumbnailUrl && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                              <img
                                src={getThumbnailUrl(editing.thumbnailUrl)}
                                alt="Current thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase">
                                Thumbnail
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                Current image
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {editing?.buildPath && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <Icon
                                name="FolderZip"
                                size={16}
                                className="text-gray-400"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase">
                                Build ZIP
                              </p>
                              <p className="text-sm text-gray-700 mt-1 truncate">
                                {editing.buildPath.split("/").pop() ||
                                  "build.zip"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Replace Files Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Replace Files
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Replace Thumbnail */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        New Thumbnail
                        <span className="text-gray-400 ml-1">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditThumbnail(e.target.files?.[0] || null)
                          }
                          className="hidden"
                          id="edit-thumbnail-upload"
                        />
                        <label
                          htmlFor="edit-thumbnail-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {editThumbnailPreview ? (
                            <div className="flex flex-col items-center gap-2">
                              <img src={editThumbnailPreview} alt="New thumbnail" className="h-24 w-36 object-cover rounded" />
                              <span className="text-xs text-green-600">Will replace current</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Icon
                                name="Upload"
                                size={16}
                                className="text-gray-400 mb-2"
                              />
                              <span className="text-sm text-gray-600">
                                Upload new thumbnail
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                PNG, JPG up to 5MB
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Replace Build ZIP */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        New Build ZIP
                        <span className="text-gray-400 ml-1">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".zip"
                          onChange={(e) =>
                            setEditBuildZip(e.target.files?.[0] || null)
                          }
                          className="hidden"
                          id="edit-build-zip-upload"
                        />
                        <label
                          htmlFor="edit-build-zip-upload"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${editBuildZip
                            ? "border-green-300 bg-green-50 hover:bg-green-100"
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                            }`}
                        >
                          {editBuildZip ? (
                            <div className="flex flex-col items-center">
                              <Icon
                                name="CheckCircle"
                                size={16}
                                className="text-green-600 mb-2"
                              />
                              <span className="text-sm text-gray-600 font-medium truncate max-w-full px-2">
                                {editBuildZip.name}
                              </span>
                              <span className="text-xs text-green-600 mt-1">
                                Will replace current
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Icon
                                name="Upload"
                                size={16}
                                className="text-gray-400 mb-2"
                              />
                              <span className="text-sm text-gray-600">
                                Upload new build ZIP
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                ZIP files only
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  {(editThumbnail || editBuildZip) && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <Icon
                        name="Info"
                        size={16}
                        className="text-amber-600 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-sm text-amber-800">
                        {editThumbnail && editBuildZip
                          ? "Both files will be replaced when you save changes."
                          : editThumbnail
                            ? "The thumbnail will be replaced when you save changes."
                            : "The build ZIP will be replaced when you save changes."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
            <DialogActions className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <Button
                onClick={() => setEditing(null)}
                variant="outlined"
                disabled={submitting}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={saveEdit}
                disabled={submitting || !editName}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 min-w-[120px]"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <CircularProgress size={16} className="text-white" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Icon name="Save2" size={16} />
                    <span>Save Changes</span>
                  </div>
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Real-time Build Console Dialog */}
          <Dialog
            open={logOpen}
            onClose={() => setLogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              className: "bg-[#0d1117] rounded-xl overflow-hidden shadow-2xl border border-gray-800",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-[#161b22] border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="h-4 w-[1px] bg-gray-700 mx-2" />
                <div className="flex items-center gap-2">
                  <Icon name="Terminal" size={14} className="text-blue-400" />
                  <span className="text-sm font-bold text-gray-300 tracking-tight font-mono">
                    deployment-logs://{activeLogSlug}
                  </span>
                </div>
              </div>
              <IconButton
                onClick={() => setLogOpen(false)}
                size="small"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Icon name="X" size={18} />
              </IconButton>
            </div>

            <DialogContent className="p-0 bg-[#0d1117] relative">
              <div
                className="font-mono text-[13px] leading-relaxed p-6 h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent flex flex-col-reverse"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex flex-col gap-0.5">
                  {buildLogs ? buildLogs.split("\n").map((line, i) => {
                    const isError = line.includes("❌") || line.includes("FAILED") || line.toLowerCase().includes("error:");
                    const isCmd = line.includes("$");
                    const isStep = line.includes("---");

                    return (
                      <div key={i} className={`whitespace-pre-wrap break-all ${isError ? 'text-red-400 font-bold bg-red-400/5' : isCmd ? 'text-blue-400 font-bold' : isStep ? 'text-green-400 border-y border-green-500/10 py-1 my-2 bg-green-500/5' : 'text-gray-400'}`}>
                        {line || " "}
                      </div>
                    );
                  }) : (
                    <div className="text-gray-500 animate-pulse italic">Initializing stream...</div>
                  )}
                  {/* Anchor for auto-scroll */}
                  <div id="logs-end" />
                </div>
              </div>

              <div className="absolute bottom-4 right-6 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Live Streaming</span>
                </div>
              </div>
            </DialogContent>

            <div className="px-6 py-3 bg-[#161b22] border-t border-gray-800 flex justify-between items-center">
              <div className="text-[11px] text-gray-500 font-mono">
                Location: /uploads/themes/{activeLogSlug}/build_log.txt
              </div>
              <Button
                size="small"
                className="text-gray-400 hover:text-white font-mono text-xs capitalize"
                onClick={() => setBuildLogs("")}
              >
                Clear View
              </Button>
            </div>
          </Dialog>

          {/* Delete Confirm */}
          <Dialog
            open={!!deleting}
            onClose={() => setDeleting(null)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Theme</DialogTitle>
            <DialogContent dividers>
              <Typography>
                Are you sure you want to delete <b>{deleting?.name}</b>? This
                will remove its files.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => setDeleting(null)}
                disabled={submitting}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={doDelete}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <CircularProgress size={16} className="text-white" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Icon name="Trash2" size={16} />
                    <span>Delete</span>
                  </div>
                )}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
