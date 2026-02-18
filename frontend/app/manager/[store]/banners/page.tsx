"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Skeleton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";

type UIBanner = {
  id: string;
  title?: string;
  url?: string;
  image: string;
  active: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
};

export default function Page() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<UIBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.title ?? "", r.url ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query]);

  // Upload dialog state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setTitle("");
    setLink("");
    setImage("");
    setImageFile(null);
    setDragOver(false);
    setCtaLabel("");
    setCtaUrl("");
  };

  const openDialog = () => {
    resetForm();
    setOpen(true);
  };

  const onPick = () => fileRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImage(URL.createObjectURL(f));
    setImageFile(f);
  };
  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragOver = (e: React.DragEvent) => {
    prevent(e);
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    prevent(e);
    setDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    prevent(e);
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setImage(URL.createObjectURL(f));
    setImageFile(f);
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res: any = await ManagerAPI.banners.list();
      const items = (res?.data?.items || res?.items || []).map(
        (b: any): UIBanner => ({
          id: b._id,
          title: b.title,
          url: b.linkUrl,
          image: b.imageUrl,
          active: Boolean(b.isActive),
          ctaLabel: b.ctaLabel,
          ctaUrl: b.ctaUrl,
        })
      );
      setRows(items);
    } catch (e) {
      console.error("Failed to load banners", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const save = async () => {
    if (!imageFile) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("image", imageFile);
      if (title) fd.append("title", title);
      if (link) fd.append("linkUrl", link);
      if (ctaLabel) fd.append("ctaLabel", ctaLabel);
      if (ctaUrl) fd.append("ctaUrl", ctaUrl);
      await ManagerAPI.banners.create(fd);
      setOpen(false);
      resetForm();
      await fetchBanners();
      setSnackbar({
        open: true,
        message: "Banner created successfully",
        severity: "success",
      });
    } catch (e) {
      console.error("Create banner failed", e);
      setSnackbar({
        open: true,
        message: "Failed to create banner",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => setConfirmId(id);

  const remove = async (id: string) => {
    try {
      setDeletingId(id);
      await ManagerAPI.banners.delete(id);
      // Reload from server to ensure the list reflects backend state
      await fetchBanners();
    } catch (e) {
      console.error("Delete banner failed", e);
      setSnackbar({
        open: true,
        message: "Failed to delete banner",
        severity: "error",
      });
    } finally {
      setDeletingId(null);
      setConfirmId(null);
      setSnackbar({
        open: true,
        message: "Banner deleted successfully",
        severity: "success",
      });
    }
  };

  return (
    <ManagerLayout title="Banners Management">
      <div className="max-w-[1400px] mx-auto">
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          {(loading || saving) && <LinearProgress />}
          <CardContent sx={{ paddingRight: 5, paddingLeft: 5 }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <TextField
                placeholder="Search banners..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ width: 320 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">🔎</InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<Icon name="Plus" />}
                onClick={openDialog}
              >
                Add Banner
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Skeleton variant="rectangular" width={112} height={56} />
                    <Skeleton variant="text" sx={{ width: 220 }} />
                    <Skeleton variant="text" sx={{ width: 260 }} />
                    <Skeleton variant="text" sx={{ width: 160 }} />
                    <Skeleton variant="rectangular" width={64} height={36} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 bg-gray-50 rounded border border-dashed text-center">
                <div className="mb-2 text-5xl">🖼️</div>
                <Typography variant="h6" gutterBottom>
                  No Banners Added Yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Create your first banner by clicking the + button in the top
                  right corner.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Icon name="Plus" />}
                  onClick={openDialog}
                >
                  Add Banner
                </Button>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Link</TableCell>
                    <TableCell>CTA</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <div className="w-28 h-14 rounded overflow-hidden border bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.image}
                            alt={r.title ?? "banner"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{r.title ?? "—"}</TableCell>
                      <TableCell>
                        {r.url ? (
                          <a
                            href={r.url}
                            className="text-primary-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.url}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {r.ctaLabel || r.ctaUrl ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {r.ctaLabel ?? "Button"}
                            </span>
                            {r.ctaUrl ? (
                              <a
                                href={r.ctaUrl}
                                className="text-primary-600 hover:underline text-sm"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {r.ctaUrl}
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          fontWeight={600}
                          color={r.active ? "#16a34a" : "#b91c1c"}
                          className={
                            r.active ? "text-green-500" : "text-rose-500"
                          }
                        >
                          {r.active ? "Active" : "Inactive"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Tooltip title="Status">
                          <IconButton
                            size="small"
                            color={r.active ? "primary" : "default"}
                            onClick={async () => {
                              try {
                                setTogglingId(r.id);
                                await ManagerAPI.banners.toggleActive(r.id);
                                setRows((prev) =>
                                  prev.map((x) =>
                                    x.id === r.id
                                      ? { ...x, active: !x.active }
                                      : x
                                  )
                                );
                              } catch (err) {
                                console.error("Toggle failed", err);
                              } finally {
                                setTogglingId(null);
                              }
                            }}
                            disabled={togglingId === r.id}
                          >
                            {r.active ? (
                              <Icon name="Pause" className="text-blue-500" />
                            ) : (
                              <Icon name="Play" className="text-green-500" />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmDelete(r.id)}
                            disabled={deletingId === r.id}
                          >
                            <Icon name="Trash2" className="text-rose-500" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{saving ? "Uploading..." : "Upload Image"}</DialogTitle>
        <DialogContent dividers>
          <div
            className={`border-2 border-dashed rounded p-8 text-center ${
              dragOver ? "border-primary-500 bg-primary-50" : "border-gray-300"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center gap-2">
              <Icon name="UploadCloud" className="text-gray-600" />
              <Typography fontWeight={600}>Upload Image</Typography>
              <Typography color="text.secondary">
                Upload jpg, png images with a maximum size of 20 MB
              </Typography>
              <div className="flex gap-2 mt-3">
                <Button variant="outlined" onClick={onPick} disabled={saving}>
                  Choose file
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setImage("");
                    setImageFile(null);
                  }}
                  disabled={saving}
                >
                  Clear
                </Button>
              </div>
              {image && (
                <div className="mt-4 w-full flex items-center justify-center">
                  <div className="w-72 h-36 rounded overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <TextField
              label="Banner title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Link (optional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              fullWidth
            />
            <TextField
              label="CTA button label (optional)"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              fullWidth
            />
            <TextField
              label="CTA link (optional)"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={!imageFile || saving}
            startIcon={
              saving ? (
                <CircularProgress size={16} className="text-blue-500" />
              ) : (
                <Icon name="Upload" />
              )
            }
          >
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Banner</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this banner?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setConfirmId(null)}
            disabled={!!deletingId}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmId && remove(confirmId)}
            disabled={!!deletingId}
            startIcon={
              deletingId ? (
                <CircularProgress size={16} className="text-blue-500" />
              ) : (
                <Icon name="Trash2" />
              )
            }
          >
            {deletingId ? "Deleting..." : "Delete"}
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
    </ManagerLayout>
  );
}
