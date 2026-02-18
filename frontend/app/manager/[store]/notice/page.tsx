"use client";
import React, { useState, useEffect } from "react";
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
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import DatePicker from "../../../../components/ui/DatePicker";
import { ManagerAPI } from "../../../../lib/manager-api";
import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type Notice = {
  _id: string;
  title: string;
  content: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  lastModifiedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function page() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [form, setForm] = useState<Partial<Notice>>({
    title: "",
    content: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Filter states
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive" | "scheduled" | "expired"
  >("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // React Quill modules (toolbar)
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "blockquote", "code-block"],
      [{ align: [] }],
      ["clean"],
    ],
  } as const;

  // Custom styles for React Quill (match BlogForm look & feel)
  const customStyles = `
    .ql-toolbar {
      border: none !important;
      background-color: rgb(249 250 251) !important;
      border-bottom: 1px solid #e5e7eb !important;
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      padding: 0.5rem !important;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .ql-toolbar button { padding: 0.5rem !important; height: 32px !important; width: 32px !important; border-radius: 0.5rem; }
    .ql-toolbar button svg { width: 20px !important; height: 20px !important; }
    .ql-toolbar .ql-picker { height: 32px !important; }
    .ql-toolbar .ql-picker-label { padding: 0.5rem !important; border-radius: 0.5rem; }
    .ql-toolbar button:hover { background-color: rgb(229 231 235) !important; }
    .ql-formats { display: flex !important; gap: 0.25rem; align-items: center; }
    .ql-container { border: none !important; font-size: 1.125rem !important; }
    .ql-editor { padding: 1rem !important; min-height: 300px !important; font-size: 16px; line-height: 1.6; color: #374151; }
    .ql-editor p { margin-bottom: 1rem; }
    .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 { margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 600; color: #111827; }
    .ql-editor h1 { font-size: 2rem; }
    .ql-editor h2 { font-size: 1.75rem; }
    .ql-editor h3 { font-size: 1.5rem; }
    .ql-editor h4 { font-size: 1.25rem; }
    .ql-editor h5 { font-size: 1.125rem; }
    .ql-editor h6 { font-size: 1rem; }
    .ql-editor blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #6b7280; }
    .ql-editor code { background-color: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-family: 'Courier New', monospace; font-size: 0.875rem; }
    .ql-editor pre { background-color: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
    .ql-editor pre code { background-color: transparent; color: inherit; padding: 0; }
    .ql-editor ul, .ql-editor ol { padding-left: 1.5rem; margin: 1rem 0; }
    .ql-editor li { margin-bottom: 0.5rem; }
    .ql-editor img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
    .ql-editor a { color: #3b82f6; text-decoration: underline; }
    .ql-editor a:hover { color: #2563eb; }
    .ql-editor.ql-blank::before { color: #9ca3af; font-style: italic; }
    @media (min-width: 768px) { .ql-editor { min-height: 400px !important; } }
  `;

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = customStyles;
    document.head.appendChild(styleEl);
    return () => {
      try {
        document.head.removeChild(styleEl);
      } catch { }
    };
  }, []);

  // Load notices on component mount and when filters change
  useEffect(() => {
    loadNotices();
  }, [activeFilter, startDate, endDate, debouncedSearchQuery]);

  const loadNotices = async () => {
    try {
      setLoading(true);

      // Build filter parameters
      const filterParams: any = {};

      // Add search filter
      if (debouncedSearchQuery.trim()) {
        filterParams.search = debouncedSearchQuery.trim();
      }

      // Add date range filters
      if (startDate) {
        filterParams.startDate = startDate;
      }
      if (endDate) {
        filterParams.endDate = endDate;
      }

      // Add status filter
      if (activeFilter !== "all") {
        filterParams.status = activeFilter;
      }

      const response = (await ManagerAPI.notices.list(filterParams)) as any;

      if (response.success) {
        setNotices(response.items || []);
      } else {
        showSnackbar(response.message || "Failed to load notices", "error");
      }
    } catch (error: any) {
      console.error("Failed to load notices:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load notices";

      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setEditingId(null);
  };

  const handleOpenDialog = (notice?: Notice) => {
    if (notice) {
      setForm({
        title: notice.title,
        content: notice.content,
        startDate: notice.startDate || "",
        endDate: notice.endDate || "",
        isActive: notice.isActive,
      });
      setEditingId(notice._id);
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    resetForm();
  };

  const save = async () => {
    // Check if title is provided and not just whitespace
    const hasTitle = form.title && form.title.trim().length > 0;

    // Check if content is provided and has actual text content
    const hasContent =
      form.content &&
      form.content.trim().length > 0 &&
      form.content.replace(/<[^>]*>/g, "").trim().length > 0;

    if (!hasTitle) {
      showSnackbar("Title is required", "error");
      return;
    }

    if (!hasContent) {
      showSnackbar("Content is required and must contain actual text", "error");
      return;
    }

    try {
      setLoading(true);

      const noticeData = {
        title: form.title,
        content: form.content,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: form.isActive,
      };

      if (editingId) {
        await ManagerAPI.notices.update(editingId, noticeData);
        showSnackbar("Notice updated successfully", "success");
      } else {
        await ManagerAPI.notices.create(noticeData);
        showSnackbar("Notice created successfully", "success");
      }

      await loadNotices();
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save notice:", error);

      // Handle specific error messages from backend
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save notice";

      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;

    try {
      setLoading(true);
      await ManagerAPI.notices.delete(id);
      showSnackbar("Notice deleted successfully", "success");
      await loadNotices();
    } catch (error) {
      console.error("Failed to delete notice:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete notice";

      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      setLoading(true);
      await ManagerAPI.notices.toggleActive(id);
      showSnackbar("Notice status updated successfully", "success");
      await loadNotices();
    } catch (error) {
      console.error("Failed to toggle notice status:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update notice status";

      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const empty = notices.length === 0;

  return (
    <ManagerLayout title="Announcement">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <Typography variant="h6" fontWeight={700}>
            Announcements
          </Typography>
          <Button
            variant="contained"
            startIcon={<Icon name="Plus" />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Add Notice
          </Button>
        </div>

        {/* Filter Component */}
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2, mb: 3 }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Status Tabs */}
            <div className="flex items-center gap-1 mb-4">
              {[
                {
                  key: "all",
                  label: "All",
                  count: notices.length,
                  icon: "List",
                  color: "gray",
                },
                {
                  key: "active",
                  label: "Active",
                  count: notices.filter((n) => n.isActive).length,
                  icon: "Play",
                  color: "green",
                },
                {
                  key: "inactive",
                  label: "Inactive",
                  count: notices.filter((n) => !n.isActive).length,
                  icon: "Pause",
                  color: "red",
                },
                {
                  key: "scheduled",
                  label: "Scheduled",
                  count: notices.filter(
                    (n) => n.startDate && new Date(n.startDate) > new Date()
                  ).length,
                  icon: "Clock",
                  color: "blue",
                },
                {
                  key: "expired",
                  label: "Expired",
                  count: notices.filter(
                    (n) => n.endDate && new Date(n.endDate) < new Date()
                  ).length,
                  icon: "X",
                  color: "orange",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeFilter === tab.key
                      ? `bg-${tab.color}-50 text-${tab.color}-700 border-b-2 border-${tab.color}-500 shadow-sm`
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                >
                  <Icon
                    name={tab.icon}
                    size={16}
                    className={
                      activeFilter === tab.key
                        ? `text-${tab.color}-600`
                        : "text-gray-500"
                    }
                  />
                  {tab.label} {tab.count}
                </button>
              ))}
            </div>

            {/* Date Range and Search */}
            <div className="flex items-end gap-4">
              {/* Start Date */}
              <div className="flex-1">
                <DatePicker
                  label="Start date"
                  value={startDate}
                  onChange={(date) =>
                    setStartDate(date ? date.format("YYYY-MM-DD") : "")
                  }
                />
              </div>

              {/* End Date */}
              <div className="flex-1">
                <DatePicker
                  label="End date"
                  value={endDate}
                  onChange={(date) =>
                    setEndDate(date ? date.format("YYYY-MM-DD") : "")
                  }
                />
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Icon
                    name="Search"
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search title or content..."
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setActiveFilter("all");
                    setStartDate("");
                    setEndDate("");
                    setSearchQuery("");
                  }}
                  disabled={loading}
                  size="large"
                  startIcon={<Icon name="X" size={16} />}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            {empty ? (
              <div className="py-20 grid place-items-center text-center">
                <Icon name="Megaphone" size={48} className="text-slate-400" />
                <Typography variant="h6" className="mt-2">
                  No Announcements Added Yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Create your first announcement by clicking the button above.
                </Typography>
                <div className="mt-4">
                  <Button
                    variant="contained"
                    startIcon={<Icon name="Plus" />}
                    onClick={() => handleOpenDialog()}
                    disabled={loading}
                  >
                    Add Announcement
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notices.map((notice) => (
                    <TableRow key={notice._id} hover>
                      <TableCell>
                        <div>
                          <Typography variant="body2" fontWeight={500}>
                            {notice.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notice.createdBy
                              ? `by ${notice.createdBy.firstName} ${notice.createdBy.lastName}`
                              : "Unknown author"}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notice.isActive ? "Active" : "Inactive"}
                          color={notice.isActive ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {notice.startDate
                          ? new Date(notice.startDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {notice.endDate
                          ? new Date(notice.endDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Toggle Status">
                          <IconButton
                            onClick={() => handleToggleActive(notice._id)}
                            disabled={loading}
                          >
                            <Icon
                              name={notice.isActive ? "Pause" : "Play"}
                              size={16}
                              className="text-blue-500 hover:text-blue-600"
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleOpenDialog(notice)}
                            disabled={loading}
                          >
                            <Icon
                              name="Pencil"
                              size={16}
                              className="text-green-500 hover:text-green-600"
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(notice._id)}
                            disabled={loading}
                          >
                            <Icon
                              name="Trash2"
                              size={16}
                              className="text-rose-500 hover:text-rose-600"
                            />
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

        <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="md">
          <DialogTitle>
            {editingId ? "Edit Announcement" : "Create Announcement"}
          </DialogTitle>
          <DialogContent dividers>
            <div className="grid grid-cols-1 gap-4">
              <TextField
                label="Title"
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
              <div>
                <Typography variant="caption" color="text.secondary">
                  Your message
                </Typography>
                <div className="border rounded">
                  <ReactQuill
                    theme="snow"
                    value={form.content || ""}
                    onChange={(v) => setForm({ ...form, content: v })}
                    modules={quillModules}
                    placeholder="Write your announcement..."
                    readOnly={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Start date"
                  value={form.startDate}
                  onChange={(date) =>
                    setForm({
                      ...form,
                      startDate: date ? date.format("YYYY-MM-DD") : "",
                    })
                  }
                  disabled={loading}
                />
                <DatePicker
                  label="End date"
                  value={form.endDate}
                  onChange={(date) =>
                    setForm({
                      ...form,
                      endDate: date ? date.format("YYYY-MM-DD") : "",
                    })
                  }
                  disabled={loading}
                />
              </div>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive || false}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    disabled={loading}
                  />
                }
                label="Active"
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={save}
              variant="contained"
              disabled={
                loading ||
                !form.title?.trim() ||
                !form.content?.trim() ||
                form.content?.replace(/<[^>]*>/g, "").trim().length === 0
              }
              startIcon={
                loading ? (
                  <Icon name="Loader2" className="animate-spin" />
                ) : (
                  <Icon name="Save" />
                )
              }
            >
              {loading ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ManagerLayout>
  );
}
