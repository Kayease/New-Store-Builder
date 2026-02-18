"use client";
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import AdminGuard from "../../../components/AdminGuard";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { PlatformSubscriptions, PlatformUsers, PlatformStores, PlatformSubscriptionPlans } from "../../../lib/api";
import { toast } from "react-toastify";

type Subscription = {
  _id: string;
  userId: string;
  storeId: string;
  planId: string;
  status: string;
  startedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  owner_name?: string;
  owner_email?: string;
  store_name?: string;
  store_slug?: string;
  plan_name?: string;
};

export default function SubscriptionsPage() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [detail, setDetail] = useState<Subscription | null>(null);
  const [maps, setMaps] = useState<{ users: Record<string, any>; stores: Record<string, any>; plans: Record<string, any> }>({ users: {}, stores: {}, plans: {} });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await PlatformSubscriptions.list({ limit: 200 });
        const raw = res?.items || res?.data || res;
        const subs = Array.isArray(raw) ? raw : [];
        setItems(subs.map((s: any) => ({
          ...s,
          _id: s._id || s.id,
          storeId: s.storeId || s.store_id,
          planId: s.planId || s.plan_id
        })));
      } catch (e: any) {
        console.error("Subs load error:", e);
        toast.error(e?.response?.data?.message || "Failed to load subscriptions");
      } finally { setLoading(false); }
    };
    load();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s: any) => {
      const uname = (s.owner_name || "").toLowerCase();
      const sname = (s.store_name || "").toLowerCase();
      const pname = (s.plan_name || "").toLowerCase();
      const matches = !q || uname.includes(q) || sname.includes(q) || pname.includes(q);
      const active = (s.status || "").toLowerCase() === "active";
      const statusOk = status === "all" || (status === "active" ? active : !active);
      return matches && statusOk;
    });
  }, [items, search, status]);

  function formatDate(d?: string) { return d ? new Date(d).toLocaleString() : "—"; }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Subscriptions</h1>
              <p className="text-sm text-slate-600">All customers currently subscribed to plans.</p>
            </div>
            <div className="flex items-center space-x-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="canceled">Canceled</option>
              </select>
              <Button variant="outline" iconName="RefreshCw" onClick={() => setRefreshKey(k => k + 1)}>Refresh</Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-800">{items.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-800">{items.filter(s => (s.status || "").toLowerCase() === "active").length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={24} className="text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Inactive</p>
                  <p className="text-2xl font-bold text-slate-800">{items.filter(s => (s.status || "").toLowerCase() === "inactive").length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Icon name="XCircle" size={24} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p className="text-slate-600 mt-2">Loading subscriptions...</p></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-600">No subscriptions match your criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Store</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Plan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Started</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Expires</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filtered.map((s: any) => {
                      const uname = s.owner_name || "—";
                      return (
                        <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-800">{uname}</div>
                            <div className="text-xs text-slate-500">{s.owner_email || "—"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-800">{s.store_name || "—"}</div>
                            <div className="text-xs text-slate-500">{s.store_slug || "—"}</div>
                          </td>
                          <td className="px-6 py-4">{s.plan_name || "—"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${String(s.status).toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                              {s.status || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{formatDate(s.startedAt)}</td>
                          <td className="px-6 py-4">{formatDate(s.expiresAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" iconName="Eye" onClick={() => setDetail(s)}>View</Button>
                              <Button variant="outline" size="sm" iconName="Ban" className="text-amber-600 border-amber-200 hover:text-amber-700 hover:border-amber-300" onClick={async () => { try { await PlatformSubscriptions.setStatus(s._id, 'blocked'); toast.success('Subscription blocked'); setRefreshKey(k => k + 1); } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } }}>Block</Button>
                              <Button variant="outline" size="sm" iconName="XCircle" className="text-red-600 border-red-200 hover:text-red-700 hover:border-red-300" onClick={async () => { try { await PlatformSubscriptions.setStatus(s._id, 'canceled'); toast.success('Subscription canceled'); setRefreshKey(k => k + 1); } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } }}>Cancel</Button>
                              <Button variant="outline" size="sm" iconName="Mail" onClick={() => toast.success('Email sent (demo)')}>Email</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail modal */}
          {detail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Subscription Details</h3>
                  <button onClick={() => setDetail(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Icon name="X" size={20} className="text-slate-600" /></button>
                </div>
                {(() => {
                  const s = detail as Subscription;
                  const u = maps.users[String(s.userId)] || {};
                  const st = maps.stores[String(s.storeId)] || {};
                  const p = maps.plans[String(s.planId)] || {};
                  const uname = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">User</h4>
                        <p className="text-sm text-slate-800">{uname}</p>
                        <p className="text-xs text-slate-600">{u.email}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Store</h4>
                        <p className="text-sm text-slate-800">{st.storeName || '—'}</p>
                        <p className="text-xs text-slate-600">{st.storeSlug}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Plan</h4>
                        <p className="text-sm text-slate-800">{p.name || '—'}</p>
                        <p className="text-xs text-slate-600">Monthly: ${p.priceMonthly ?? 0} • Yearly: ${p.priceYearly ?? 0}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Timeline</h4>
                        <p className="text-sm text-slate-800">Started: {formatDate(s.startedAt)}</p>
                        <p className="text-sm text-slate-800">Expires: {formatDate(s.expiresAt)}</p>
                        <p className="text-xs text-slate-600">Status: {s.status}</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="mt-4 flex items-center justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}


