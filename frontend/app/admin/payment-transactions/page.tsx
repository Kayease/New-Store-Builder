"use client";
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import AdminGuard from "../../../components/AdminGuard";
import {
  PlatformPaymentTransactions,
  PlatformUsers,
  PlatformStores,
} from "../../../lib/api";
import { toast } from "react-toastify";

type Tx = {
  _id: string;
  userId?: string;
  storeId?: string;
  gateway?: string; // legacy field (some providers)
  paymentProvider?: string; // normalized provider name
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  transactionId?: string; // provider transaction id if any
  paymentMethod?: string; // card, upi, netbanking, etc.
  refundAmount?: number;
  refundedAt?: string;
  createdAt?: string;
  owner_name?: string;
  owner_email?: string;
  store_name?: string;
  store_slug?: string;
};

export default function PaymentTransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [maps, setMaps] = useState<{
    users: Record<string, any>;
    stores: Record<string, any>;
  }>({ users: {}, stores: {} });
  const [gateway, setGateway] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");
  const [cycle, setCycle] = useState<string>("all"); // metadata.billingCycle from Mongo (monthly/yearly)

  // Distinct lists for filters (computed lazily)
  const gateways = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((r) => (r.paymentProvider || r.gateway || "").toLowerCase())
            .filter(Boolean)
        )
      ),
    [rows]
  );
  const methods = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((r) => String(r.paymentMethod || "").toLowerCase())
            .filter(Boolean)
        )
      ),
    [rows]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await PlatformPaymentTransactions.list({
          limit: 500
        });
        const items = res?.items || res?.data || res;
        const rows = Array.isArray(items) ? items : [];
        setRows(rows.map((r: any) => ({
          ...r,
          _id: r._id || r.id
        })));
      } catch (e: any) {
        console.error("Payment load error:", e);
        toast.error(e?.response?.data?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, gateway, method, cycle]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r: any) => {
      const uname = (r.owner_name || "").toLowerCase();
      const sname = (r.store_name || "").toLowerCase();
      const match =
        !q ||
        uname.includes(q) ||
        sname.includes(q) ||
        (r.orderId || "").toLowerCase().includes(q) ||
        (r.paymentId || "").toLowerCase().includes(q);
      const okStatus =
        status === "all" || String(r.status || "").toLowerCase() === status;
      const okGateway =
        gateway === "all" ||
        String(r.paymentProvider || r.gateway || "").toLowerCase() === gateway;
      const okMethod =
        method === "all" ||
        String(r.paymentMethod || "").toLowerCase() === method;
      return match && okStatus && okGateway && okMethod;
    });
  }, [rows, search, status, gateway, method]);

  const formatCurrency = (amt?: number, cur?: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: cur || "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(Number(amt || 0)));
  const formatDateTime = (d?: string) =>
    d ? new Date(d).toLocaleString() : "—";

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Payment Transactions</h1>
              <p className="text-sm text-slate-600">
                All captured payments across the platform.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, store, order or payment id..."
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value="all">All Status</option>
                <option value="captured">Captured</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value="all">All Gateways</option>
                {gateways.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value="all">All Methods</option>
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value="all">All Cycles</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-600">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                No transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Store
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Gateway
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Payment ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Txn ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Method
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Refund
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filtered.map((r) => {
                      const u =
                        (r as any).metadataUser ||
                        maps.users[String(r.userId)] ||
                        {};
                      const st = maps.stores[String(r.storeId)] || {};
                      const uname =
                        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                        u.email ||
                        "";

                      return (
                        <tr
                          key={r._id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-800">
                              {r.owner_name || "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.owner_email || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-800">
                              {r.store_name || "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.store_slug || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {r.gateway || r.paymentProvider || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {(r as any).orderId || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {(r as any).paymentId || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {r.transactionId || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {r.paymentMethod || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {formatCurrency(r.amount, r.currency)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${String(r.status || "").toLowerCase() ===
                                "captured"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                                }`}
                            >
                              {r.status || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {r.refundAmount ? (
                              <div>
                                <div className="text-sm text-slate-800">
                                  {formatCurrency(r.refundAmount, r.currency)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {formatDateTime(r.refundedAt)}
                                </div>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {formatDateTime(r.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
