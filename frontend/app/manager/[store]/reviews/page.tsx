"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";

type Review = {
  id: string;
  userName: string;
  userEmail?: string;
  title?: string;
  content?: string;
  rating: number;
  images: string[];
  status: "new" | "approved" | "rejected";
};

export default function Page() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "new" | "approved" | "rejected"
  >("all");
  const [ratingFilter, setRatingFilter] = useState<"any" | 1 | 2 | 3 | 4 | 5>(
    "any"
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    title: "",
    content: "",
    rating: 5,
    productId: "demo-product-id",
    orderId: "demo-order-id",
    userId: "demo-user-id",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      [r.userName, r.userEmail || "", r.title || "", r.content || ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (ratingFilter !== "any") params.rating = ratingFilter;
      params.page = page + 1;
      params.limit = rowsPerPage;
      const res: any = await ManagerAPI.reviews.list(params);
      const items = (res?.data?.items || res?.items || []).map(
        (x: any): Review => ({
          id: x._id,
          userName: x.userName,
          userEmail: x.userEmail,
          title: x.title,
          content: x.content,
          rating: x.rating,
          status: x.status,
          images: (x.images || []).map((i: any) => i.url),
        })
      );
      setRows(items);
      const totalFromServer =
        res?.data?.total ?? res?.data?.data?.total ?? res?.total ?? 0;
      setTotal(Number(totalFromServer) || 0);
    } catch (e) {
      console.error("Failed to load reviews", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, ratingFilter, page, rowsPerPage]);

  const createReview = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("userName", form.userName);
      if (form.userEmail) fd.append("userEmail", form.userEmail);
      if (form.title) fd.append("title", form.title);
      if (form.content) fd.append("content", form.content);
      fd.append("rating", String(form.rating));
      fd.append("productId", form.productId);
      fd.append("orderId", form.orderId);
      fd.append("userId", form.userId);
      imageFiles.forEach((f) => fd.append("images", f));
      await ManagerAPI.reviews.create(fd);
      setOpen(false);
      setForm({
        userName: "",
        userEmail: "",
        title: "",
        content: "",
        rating: 5,
        productId: "demo-product-id",
        orderId: "demo-order-id",
        userId: "demo-user-id",
      });
      setImageFiles([]);
      await fetchReviews();
      setSnackbar({
        open: true,
        message: "Review created (dev)",
        severity: "success",
      });
    } catch (e) {
      console.error("Create review failed", e);
      setSnackbar({
        open: true,
        message: "Failed to create review",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await ManagerAPI.reviews.updateStatus(id, status);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: status as any } : r))
      );
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Failed to update status",
        severity: "error",
      });
    }
  };

  const remove = async (id: string) => {
    try {
      setDeletingId(id);
      await ManagerAPI.reviews.delete(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setSnackbar({
        open: true,
        message: "Review deleted",
        severity: "success",
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Failed to delete",
        severity: "error",
      });
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const isDev =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_MODE !== "production";

  return (
    <ManagerLayout title="Ratings & Reviews">
      <div className="max-w-[1400px] mx-auto">
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          {loading && <LinearProgress />}
          <CardContent sx={{ paddingRight: 5, paddingLeft: 5 }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <TextField
                placeholder="Search reviews..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ width: 360 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">🔎</InputAdornment>
                  ),
                }}
              />
              <div className="flex items-center gap-3">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="rating-filter-label">Rating</InputLabel>
                  <Select
                    labelId="rating-filter-label"
                    value={ratingFilter as any}
                    label="Rating"
                    onChange={(e) => setRatingFilter(e.target.value as any)}
                  >
                    <MenuItem value="any">All</MenuItem>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={4}>4</MenuItem>
                    <MenuItem value={3}>3</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                    <MenuItem value={1}>1</MenuItem>
                  </Select>
                </FormControl>
                {isDev && (
                  <Button
                    variant="contained"
                    startIcon={<Icon name="Plus" />}
                    onClick={() => setOpen(true)}
                  >
                    Create Review (Dev)
                  </Button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-24 bg-gray-50 rounded border border-dashed text-center">
                <div className="mb-2 text-5xl">⭐</div>
                <Typography variant="h6" gutterBottom>
                  No Reviews Yet
                </Typography>
                <Typography color="text.secondary">
                  Users haven’t left reviews yet.
                </Typography>
              </div>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Content</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Images</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{r.userName}</span>
                            <span className="text-xs text-slate-500">
                              {r.userEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Rating value={r.rating} precision={0.5} readOnly />
                        </TableCell>
                        <TableCell>{r.title || "—"}</TableCell>
                        <TableCell>
                          <Typography
                            className="max-w-[360px]"
                            noWrap
                            title={r.content || ""}
                          >
                            {r.content || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.status}
                            size="small"
                            color={
                              r.status === "approved"
                                ? "success"
                                : r.status === "new"
                                ? "warning"
                                : "error"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {r.images.slice(0, 3).map((img, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src={img}
                                alt="img"
                                className="w-10 h-10 rounded object-cover border"
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Status">
                            <IconButton
                              size="small"
                              onClick={() =>
                                updateStatus(
                                  r.id,
                                  r.status === "approved"
                                    ? "rejected"
                                    : "approved"
                                )
                              }
                            >
                              {r.status === "approved" ? (
                                <Icon name="XCircle" className="text-red-500" />
                              ) : (
                                <Icon
                                  name="XCircle"
                                  className="text-green-500"
                                />
                              )}
                            </IconButton>
                          </Tooltip>

                          {/* Delete Review */}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirmId(r.id)}
                            >
                              <Icon name="Trash2" className="text-rose-500" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50]}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dev Review Creator */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Review (Dev)</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-3">
            <TextField
              label="User name"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email (optional)"
              value={form.userEmail}
              onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
              fullWidth
            />
            <TextField
              label="Title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Content (optional)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              multiline
              minRows={3}
              fullWidth
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField
                label="Product ID"
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Order ID"
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                fullWidth
              />
            </div>
            <div className="flex items-center gap-3">
              <Typography>Rating</Typography>
              <Rating
                value={form.rating}
                onChange={(_, v) => setForm({ ...form, rating: v || 5 })}
              />
            </div>
            <div>
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
              >
                Pick images
              </Button>
              <input
                ref={fileInputRef}
                multiple
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setImageFiles(Array.from(e.target.files || []).slice(0, 3))
                }
              />
              {imageFiles.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {imageFiles.map((f, i) => (
                    <span
                      key={i}
                      className="text-xs text-slate-600 border rounded px-2 py-1"
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
            onClick={createReview}
            disabled={saving}
            startIcon={
              saving ? (
                <Icon name="Loader2" className="animate-spin" />
              ) : (
                <Icon name="Send" />
              )
            }
          >
            {saving ? "Saving..." : "Create"}
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

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this review?</Typography>
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
    </ManagerLayout>
  );
}
