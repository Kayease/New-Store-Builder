"use client";
import React, { useEffect, useState } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Tooltip,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { ManagerAPI } from "../../../../lib/manager-api";
import Snackbar from "@mui/material/Snackbar";
import { DataTable } from "../../../../components/DataTable";
import DatePicker from "../../../../components/ui/DatePicker";
import Icon from "../../../../components/AppIcon";

interface Promo {
  _id: string;
  store: string;
  code: string;
  description?: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrder?: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  timesUsed?: number;
}

export default function PromocodesPage() {
  const [list, setList] = useState<Promo[]>([]);
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
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 0,
    minOrder: 0,
    isActive: true,
    validFrom: "",
    validTo: "",
    usageLimit: 0,
  });
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data }: any = await ManagerAPI.promocodes.list();
      setList(
        (data || []).sort((a: Promo, b: Promo) => a.code.localeCompare(b.code))
      );
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load.");
    }
    setLoading(false);
  };
  useEffect(() => {
    refresh();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({
      code: "",
      description: "",
      discountType: "percent",
      discountValue: 0,
      minOrder: 0,
      isActive: true,
      validFrom: "",
      validTo: "",
      usageLimit: 0,
    });
    setDialog(true);
  }
  function openEdit(promo: any) {
    setEditing(promo);
    setForm({ ...promo });
    setDialog(true);
  }
  async function savePromo() {
    setSaving(true);
    try {
      if (!form.code || !form.discountValue) {
        setSnackbar({
          open: true,
          severity: "error",
          message: "Code & discount required.",
        });
        setSaving(false);
        return;
      }
      if (editing) await ManagerAPI.promocodes.update(editing._id, form);
      else await ManagerAPI.promocodes.create(form);
      setDialog(false);
      refresh();
      setSnackbar({
        open: true,
        severity: "success",
        message: editing ? "Promo updated" : "Promo added",
      });
    } catch (e: any) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to save.",
      });
    }
    setSaving(false);
  }
  async function deletePromo() {
    if (!delId) return;
    await ManagerAPI.promocodes.remove(delId);
    setDelId(null);
    refresh();
    setSnackbar({ open: true, severity: "success", message: "Deleted" });
  }

  return (
    <ManagerLayout title="Promocodes">
      <Card
        elevation={0}
        sx={{ border: "1px solid #dbeafe", borderRadius: 2, mt: 2 }}
      >
        <CardContent sx={{ p: 3 }}>
          <div className="flex justify-between mb-7 items-center">
            <Typography variant="h6" fontWeight={700}>
              Promocodes
            </Typography>

            <Button
              variant="contained"
              startIcon={<Icon name="Plus" />}
              onClick={openAdd}
              disabled={loading}
            >
              Add Promo
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
              <span className="mb-3 text-3xl">🎟️</span>
              No promocodes yet — why not add your first promo?
            </div>
          ) : (
            <DataTable
              columns={[
                { key: "code", header: "Code" },
                { key: "description", header: "Description" },
                {
                  key: "discountType",
                  header: "Type",
                  render: (r) =>
                    r.discountType === "percent" ? "Percent (%)" : "Flat",
                },
                { key: "discountValue", header: "Value" },
                {
                  key: "isActive",
                  header: "Status",
                  render: (r) => (
                    <span
                      className={
                        r.isActive
                          ? "text-green-600 font-semibold"
                          : "text-red-500"
                      }
                    >
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  ),
                },
                {
                  key: "validFrom",
                  header: "Valid From",
                  render: (r) =>
                    r.validFrom
                      ? new Date(r.validFrom).toLocaleDateString()
                      : "—",
                },
                {
                  key: "validTo",
                  header: "Valid To",
                  render: (r) =>
                    r.validTo ? new Date(r.validTo).toLocaleDateString() : "—",
                },
                {
                  key: "usageLimit",
                  header: "Limit",
                  render: (r) => r.usageLimit || <>∞</>,
                },
                {
                  key: "timesUsed",
                  header: "Used",
                  render: (r) => r.timesUsed ?? 0,
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
              rows={list}
            />
          )}
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>
              {editing ? "Edit Promocode" : "Add Promocode"}
            </DialogTitle>
            <DialogContent sx={{ py: 2 }}>
              <TextField
                label="Code"
                value={form.code}
                fullWidth
                sx={{ mb: 2 }}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                autoFocus
              />
              <TextField
                label="Description"
                value={form.description}
                fullWidth
                sx={{ mb: 2 }}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <div className="flex items-center justify-between gap-2 mb-4">
                <Select
                  value={form.discountType}
                  sx={{ minWidth: 120 }}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discountType: e.target.value }))
                  }
                >
                  <MenuItem value="percent">Percent (%)</MenuItem>
                  <MenuItem value="flat">Flat</MenuItem>
                </Select>

                <div className="flex items-center mr-10">
                  <Switch
                    checked={!!form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                  />
                  <Typography sx={{ ml: 1 }}>
                    {form.isActive ? "Active" : "Inactive"}
                  </Typography>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                <TextField
                  label="Discount Value"
                  value={form.discountValue}
                  type="number"
                  fullWidth
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discountValue: Number(e.target.value),
                    }))
                  }
                />
                <TextField
                  label="Min Order"
                  value={form.minOrder}
                  type="number"
                  fullWidth
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))
                  }
                />
              </div>

              <TextField
                label="Usage Limit"
                value={form.usageLimit}
                type="number"
                fullWidth
                sx={{ my: 2 }}
                onChange={(e) =>
                  setForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))
                }
              />
              <div className="flex items-center justify-between gap-2 mb-2">
                <DatePicker
                  label="Valid From Date"
                  value={
                    form.validFrom || new Date().toISOString().slice(0, 10)
                  }
                  onChange={(date) =>
                    setForm((f) => ({
                      ...f,
                      validFrom: date ? date.format("YYYY-MM-DD") : "",
                    }))
                  }
                />
                <DatePicker
                  label="Valid To Date"
                  value={form.validTo}
                  onChange={(date) =>
                    setForm((f) => ({
                      ...f,
                      validTo: date ? date.format("YYYY-MM-DD") : "",
                    }))
                  }
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(false)} variant="outlined">
                Cancel
              </Button>
              <Button
                onClick={savePromo}
                variant="contained"
                loading={saving}
                disabled={saving}
                startIcon={
                  saving ? (
                    <Icon name="Loader2" className="animate-spin" />
                  ) : (
                    <Icon name="Save" />
                  )
                }
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Promo"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete confirmation dialog */}
          <Dialog
            open={!!delId}
            onClose={() => setDelId(null)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Promocode?</DialogTitle>
            <DialogContent dividers>
              <Typography>
                Delete this promocode? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={() => setDelId(null)}>
                Cancel
              </Button>
              <Button
                onClick={deletePromo}
                variant="contained"
                startIcon={
                  loading ? (
                    <Icon
                      name="Loader2"
                      className="animate-spin text-blue-500"
                    />
                  ) : (
                    <Icon name="Trash2" className="text-rose-500" />
                  )
                }
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>

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
