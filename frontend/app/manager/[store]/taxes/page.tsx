"use client";
import React, { useEffect, useState } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Tooltip,
  Alert,
} from "@mui/material";
import { ManagerAPI } from "../../../../lib/manager-api";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Icon from "../../../../components/AppIcon";
import { DataTable } from "../../../../components/DataTable";

interface Tax {
  _id: string;
  store: string;
  name: string;
  sgst: number;
  cgst: number;
  igst: number;
  description?: string;
  isDefault?: boolean;
  is_active: boolean;
}

export default function TaxesPage() {
  const [list, setList] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: "error" | "success" | "info";
    message: string;
  }>({ open: false, severity: "info", message: "" });
  const [dialog, setDialog] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    name: "",
    sgst: "",
    cgst: "",
    igst: "",
    description: "",
    isDefault: false,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.max(1, Math.ceil(list.length / rowsPerPage));
  const paginatedRows = list.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const refresh = async () => {
    setLoading(true);
    try {
      const { data }: any = await ManagerAPI.taxes.list();
      setList(
        (data || []).sort((a: Tax, b: Tax) =>
          (a.name || "").localeCompare(b.name || "")
        )
      );
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load.");
      setSnackbar({
        open: true,
        severity: "error",
        message: e?.message || "Failed to load.",
      });
    }
    setLoading(false);
  };
  useEffect(() => {
    refresh();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      sgst: "",
      cgst: "",
      igst: "",
      description: "",
      isDefault: false,
      is_active: true,
    });
    setDialog(true);
  }
  function openEdit(tax: any) {
    setEditing(tax);
    setForm({ ...tax });
    setDialog(true);
  }
  async function saveTax() {
    setSaving(true);
    try {
      // Ensure all required fields are provided
      if (
        !form.name ||
        form.sgst === "" ||
        form.cgst === "" ||
        form.igst === ""
      ) {
        setSnackbar({
          open: true,
          severity: "error",
          message: "Tax title, SGST, CGST, and IGST are required.",
        });
        setSaving(false);
        return;
      }
      // Ensure values are numbers and in proper range
      const sgst = Number(form.sgst);
      const cgst = Number(form.cgst);
      const igst = Number(form.igst);
      if (
        isNaN(sgst) ||
        isNaN(cgst) ||
        isNaN(igst) ||
        sgst < 0 ||
        sgst > 100 ||
        cgst < 0 ||
        cgst > 100 ||
        igst < 0 ||
        igst > 100
      ) {
        setSnackbar({
          open: true,
          severity: "error",
          message: "SGST, CGST, and IGST must each be between 0 and 100.",
        });
        setSaving(false);
        return;
      }
      // Prepare payload, ensure values are numbers
      const payload = {
        ...form,
        sgst,
        cgst,
        igst,
      };
      try {
        if (editing) await ManagerAPI.taxes.update(editing._id, payload);
        else await ManagerAPI.taxes.create(payload);
      } catch (apiErr: any) {
        // Try to show custom backend error if available
        let errMsg = "Failed to save.";
        if (
          apiErr &&
          apiErr.response &&
          apiErr.response.data &&
          apiErr.response.data.error
        ) {
          errMsg = apiErr.response.data.error;
        } else if (typeof apiErr?.message === "string") {
          errMsg = apiErr.message;
        }
        setSnackbar({ open: true, severity: "error", message: errMsg });
        setSaving(false);
        return;
      }
      setDialog(false);
      refresh();
      setSnackbar({
        open: true,
        severity: "success",
        message: editing ? "Tax updated" : "Tax added",
      });
    } finally {
      setSaving(false);
    }
  }
  async function deleteTax() {
    if (!delId) return;
    await ManagerAPI.taxes.remove(delId);
    setDelId(null);
    refresh();
    setSnackbar({ open: true, severity: "success", message: "Deleted" });
  }

  return (
    <ManagerLayout title="Taxes">
      <Card
        elevation={0}
        sx={{ border: "1px solid #dbeafe", borderRadius: 2, mt: 2 }}
      >
        <CardContent sx={{ p: 3 }}>
          <div className="flex justify-between mb-7 items-center">
            <Typography variant="h6" fontWeight={700}>
              Taxes
            </Typography>
            <Button
              variant="contained"
              startIcon={<Icon name="Plus" />}
              onClick={openAdd}
              disabled={loading}
            >
              Add Tax
            </Button>
          </div>
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-lg font-medium">
              Loading…
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500 text-lg font-medium">
              {error}
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-base flex flex-col items-center">
              <span className="mb-3 text-3xl">🧾</span>
              No taxes yet — get started!
            </div>
          ) : (
            <>
              <DataTable
                columns={[
                  { key: "name", header: "Name" },
                  { key: "sgst", header: "SGST (%)" },
                  { key: "cgst", header: "CGST (%)" },
                  { key: "igst", header: "IGST (%)" },
                  {
                    key: "description",
                    header: "Description",
                    render: (r) => r.description || "—",
                  },
                  {
                    key: "isDefault",
                    header: "Default",
                    render: (r) =>
                      r.isDefault ? (
                        <Icon name="Star" className="text-yellow-400" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      ),
                  },
                  {
                    key: "is_active",
                    header: "Status",
                    render: (r) => (
                      <span
                        className={
                          r.is_active
                            ? "text-green-600 font-semibold"
                            : "text-red-500"
                        }
                      >
                        {r.is_active ? "Active" : "Inactive"}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    render: (r) => (
                      <div className="flex gap-1">
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => openEdit(r)}
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
                            onClick={() => setDelId(r._id)}
                            disabled={loading}
                          >
                            <Icon
                              name="Trash2"
                              size={16}
                              className="text-rose-500 hover:text-rose-600"
                            />
                          </IconButton>
                        </Tooltip>
                      </div>
                    ),
                  },
                ]}
                rows={paginatedRows}
              />
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
                    {list.length === 0
                      ? "0–0 of 0"
                      : `${page * rowsPerPage + 1}–${Math.min(
                          (page + 1) * rowsPerPage,
                          list.length
                        )} of ${list.length}`}
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
                      disabled={page + 1 >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                    >
                      <Icon name="ChevronRight" />
                    </IconButton>
                  </div>
                </div>
              </div>
            </>
          )}
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{editing ? "Edit Tax" : "Add Tax"}</DialogTitle>
            <DialogContent sx={{ py: 2 }}>
              <TextField
                label="Tax title *"
                value={form.name}
                fullWidth
                sx={{ mb: 2 }}
                required
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                autoFocus
              />
              <div className="flex gap-2 mb-2">
                <TextField
                  label="SGST rate (%) *"
                  value={form.sgst}
                  type="number"
                  required
                  fullWidth
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sgst: e.target.value }))
                  }
                />
                <TextField
                  label="CGST rate (%) *"
                  value={form.cgst}
                  type="number"
                  required
                  fullWidth
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cgst: e.target.value }))
                  }
                />
                <TextField
                  label="IGST rate (%) *"
                  value={form.igst}
                  type="number"
                  required
                  fullWidth
                  onChange={(e) =>
                    setForm((f) => ({ ...f, igst: e.target.value }))
                  }
                />
              </div>
              <TextField
                label="Description (Optional)"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                fullWidth
                multiline
                minRows={3}
                sx={{ mb: 2 }}
              />
              <div className="flex items-center px-4 py-3 rounded-lg bg-blue-50 mb-4">
                <span className="font-medium text-base flex-1">
                  Set as default
                </span>
                <Switch
                  checked={!!form.isDefault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(false)} variant="outlined">
                Cancel
              </Button>
              <Button onClick={saveTax} variant="contained" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Tax"}
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={!!delId}
            onClose={() => setDelId(null)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Tax?</DialogTitle>
            <DialogContent>
              Delete this tax? This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDelId(null)} variant="outlined">
                Cancel
              </Button>
              <Button onClick={deleteTax} color="error" variant="contained">
                Delete
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
        </CardContent>
      </Card>
    </ManagerLayout>
  );
}
