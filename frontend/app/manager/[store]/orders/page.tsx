"use client";
import React, { useMemo, useState, useEffect } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Checkbox,
  Tooltip,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { MerchantAPI } from "../../../../lib/merchant-api";
import Loader from "../../../../components/Loader";

const statusToChip = (s: Order["status"]) => {
  switch (s) {
    case "pending":
      return (
        <Chip
          size="small"
          label="Pending"
          color="warning"
          variant="outlined"
          icon={<Icon name="Clock" className="text-amber-600" size={16} />}
        />
      );
    case "completed":
      return (
        <Chip
          size="small"
          label="Completed"
          color="success"
          variant="outlined"
          icon={
            <Icon name="CheckCircle2" className="text-emerald-600" size={16} />
          }
        />
      );
    case "cancelled":
      return (
        <Chip
          size="small"
          label="Cancelled"
          color="error"
          variant="outlined"
          icon={<Icon name="XCircle" className="text-rose-600" size={16} />}
        />
      );
    case "refunded":
      return (
        <Chip
          size="small"
          label="Refunded"
          color="default"
          variant="outlined"
          icon={<Icon name="RotateCcw" className="text-slate-600" size={16} />}
        />
      );
    default:
      return <Chip size="small" label={s} />;
  }
};


type Order = {
  id: string;
  customer: { name: string; email: string; avatar?: string };
  date: string; // yyyy-mm-dd hh:mm
  items: number;
  price: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
};

