"use client";
import React, { useEffect, useState } from "react";
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
  Divider,
  Alert,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";
import dayjs from "dayjs";
import MailIcon from "@mui/icons-material/Mail";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "quill/dist/quill.snow.css";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import SubjectIcon from "@mui/icons-material/Subject";
import ChatIcon from "@mui/icons-material/Chat";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
  status: "new" | "answered" | "archived";
  answer?: string;
  answeredAt?: string;
  createdAt?: string;
}
const StatusOptions = [
  { value: "new", label: "New", color: "info" },
  { value: "answered", label: "Answered", color: "success" },
  { value: "archived", label: "Archived", color: "default" },
];
function statusChip(
  status: Enquiry["status"],
  size: "small" | "medium" = "small"
) {
  const opt = StatusOptions.find((o) => o.value === status) || StatusOptions[0];
  return (
    <Chip
      size={size}
      label={opt.label}
      color={opt.color as any}
      variant="outlined"
    />
  );
}

export default function ContactEnquiriesPage() {
  const [list, setList] = useState<{
    loading: boolean;
    error: string | null;
    data: Enquiry[];
  }>({ loading: true, error: null, data: [] });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewDialog, setViewDialog] = useState<null | Enquiry>(null);
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Add state for answer confirmation dialog
  const [answerConfirm, setAnswerConfirm] = useState(false);

  const DEV_MODE =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_MODE === "development";
  // state
  const [devDialog, setDevDialog] = useState(false);
  const [devForm, setDevForm] = useState({
    name: "Test User",
    email: "developer@example.com",
    phone: "5559991000",
    subject: "Test Enquiry Subject",
    description: "This is a developer test/contact enquiry message.",
  });
  const [devLoading, setDevLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  const handleDevFormChange = (k: string, v: string) =>
    setDevForm((f) => ({ ...f, [k]: v }));
  const submitDevContact = async () => {
    setDevLoading(true);
    await ManagerAPI.contactEnquiries.create(devForm); // storeId is attached by ManagerAPI
    setDevLoading(false);
    setDevDialog(false);
    refresh();
  };

  // List load
  async function getList() {
    setList({ loading: true, error: null, data: [] });
    try {
      const { data }: any = await ManagerAPI.contactEnquiries.list({
        status: statusFilter,
        search: query,
      });
      setList({ loading: false, error: null, data: data.items || [] });
    } catch (e: any) {
      setList({
        loading: false,
        error: e?.message || "Failed to load.",
        data: [],
      });
    }
  }
  useEffect(() => {
    getList();
  }, [statusFilter]);
  const refresh = () => {
    getList();
  };

  // Table actions
  const updateStatus = async (id: string, status: Enquiry["status"]) => {
    setStatusLoading(true);
    await ManagerAPI.contactEnquiries.archive(id);
    refresh();
    setStatusLoading(false);
  };
  const handleDelete = (id: string) => setDeleteConfirm({ open: true, id });
  const doDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await ManagerAPI.contactEnquiries.delete(deleteConfirm.id);
      setSnackbar({
        open: true,
        message: "Enquiry deleted successfully",
        severity: "success",
      });
      refresh();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Failed to delete: ${err.message || "Unknown error"}`,
        severity: "error",
      });
    }
    setDeleteConfirm({ open: false, id: null });
  };

  // Detail dialog actions
  const openDialog = (row: Enquiry) => {
    setViewDialog(row);
    setAnswerDraft(row.answer || "");
    setEditingAnswer(false);
  };
  const saveAnswer = async () => {
    setSaving(true);
    await ManagerAPI.contactEnquiries.answer(viewDialog!._id, answerDraft);
    setEditingAnswer(false);
    refresh();
    setSaving(false);
  };
  const archiveEnquiry = async () => {
    if (viewDialog) {
      await ManagerAPI.contactEnquiries.archive(viewDialog._id);
      setViewDialog(null);
      refresh();
    }
  };

  // View dialog layout & theming
  return (
    <ManagerLayout title="Contact Enquiries">
      <div className="space-y-8 max-w-7xl mx-auto">
        {DEV_MODE && (
          <div className="flex justify-end my-2">
            <Button
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }}
              onClick={() => setDevDialog(true)}
              startIcon={<AddIcon />}
            >
              Create Sample Enquiry (DEV)
            </Button>
          </div>
        )}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #dbeafe",
            borderRadius: 2,
            mt: 2,
            minHeight: 110,
            boxShadow: 0,
          }}
        >
          <CardContent sx={{ padding: "22px 24px 20px 24px" }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-7">
              <TextField
                size="small"
                sx={{ minWidth: 220 }}
                placeholder="Search name, email, etc..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") getList();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon name="Search" />
                    </InputAdornment>
                  ),
                }}
              />
              <div className="flex items-center gap-3">
                <Select
                  size="small"
                  value={statusFilter}
                  displayEmpty
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="answered">Answered</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>

                <Button
                  onClick={refresh}
                  variant="outlined"
                  sx={{ color: "#2563eb", borderColor: "#2563eb" }}
                  startIcon={<Icon name="RefreshCw" />}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {list.loading ? (
              <div className="py-16 text-center text-blue-400">Loading...</div>
            ) : list.data.length === 0 ? (
              <div className="flex flex-col items-center py-12 border rounded-xl bg-white/30 mx-auto max-w-xl mt-12">
                <MailIcon style={{ fontSize: 42, color: "#6366f1" }} />
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color="#6366f1"
                  sx={{ mt: 2 }}
                >
                  No Contact Enquiries
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  You have not received any contact form enquiries yet.
                </Typography>
                {DEV_MODE && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setDevDialog(true)}
                  >
                    Create Sample Enquiry (DEV)
                  </Button>
                )}
              </div>
            ) : list.error ? (
              <div className="py-12 text-center text-rose-600 font-medium">
                {list.error}
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
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.data
                    .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                    .map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>
                          <span className="max-w-[170px] truncate block">
                            {r.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[170px] truncate block">
                            {r.subject}
                          </span>
                        </TableCell>
                        <TableCell>
                          {statusChip(r.status)}
                          {/* Inline status dropdown for managers (optional) could go here */}
                        </TableCell>
                        <TableCell>
                          {r.createdAt
                            ? dayjs(r.createdAt).format("YYYY-MM-DD")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View & Answer">
                            <IconButton
                              color="primary"
                              onClick={() => openDialog(r)}
                            >
                              <Icon name="Eye" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Archive">
                            <IconButton
                              color="info"
                              onClick={() => updateStatus(r._id, "archived")}
                            >
                              <ArchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(r._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-end pt-3" style={{ marginRight: 9 }}>
              <Typography variant="body2" color="text.secondary">
                {list.data.length} enquiries
              </Typography>
            </div>

            {/* DEV create sample dialog */}
            {DEV_MODE && (
              <Dialog
                open={devDialog}
                maxWidth="xs"
                fullWidth
                onClose={() => setDevDialog(false)}
              >
                <DialogTitle>Developer: Create Sample Enquiry</DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                  <TextField
                    label="Name"
                    value={devForm.name}
                    onChange={(e) =>
                      handleDevFormChange("name", e.target.value)
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Email"
                    value={devForm.email}
                    onChange={(e) =>
                      handleDevFormChange("email", e.target.value)
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Phone"
                    value={devForm.phone}
                    onChange={(e) =>
                      handleDevFormChange("phone", e.target.value)
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Subject"
                    value={devForm.subject}
                    onChange={(e) =>
                      handleDevFormChange("subject", e.target.value)
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Message"
                    value={devForm.description}
                    multiline
                    minRows={3}
                    onChange={(e) =>
                      handleDevFormChange("description", e.target.value)
                    }
                    fullWidth
                  />
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setDevDialog(false)}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitDevContact}
                    variant="contained"
                    disabled={devLoading}
                  >
                    Submit
                  </Button>
                </DialogActions>
              </Dialog>
            )}
          </CardContent>
        </Card>
        {/* Detail Dialog for Enquiry */}
        <Dialog
          open={!!viewDialog}
          maxWidth="sm"
          fullWidth
          onClose={() => setViewDialog(null)}
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
                  background: "linear-gradient(90deg,#6366f1 0%,#6dd5fa 100%)",
                  padding: "22px 32px 16px 32px",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <MailIcon fontSize="large" sx={{ opacity: 0.8, mr: 1 }} />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 22,
                        letterSpacing: 0.2,
                      }}
                    >
                      Contact Enquiry Details
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
                      ? dayjs(viewDialog.createdAt).format("YYYY-MM-DD HH:mm")
                      : "—"}
                  </div>
                </div>
                <IconButton
                  onClick={() => setViewDialog(null)}
                  sx={{ color: "white", ml: "auto" }}
                >
                  <DeleteIcon />
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
                        color: "#6366f1",
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
                          color: "#6366f1",
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
                          color: "#6366f1",
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
                              <Icon name="Phone" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    {/* Email (take full width row below) */}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#6366f1",
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
                              <MailIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#6366f1",
                        }}
                      >
                        Subject
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {viewDialog.subject}
                      </div>
                    </div>
                  </div>
                </div>
                {/* SUBJECT & MESSAGE */}
                <div
                  style={{
                    margin: "0 16px 18px 16px",
                    borderRadius: 12,
                    background: "#f7f6ff",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.02)",
                    padding: "14px 20px 12px 20px",
                  }}
                >
                  <div
                    style={{ fontWeight: 600, color: "#494cab", fontSize: 17 }}
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
                    {viewDialog.description}
                  </div>
                </div>

                {/* ANSWER SECTION for the enquiry: show if not archived */}
                {viewDialog.status !== "archived" && (
                  <div
                    style={{
                      margin: "0 16px 13px 16px",
                      borderRadius: 11,
                      background: "#e8f3ff",
                      boxShadow: "0 1px 5px rgba(99,102,241,0.06)",
                      padding: "16px 20px 18px 20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 7,
                      }}
                    >
                      <ChatIcon sx={{ color: "#606ded" }} />
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#152475",
                          fontSize: 17,
                        }}
                      >
                        Respond to this enquiry
                      </span>
                    </div>
                    {/* If already answered, show only answer in read-only mode (NO edit allowed) */}
                    {viewDialog.answer ? (
                      <div className="mt-2 text-blue-900 bg-blue-50 p-3 rounded border border-blue-100 shadow">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: viewDialog.answer,
                          }}
                        />
                        {viewDialog.answeredAt && (
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 13,
                              color: "#4262B1",
                              opacity: 0.75,
                            }}
                          >
                            Answered:{" "}
                            {dayjs(viewDialog.answeredAt).format(
                              "YYYY-MM-DD HH:mm"
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <ReactQuill
                          value={answerDraft}
                          onChange={setAnswerDraft}
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, false] }],
                              ["bold", "italic", "underline"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              ["link"],
                              ["clean"],
                            ],
                          }}
                          style={{
                            minHeight: 120,
                            background: "#fff",
                            borderRadius: 7,
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            justifyContent: "flex-end",
                            marginTop: 12,
                          }}
                        >
                          <Button
                            onClick={() => setAnswerDraft("")}
                            variant="outlined"
                            color="secondary"
                            sx={{ minWidth: 90 }}
                            disabled={saving}
                          >
                            Clear
                          </Button>
                          <Button
                            onClick={() => setAnswerConfirm(true)}
                            variant="contained"
                            color="info"
                            sx={{ fontWeight: 600, minWidth: 140 }}
                            disabled={saving || !answerDraft.trim()}
                          >
                            {saving ? "Saving…" : "Send Answer"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* If answered and archived, show answer summary */}
                {viewDialog.status === "archived" && viewDialog.answer && (
                  <div
                    style={{
                      margin: "0 16px 13px 16px",
                      borderRadius: 10,
                      background: "#f3fafd",
                      boxShadow: "0 1px 5px rgba(99,102,241,0.04)",
                      padding: "13px 20px 11px 20px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#3377ad",
                        fontSize: 16,
                        marginBottom: 4,
                      }}
                    >
                      Answered Message
                    </div>
                    <div
                      style={{ color: "#1f3b63", fontSize: 15 }}
                      dangerouslySetInnerHTML={{ __html: viewDialog.answer }}
                    />
                    {viewDialog.answeredAt && (
                      <span
                        style={{
                          fontSize: 13,
                          color: "#368",
                          display: "block",
                          marginTop: 6,
                          opacity: 0.75,
                        }}
                      >
                        Answered:{" "}
                        {dayjs(viewDialog.answeredAt).format(
                          "YYYY-MM-DD HH:mm"
                        )}
                      </span>
                    )}
                  </div>
                )}
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
                        value={viewDialog.status}
                        disabled={statusLoading}
                        onChange={async (e) => {
                          setStatusLoading(true);
                          try {
                            await ManagerAPI.contactEnquiries.updateStatus(
                              viewDialog._id,
                              e.target.value as Enquiry["status"]
                            );
                            refresh();
                            setViewDialog(null);
                          } finally {
                            setStatusLoading(false);
                          }
                        }}
                      >
                        {StatusOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {statusLoading && (
                        <span style={{ marginLeft: 8 }}>
                          <span className="loader" />
                        </span>
                      )}
                    </div>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ minWidth: 120, fontWeight: 600, ml: 1, mr: 1 }}
                      href={
                        viewDialog.phone ? `tel:${viewDialog.phone}` : undefined
                      }
                      startIcon={<Icon name="Phone" />}
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
                      startIcon={<MailIcon />}
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
                      handleDelete(viewDialog._id);
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

        <Dialog
          open={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, id: null })}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Contact Enquiry?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this enquiry? This action cannot
              be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteConfirm({ open: false, id: null })}
              variant="contained"
            >
              Cancel
            </Button>
            <Button onClick={doDelete} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog for Sending Answer */}
        <Dialog
          open={answerConfirm}
          onClose={() => setAnswerConfirm(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Send Answer?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to send this answer? This cannot be changed
              once sent.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAnswerConfirm(false)} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setAnswerConfirm(false);
                await saveAnswer();
                refresh();
                setViewDialog(null);
              }}
              variant="contained"
              color="info"
              disabled={saving}
            >
              Yes, Send Answer
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ManagerLayout>
  );
}
