"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  Button,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";

type Subscriber = {
  id: string;
  email: string;
  name?: string;
  status: "subscribed" | "unsubscribed";
};

export default function Page() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      [r.email, r.name || "", r.status].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const params: any = { page: page + 1, limit: rowsPerPage };
      const res: any = await ManagerAPI.newsletter.list(params);
      const items = (res?.data?.items || res?.items || []).map(
        (x: any): Subscriber => ({
          id: x._id,
          email: x.email,
          name: x.name,
          status: x.status,
        })
      );
      setRows(items);
      const totalFromServer = res?.data?.total ?? res?.total ?? 0;
      setTotal(Number(totalFromServer) || 0);
    } catch (e) {
      console.error("Failed to load subscribers", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, [page, rowsPerPage]);

  const subscribeMe = async () => {
    try {
      const profile =
        typeof window !== "undefined"
          ? localStorage.getItem("kx_profile")
          : null;
      let userId = "";
      let name = "";
      let fallbackEmail = "";
      if (profile) {
        try {
          const p = JSON.parse(profile);
          userId = p.sub || p._id || "";
          name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
          fallbackEmail = p.email || "";
        } catch {}
      }
      const payload: any = {};
      if (emailInput) payload.email = emailInput;
      else if (fallbackEmail) payload.email = fallbackEmail;
      payload.userId = userId;
      if (name) payload.name = name;
      await ManagerAPI.newsletter.subscribe(payload);
      setEmailInput("");
      await fetchSubs();
      setSnackbar({
        open: true,
        message: "Subscribed successfully",
        severity: "success",
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Failed to subscribe",
        severity: "error",
      });
    }
  };

  const toggleStatus = async (s: Subscriber) => {
    try {
      if (s.status === "subscribed") {
        await ManagerAPI.newsletter.unsubscribe(s.id);
        setRows((prev) =>
          prev.map((x) =>
            x.id === s.id ? { ...x, status: "unsubscribed" } : x
          )
        );
        setSnackbar({
          open: true,
          message: "Unsubscribed successfully",
          severity: "success",
        });
      } else {
        await ManagerAPI.newsletter.subscribeById(s.id);
        setRows((prev) =>
          prev.map((x) => (x.id === s.id ? { ...x, status: "subscribed" } : x))
        );
        setSnackbar({
          open: true,
          message: "Subscribed successfully",
          severity: "success",
        });
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Failed to change status",
        severity: "error",
      });
    }
  };

  const remove = async (id: string) => {
    try {
      setDeletingId(id);
      await ManagerAPI.newsletter.delete(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
      setSnackbar({
        open: true,
        message: "Subscriber deleted",
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
    typeof window !== "undefined" && process.env.NEXT_PUBLIC_MODE !== "production";

  return (
    <ManagerLayout title="Newsletter Subscribers">
      <div className="max-w-[1400px] mx-auto">
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          {loading && <LinearProgress />}
          <CardContent sx={{ paddingRight: 5, paddingLeft: 5 }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <TextField
                placeholder="Search subscribers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ width: 360 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">🔎</InputAdornment>
                  ),
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  startIcon={<Icon name="Mail" />}
                  onClick={() =>
                    setSnackbar({
                      open: true,
                      message: "Coming soon: Compose newsletter",
                      severity: "success",
                    })
                  }
                >
                  Compose Newsletter
                </Button>
                {isDev && (
                  <>
                    <TextField
                      placeholder="Enter email (optional)"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      size="small"
                      sx={{ width: 260 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<Icon name="Plus" />}
                      onClick={subscribeMe}
                    >
                      Subscribe me (Dev)
                    </Button>
                  </>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-24 bg-gray-50 rounded border border-dashed text-center">
                <div className="mb-2 text-5xl">📬</div>
                <Typography variant="h6" gutterBottom>
                  No Subscribers Yet
                </Typography>
                <Typography color="text.secondary">
                  When users subscribe on your site, they will appear here.
                </Typography>
              </div>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.name || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.status}
                            size="small"
                            color={
                              s.status === "subscribed" ? "success" : "default"
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {s.status === "subscribed" && (
                            <Tooltip title="Mail User">
                              <IconButton
                                onClick={() =>
                                  setSnackbar({
                                    open: true,
                                    message: "Coming soon: Mail User",
                                    severity: "success",
                                  })
                                }
                              >
                                <Icon name="Mail" className="text-blue-500" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip
                            title={
                              s.status === "subscribed"
                                ? "Unsubscribe"
                                : "Subscribe"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() => toggleStatus(s)}
                            >
                              {s.status === "subscribed" ? (
                                <Icon name="Pause" className="text-red-500" />
                              ) : (
                                <Icon name="Play" className="text-green-500" />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmId(s.id)}
                              disabled={deletingId === s.id}
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
        <DialogTitle>Delete Subscriber</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this subscriber?
          </Typography>
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
