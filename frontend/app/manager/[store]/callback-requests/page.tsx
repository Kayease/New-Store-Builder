"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  Select,
  MenuItem,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  Checkbox,
  ListItemText,
  Divider,
  Avatar,
  Snackbar,
  Alert,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";
import CallIcon from "@mui/icons-material/Call";
import EmailIcon from "@mui/icons-material/Email";
import CircularProgress from "@mui/material/CircularProgress";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ChatIcon from "@mui/icons-material/Chat";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";

interface CallbackReq {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  description?: string;
  preferredTime?: string;
  preferredDays?: string[];
  status: "pending" | "processed" | "failed";
  requestAt?: string;
  createdAt?: string;
}

const DEV_MODE =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_MODE === "development";

const allDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const StatusOptions: {
  value: CallbackReq["status"];
  label: string;
  color: "warning" | "success" | "error";
}[] = [
  { value: "pending", label: "Pending", color: "warning" },
  { value: "processed", label: "Contacted", color: "success" },
  { value: "failed", label: "Cancelled", color: "error" },
];

export default function CallbackRequestsPage() {
  const [list, setList] = useState<{
    loading: boolean;
    error: string | null;
    data: CallbackReq[];
  }>({ loading: true, error: null, data: [] });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [devDialog, setDevDialog] = useState(false);
  const [devForm, setDevForm] = useState({
    name: "Dev Tester",
    phone: "555-0101",
    email: "devtest@example.com",
    description: "This is a test callback request for dev QA.",
    preferredTime: "10am-12pm",
    preferredDays: ["Tuesday", "Friday"],
  });
  const [devLoading, setDevLoading] = useState(false);
  const [viewDialog, setViewDialog] = useState<null | CallbackReq>(null);
  const [dialogStatus, setDialogStatus] =
    useState<CallbackReq["status"]>("pending");
  const [statusLoading, setStatusLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const getRequests = async () => {
    setList({ loading: true, error: null, data: [] });
    try {
      const { data }: any = await ManagerAPI.callbackRequests.list({
        status: statusFilter,
        search: query,
      });
      setList({ loading: false, error: null, data: data.items || [] });
    } catch (err: any) {
      setList({
        loading: false,
        error: err?.message || "Failed to load requests.",
        data: [],
      });
    }
  };
  useEffect(() => {
    getRequests();
  }, [statusFilter]);
  const refresh = () => {
    setRefreshing(true);
    getRequests().finally(() => setRefreshing(false));
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return list.data;
    const q = query.toLowerCase();
    return list.data.filter((r) =>
      [r.name, r.phone, r.email, r.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [list.data, query]);

  // Pagination
  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Update status of callback request
  const updateStatus = async (id: string, status: CallbackReq["status"]) => {
    setStatusLoading(true);
    try {
      await ManagerAPI.callbackRequests.updateStatus(id, status);
      refresh();
      if (viewDialog && viewDialog._id === id) setDialogStatus(status);
      showSnackbar("Status Update.", "success");
    } catch (err: any) {
      showSnackbar(
        `Failed to create sample callback: ${err.message ?? ""}`,
        "error"
      );
    }
    setStatusLoading(false);
  };

  // Remove
  const remove = async (id: string) => {
    try {
      await ManagerAPI.callbackRequests.delete(id);
      refresh();
      showSnackbar("Request Deleted Successfully", "success");
    } catch (err: any) {
      showSnackbar(
        `Failed to create sample callback: ${err.message ?? ""}`,
        "error"
      );
    }
  };

  const handleDevChange = (field: string, value: any) => {
    setDevForm((f) => ({ ...f, [field]: value }));
  };

  const submitDevCB = async () => {
    setDevLoading(true);
    try {
      await ManagerAPI.callbackRequests.create(devForm);
      setDevDialog(false);
      refresh();
    } catch (err: any) {
      showSnackbar(
        `Failed to create sample callback: ${err.message ?? ""}`,
        "error"
      );
    }
    setDevLoading(false);
  };

  // Helper for status option
  const statusChip = (
    s: CallbackReq["status"],
    size: "small" | "medium" = "small"
  ) => {
    const opt = StatusOptions.find((o) => o.value === s) || StatusOptions[0];
    return (
      <Chip
        size={size}
        label={opt.label}
        color={opt.color}
        variant="outlined"
      />
    );
  };

  return (
    <ManagerLayout title="Callback Requests">
      <div className="space-y-6 max-w-7xl mx-auto">
        {DEV_MODE && (
          <div className="flex justify-end my-3">
            <Button
              variant="outlined"
              sx={{ color: "#0891b2", borderColor: "#0891b2" }}
              onClick={() => setDevDialog(true)}
            >
              + Create Sample Callback Request (DEV)
            </Button>
          </div>
        )}
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent sx={{ paddingRight: 5, paddingLeft: 5 }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div className="flex items-center gap-4 flex-wrap">
                <TextField
                  size="small"
                  placeholder="Search name, phone, email, desc..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") getRequests();
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon name="Search" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 240, width: 320 }}
                />
                <Select
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processed">Processed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
                <Button
                  onClick={refresh}
                  variant="outlined"
                  sx={{ borderColor: "#06b6d4", color: "#0891b2" }}
                  disabled={refreshing || list.loading}
                  startIcon={<Icon name="RefreshCw" />}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {list.loading ? (
              <div className="py-16 text-center text-gray-400">Loading...</div>
            ) : list.error ? (
              <div className="py-16 text-center text-rose-600">
                {list.error}
              </div>
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                No callback requests found.
              </div>
            ) : (
              <Table
                size="small"
                sx={{
                  "& thead th": {
                    fontWeight: 700,
                    color: "text.secondary",
                    background: "#fafafa",
                  },
                  "& td, & th": { borderColor: "#eef2f7" },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          className="max-w-[200px]"
                        >
                          {r.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="primary"
                          className="max-w-[200px]"
                        >
                          {r.email || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {statusChip(r.status)}

                        {statusLoading && (
                          <CircularProgress size={16} sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setViewDialog(r);
                              setDialogStatus(r.status);
                            }}
                          >
                            <Icon name="Eye" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => remove(r._id)}
                          >
                            <Icon name="Trash2" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Typography>Rows per page:</Typography>
                <TextField
                  select
                  size="small"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(0);
                  }}
                  SelectProps={{ native: true }}
                  sx={{ width: 80 }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </TextField>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  {filtered.length === 0
                    ? "0–0 of 0"
                    : `${page * rowsPerPage + 1}–${Math.min(
                        (page + 1) * rowsPerPage,
                        filtered.length
                      )} of ${filtered.length}`}
                </div>
                <div className="flex gap-1">
                  <IconButton
                    size="small"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <Icon name="ChevronLeft" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={
                      page + 1 >= Math.ceil(filtered.length / rowsPerPage)
                    }
                    onClick={() =>
                      setPage((p) =>
                        Math.min(
                          Math.ceil(filtered.length / rowsPerPage) - 1,
                          p + 1
                        )
                      )
                    }
                  >
                    <Icon name="ChevronRight" />
                  </IconButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Enhanced Detail Dialog  */}
        <Dialog
          open={!!viewDialog}
          onClose={() => setViewDialog(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              minWidth: 400,
              maxWidth: 640,
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: 6,
              background: "#f6faff",
              position: "relative",
            },
          }}
        >
          {viewDialog && (
            <div style={{ background: "#f6faff", minHeight: 520 }}>
              {/* Header */}
              <div
                style={{
                  background:
                    "linear-gradient(90deg, #3182ce 0%, #63b3ed 100%)",
                  padding: "22px 32px 16px 32px",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <CallIcon fontSize="large" sx={{ opacity: 0.8, mr: 1 }} />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 22,
                        letterSpacing: 0.2,
                      }}
                    >
                      Callback Request Details
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 13,
                      opacity: 0.92,
                    }}
                  >
                    <CalendarTodayIcon
                      sx={{ fontSize: 18, mr: 1, opacity: 0.8 }}
                    />
                    Submitted on{" "}
                    {viewDialog.createdAt
                      ? new Date(viewDialog.createdAt).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
                <IconButton
                  onClick={() => setViewDialog(null)}
                  sx={{ color: "white", ml: "auto" }}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              {/* Sections */}
              <DialogContent sx={{ p: 0, pt: 2.4, pb: 1.4 }}>
                {/* CONTACT INFORMATION */}
                <div
                  style={{
                    margin: "18px 16px 18px 16px",
                    borderRadius: 12,
                    background: "#fff",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.03)",
                    padding: "18px 20px 12px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 11,
                      marginBottom: 12,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#edf2fb",
                        color: "#3182ce",
                        width: 36,
                        height: 36,
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <div
                      style={{ fontWeight: 600, fontSize: 18, color: "#222" }}
                    >
                      Contact Information
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 18,
                      alignItems: "start",
                      width: "100%",
                    }}
                  >
                    {/* Full Name */}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#3182ce",
                        }}
                      >
                        Full Name
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {viewDialog.name}
                      </div>
                    </div>
                    {/* Phone Number */}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#3182ce",
                        }}
                      >
                        Phone Number
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {viewDialog.phone || "—"}
                        {viewDialog.phone && (
                          <Tooltip title="Call User">
                            <IconButton
                              color="success"
                              sx={{ ml: 0.5 }}
                              href={`tel:${viewDialog.phone}`}
                            >
                              <CallIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    {/* Email (take full width row below) */}
                    <div
                      style={{
                        gridColumn: "1 / span 2",
                        marginTop: 4,
                        minWidth: 210,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#3182ce",
                        }}
                      >
                        Email Address
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {viewDialog.email || "—"}
                        {viewDialog.email && (
                          <Tooltip title="Send Email">
                            <IconButton
                              color="primary"
                              sx={{ ml: 0.5 }}
                              href={`mailto:${viewDialog.email}`}
                            >
                              <EmailIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* PREFERRED CALLBACK TIME */}
                <div
                  style={{
                    margin: "0 16px 18px 16px",
                    borderRadius: 12,
                    background: "#f6fffa",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.02)",
                    padding: "12px 20px 10px 20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <AccessTimeIcon sx={{ mr: 1.5, color: "#38a169" }} />
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1a6c31",
                        fontSize: 17,
                      }}
                    >
                      Preferred Callback Time
                    </div>
                    <div
                      style={{
                        fontWeight: 400,
                        color: "#234",
                        fontSize: 15,
                        marginTop: 2,
                      }}
                    >
                      {(viewDialog.preferredDays || []).length
                        ? viewDialog.preferredDays.join(", ") +
                          (viewDialog.preferredTime
                            ? " at " + viewDialog.preferredTime
                            : "")
                        : viewDialog.preferredTime || "—"}
                    </div>
                  </div>
                </div>
                {/* MESSAGE */}
                <div
                  style={{
                    margin: "0 16px 18px 16px",
                    borderRadius: 12,
                    background: "#f7f6ff",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.02)",
                    padding: "14px 20px 12px 20px",
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <ChatIcon
                    sx={{ mr: 1.5, marginTop: 0.5, color: "#7c3aed" }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#494cab",
                        fontSize: 17,
                      }}
                    >
                      Message
                    </div>
                    <div
                      style={{
                        fontWeight: 400,
                        color: "#2b2e4a",
                        fontSize: 15,
                        marginTop: 2,
                      }}
                    >
                      {viewDialog.description || "—"}
                    </div>
                  </div>
                </div>
                {/* STATUS & ACTIONS */}
                <div
                  style={{
                    margin: "0 16px 10px 16px",
                    borderRadius: 12,
                    background: "#fffbe6",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.025)",
                    padding: "14px 20px 20px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <SettingsIcon sx={{ mr: 1.5, color: "#fd9704" }} />
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#c97c08",
                        fontSize: 17,
                      }}
                    >
                      Status & Actions
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 16,
                      gap: 18,
                    }}
                  >
                    <div>
                      <Select
                        size="small"
                        sx={{
                          minWidth: 146,
                          height: 38,
                          background: "#fff8dc",
                          borderRadius: 2,
                          fontWeight: 600,
                        }}
                        value={dialogStatus}
                        disabled={statusLoading}
                        onChange={(e) =>
                          updateStatus(
                            viewDialog._id,
                            e.target.value as "pending" | "processed" | "failed"
                          )
                        }
                      >
                        {StatusOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {statusLoading && (
                        <CircularProgress
                          size={17}
                          sx={{ ml: 1, verticalAlign: "middle" }}
                        />
                      )}
                    </div>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ minWidth: 120, fontWeight: 600, ml: 1, mr: 1 }}
                      href={
                        viewDialog.phone ? `tel:${viewDialog.phone}` : undefined
                      }
                      startIcon={<CallIcon />}
                      disabled={!viewDialog.phone}
                    >
                      Call User
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ minWidth: 118, fontWeight: 600, ml: 0.5 }}
                      href={
                        viewDialog.email
                          ? `mailto:${viewDialog.email}`
                          : undefined
                      }
                      startIcon={<EmailIcon />}
                      disabled={!viewDialog.email}
                    >
                      Send Email
                    </Button>
                  </div>
                  <Button
                    variant="contained"
                    color="error"
                    sx={{
                      fontWeight: 700,
                      width: "100%",
                      py: 1.3,
                      fontSize: "1.05rem",
                      mt: 1,
                    }}
                    onClick={() => {
                      remove(viewDialog._id);
                      setViewDialog(null);
                    }}
                  >
                    Delete Request
                  </Button>
                </div>
              </DialogContent>
              <DialogActions sx={{ background: "#f5f6fa", py: 1.5, px: 2.5 }}>
                <Button
                  variant="outlined"
                  sx={{ minWidth: 100 }}
                  onClick={() => setViewDialog(null)}
                >
                  Close
                </Button>
              </DialogActions>
            </div>
          )}
        </Dialog>
        {/* DEV Dialog unchanged ... */}
        {DEV_MODE && (
          <Dialog
            open={devDialog}
            onClose={() => setDevDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Sample Callback Request (DEV Demo Form)</DialogTitle>
            <DialogContent dividers>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Name</InputLabel>
                <OutlinedInput
                  value={devForm.name}
                  label="Name"
                  onChange={(e) => handleDevChange("name", e.target.value)}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Phone</InputLabel>
                <OutlinedInput
                  value={devForm.phone}
                  label="Phone"
                  onChange={(e) => handleDevChange("phone", e.target.value)}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Email</InputLabel>
                <OutlinedInput
                  value={devForm.email}
                  label="Email"
                  onChange={(e) => handleDevChange("email", e.target.value)}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Description</InputLabel>
                <OutlinedInput
                  multiline
                  minRows={2}
                  value={devForm.description}
                  label="Description"
                  onChange={(e) =>
                    handleDevChange("description", e.target.value)
                  }
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Preferred Time</InputLabel>
                <OutlinedInput
                  value={devForm.preferredTime}
                  label="Preferred Time"
                  onChange={(e) =>
                    handleDevChange("preferredTime", e.target.value)
                  }
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel>Preferred Days</InputLabel>
                <Select
                  multiple
                  value={devForm.preferredDays}
                  onChange={(e) =>
                    handleDevChange("preferredDays", e.target.value)
                  }
                  input={<OutlinedInput label="Preferred Days" />}
                  renderValue={(selected) => (selected as string[]).join(", ")}
                >
                  {allDays.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox
                        checked={devForm.preferredDays.indexOf(day) > -1}
                      />
                      <ListItemText primary={day} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={() => setDevDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={submitDevCB}
                disabled={devLoading}
              >
                {devLoading ? "Submitting..." : "Create"}
              </Button>
            </DialogActions>
          </Dialog>
        )}

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