export default function Page() {
  const [tab, setTab] = useState<"all" | Order["status"]>("all");
  const [query, setQuery] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setLoading(true);
    MerchantAPI.orders.list()
      .then((res: any) => {
        if (res.success && res.data) {
          const formatted = res.data.map((o: any) => ({
            id: o.order_number || o.id,
            customer: {
              name: o.customer_name || "Unknown Customer",
              email: o.customer_email || "no-email@example.com"
            },
            date: o.created_at,
            items: 1, // Simplified for now
            price: Number(o.total_amount),
            status: (o.status?.toLowerCase() === "processing" ? "pending" : o.status?.toLowerCase()) as Order["status"]
          }));
          setRows(formatted);
        }
      })
      .catch(err => console.error("Orders fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.all += 1;
        acc[r.status] += 1;
        return acc;
      },
      { all: 0, pending: 0, completed: 0, cancelled: 0, refunded: 0 }
    );
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const byTab = tab === "all" ? true : r.status === tab;
      const byQuery = !q
        ? true
        : [r.id, r.customer.name, r.customer.email]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const dateOnly = (iso: string) => iso.slice(0, 10);
      const byStart = start ? dateOnly(r.date) >= start : true;
      const byEnd = end ? dateOnly(r.date) <= end : true;
      return byTab && byQuery && byStart && byEnd;
    });
  }, [rows, tab, query, start, end]);

  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) =>
    setMenuEl(e.currentTarget);
  const closeMenu = () => setMenuEl(null);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isAllSelected =
    filtered.length > 0 && selectedIds.length === filtered.length;
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((r) => r.id) : []);
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  if (loading) return <Loader />;

  const bulkDelete = () => {
    setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };
  const bulkMarkCompleted = () => {
    setRows((prev) =>
      prev.map((r) =>
        selectedIds.includes(r.id) ? { ...r, status: "completed" } : r
      )
    );
    setSelectedIds([]);
  };
  const bulkExportCsv = () => {
    const header = [
      "Order",
      "Customer",
      "Email",
      "Date",
      "Items",
      "Price",
      "Status",
    ];
    const lines = filtered
      .filter((r) => selectedIds.includes(r.id))
      .map((r) =>
        [
          r.id,
          r.customer.name,
          r.customer.email,
          r.date,
          r.items,
          r.price,
          r.status,
        ].join(",")
      );
    const blob = new Blob([[header.join(",")].concat(lines).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${selectedIds.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ManagerLayout title="Orders Management">
      <div className="max-w-[1400px] mx-auto">
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent sx={{ paddingRight: 5, paddingLeft: 5 }}>
            <div className="flex items-center gap-2 mb-3">
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  minHeight: 44,
                  "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
                  "& .MuiTabs-indicator": { height: 3 },
                }}
              >
                <Tab
                  value="all"
                  icon={<Icon name="List" />}
                  iconPosition="start"
                  label={`All ${counts.all}`}
                />
                <Tab
                  value="pending"
                  icon={<Icon name="Clock" className="text-amber-600" />}
                  iconPosition="start"
                  label={`Pending ${counts.pending}`}
                />
                <Tab
                  value="completed"
                  icon={
                    <Icon name="CheckCircle2" className="text-emerald-600" />
                  }
                  iconPosition="start"
                  label={`Completed ${counts.completed}`}
                />
                <Tab
                  value="cancelled"
                  icon={<Icon name="XCircle" className="text-rose-600" />}
                  iconPosition="start"
                  label={`Cancelled ${counts.cancelled}`}
                />
                <Tab
                  value="refunded"
                  icon={<Icon name="RotateCcw" className="text-slate-600" />}
                  iconPosition="start"
                  label={`Refunded ${counts.refunded}`}
                />
              </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <TextField
                type="date"
                label="Start date"
                InputLabelProps={{ shrink: true }}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <TextField
                type="date"
                label="End date"
                InputLabelProps={{ shrink: true }}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <TextField
                  fullWidth
                  placeholder="Search customer or order number..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">🔎</InputAdornment>
                    ),
                  }}
                />
                <IconButton onClick={openMenu}>
                  <Icon name="MoreVertical" />
                </IconButton>
                <Menu
                  anchorEl={menuEl}
                  open={Boolean(menuEl)}
                  onClose={closeMenu}
                >
                  <MenuItem onClick={closeMenu}>
                    <Icon name="Printer" className="mr-2" /> Print
                  </MenuItem>
                  <MenuItem onClick={closeMenu}>
                    <Icon name="Download" className="mr-2" /> Import
                  </MenuItem>
                  <MenuItem onClick={closeMenu}>
                    <Icon name="Upload" className="mr-2" /> Export
                  </MenuItem>
                </Menu>
              </div>
            </div>

            {tab !== "all" && (
              <div className="flex items-center gap-3 mb-2">
                <Typography variant="body2">Status:</Typography>
                <Chip
                  label={tab.charAt(0).toUpperCase() + tab.slice(1)}
                  size="small"
                />
                <Button
                  size="small"
                  color="error"
                  startIcon={<Icon name="Trash2" />}
                  onClick={() => setTab("all")}
                >
                  Clear
                </Button>
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-3 mb-2 border rounded bg-gray-50">
                <Typography variant="body2" fontWeight={600}>
                  {selectedIds.length} selected
                </Typography>
                <div className="flex items-center gap-2">
                  <Tooltip title="Mark completed">
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<Icon name="CheckCircle2" />}
                      onClick={bulkMarkCompleted}
                    >
                      Complete
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export CSV">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Icon name="Upload" />}
                      onClick={bulkExportCsv}
                    >
                      Export
                    </Button>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Icon name="Trash2" />}
                      onClick={bulkDelete}
                    >
                      Delete
                    </Button>
                  </Tooltip>
                </div>
              </div>
            )}

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selectedIds.includes(r.id)}
                        onChange={(e) => toggleOne(r.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small">{r.id}</Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div>
                          <div className="font-medium">{r.customer.name}</div>
                          <div className="text-sm text-gray-500">
                            {r.customer.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(r.date).toLocaleDateString()}{" "}
                      <div className="text-xs text-gray-500">
                        {new Date(r.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{r.items}</TableCell>
                    <TableCell>${r.price.toFixed(2)}</TableCell>
                    <TableCell>{statusToChip(r.status)}</TableCell>
                    <TableCell align="right">
                      <IconButton>
                        <Icon name="MoreVertical" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-end mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div>Rows per page: 5</div>
                <div>
                  1–{Math.min(5, filtered.length)} of {filtered.length}
                </div>
                <div className="flex gap-1">
                  <IconButton size="small">
                    <Icon name="ChevronLeft" />
                  </IconButton>
                  <IconButton size="small">
                    <Icon name="ChevronRight" />
                  </IconButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
  );
}
