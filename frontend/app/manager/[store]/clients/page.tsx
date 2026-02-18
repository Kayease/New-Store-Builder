"use client";
import React, { useMemo, useState } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import Icon from "../../../../components/AppIcon";
import {
  Avatar,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  FormControlLabel,
  MenuItem,
  Menu,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  Tooltip,
  Checkbox,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerAPI } from "../../../../lib/manager-api";

interface Customer {
  _id: string;
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  status: "active" | "disabled";
  avatar?: { url?: string | null };
  createdAt: string;
}

export default function page() {
  const [dense, setDense] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [
      "customers",
      { page: pageIdx, limit: rowsPerPage, search: query },
    ],
    queryFn: async () => {
      const res = await ManagerAPI.customers?.list?.({
        page: pageIdx + 1,
        limit: rowsPerPage,
        search: query,
      });
      return res as any;
    },
  });

  const items: Customer[] = data?.items || [];
  const total = data?.total || 0;

  const rowsToShow = items;

  // Create dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.email || !form.password || !form.confirmPassword)
        throw new Error(
          "Name, email, password and confirm password are required"
        );
      if (form.password !== form.confirmPassword)
        throw new Error("Passwords do not match");

      let avatarPayload: any = {};
      if (avatarFile) {
        const uploadRes = await ManagerAPI.upload.file(avatarFile, undefined);
        if (uploadRes?.data?.url) {
          avatarPayload.avatar = {
            url: uploadRes.data.url,
            publicId: uploadRes.data.publicId,
          };
        }
      }

      const payload = { ...form, ...avatarPayload } as any;
      delete payload.confirmPassword;
      return await ManagerAPI.customers.create(payload);
    },
    onSuccess: () => {
      setOpenCreate(false);
      showSnackbar("Customer created", "success");
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        dateOfBirth: "",
      });
      setAvatarFile(null);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: any) =>
      showSnackbar(`Failed to create customer: ${e.message}`, "error"),
  });

  // Edit dialog state
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    status: "active" as Customer["status"],
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);

  const startEdit = (c: Customer) => {
    setEditing(c);
    setEditForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      dateOfBirth: "",
      status: c.status,
    });
    setEditAvatarFile(null);
    setOpenEdit(true);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No customer selected");
      let payload: any = { ...editForm };
      if (editAvatarFile) {
        const uploadRes = await ManagerAPI.upload.file(
          editAvatarFile,
          undefined
        );
        if (uploadRes?.data?.url) {
          payload.avatar = {
            url: uploadRes.data.url,
            publicId: uploadRes.data.publicId,
          };
        }
      }
      return await ManagerAPI.customers.update(editing._id, payload);
    },
    onSuccess: () => {
      setOpenEdit(false);
      showSnackbar("Customer updated", "success");
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: any) =>
      showSnackbar(`Failed to create customer: ${e.message}`, "error"),
  });

  // Delete dialog state
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleting) throw new Error("No customer selected");
      return await ManagerAPI.customers.delete(deleting._id);
    },
    onSuccess: () => {
      setOpenDelete(false);
      showSnackbar("Customer deleted", "success");
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: any) =>
      showSnackbar(`Failed to create customer: ${e.message}`, "error"),
  });

  // Toggle status
  const toggleStatus = useMutation({
    mutationFn: async (c: Customer) => {
      const newStatus: Customer["status"] =
        c.status === "active" ? "disabled" : "active";
      return await ManagerAPI.customers.update(c._id, { status: newStatus });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  return (
    <ManagerLayout title="Customer Management">
      <div className="space-y-4 max-w-7xl mx-auto">
        <Typography variant="h6" fontWeight={700}>
          Customers
        </Typography>

        <div className="flex items-center gap-3">
          <TextField
            size="small"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 240, background: "white" }}
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
            onClick={() => setOpenCreate(true)}
            startIcon={<Icon name="Plus" size={16} />}
          >
            New Customer
          </Button>
        </div>

        <Card
          elevation={0}
          sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}
        >
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size={dense ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="p-6 text-center text-slate-500">
                          Loading...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rowsToShow.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="p-6 text-center text-slate-500">
                          No customers found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rowsToShow.map((r) => (
                      <TableRow
                        key={r._id}
                        hover
                        selected={selectedIds.includes(r._id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              sx={{ width: 32, height: 32 }}
                              src={r.avatar?.url || undefined}
                            />
                            <div>
                              <div className="font-medium text-slate-900">
                                {r.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.phone}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status === "active" ? "Active" : "Blocked"}
                            sx={{
                              color:
                                r.status === "active" ? "#16a34a" : "#b91c1c",
                              backgroundColor:
                                r.status === "active" ? "#dcfce7" : "#fee2e2",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <div className="inline-flex items-center gap-2">
                            {/* <button
                              className="p-1 rounded hover:bg-slate-100"
                              onClick={() => startEdit(r)}
                            >
                              <Icon name="Pencil" size={16} />
                            </button> */}

                            <Tooltip title="Toggle Status">
                              <IconButton
                                onClick={() => toggleStatus.mutate(r)}
                              >
                                <Icon
                                  name={
                                    r.status === "active"
                                      ? "ShieldOff"
                                      : "ShieldCheck"
                                  }
                                  size={16}
                                  className="text-blue-500 hover:text-blue-600"
                                />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <IconButton
                                onClick={() => {
                                  setDeleting(r);
                                  setOpenDelete(true);
                                }}
                              >
                                <Icon
                                  name="Trash2"
                                  size={16}
                                  className="text-rose-500 hover:text-rose-600"
                                />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            <div className="flex items-center justify-between px-3 py-2">
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(_, v) => setDense(v)} />
                }
                label="Dense"
              />
              <TablePagination
                component="div"
                rowsPerPageOptions={[10, 25, 50]}
                count={total}
                rowsPerPage={rowsPerPage}
                page={pageIdx}
                onPageChange={(_, p) => setPageIdx(p)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPageIdx(0);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Create */}
        <Dialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>New Customer</DialogTitle>
          <DialogContent dividers>
            <div className="grid grid-cols-1 gap-3">
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <TextField
                label="Date of Birth"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
              <div className="flex items-center gap-3">
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<Icon name="Image" size={16} />}
                >
                  Upload Avatar
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {avatarFile && (
                  <span className="text-sm text-slate-600">
                    {avatarFile.name}
                  </span>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit */}
        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogContent dividers>
            <div className="grid grid-cols-1 gap-3">
              <TextField
                label="Name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
              <TextField
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
              <TextField
                label="Phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
              <TextField
                label="Date of Birth"
                value={editForm.dateOfBirth}
                onChange={(e) =>
                  setEditForm({ ...editForm, dateOfBirth: e.target.value })
                }
              />
              <Select
                size="small"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as Customer["status"],
                  })
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="disabled">Blocked</MenuItem>
              </Select>
              <div className="flex items-center gap-3">
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<Icon name="Image" size={16} />}
                >
                  Change Avatar
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      setEditAvatarFile(e.target.files?.[0] || null)
                    }
                  />
                </Button>
                {editAvatarFile && (
                  <span className="text-sm text-slate-600">
                    {editAvatarFile.name}
                  </span>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete */}
        <Dialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Customer</DialogTitle>
          <DialogContent dividers>
            <div className="text-slate-700">
              Are you sure you want to delete this customer?
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
