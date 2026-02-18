"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
import AdminGuard from "../../../components/AdminGuard";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { PlatformStores, PlatformUsers, PlatformSubscriptionPlans } from "../../../lib/api";
import { toast } from "react-toastify";

type StoreDoc = {
  _id: string;
  id?: string;
  storeName?: string;
  storeSlug?: string;
  ownerId?: string;
  owner_id?: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt?: string;
};

export default function Page() {
  const [stores, setStores] = useState<StoreDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<StoreDoc | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [ownerMap, setOwnerMap] = useState<Record<string, { name: string; email: string }>>({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await PlatformStores.list({ limit: 500 });
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const normalizedStores = items.map((s: any) => ({
          ...s,
          _id: s._id || s.id,
          storeName: s.storeName || s.name || s.store_name,
          storeSlug: s.storeSlug || s.slug || s.store_slug
        }));
        setStores(normalizedStores);

        // Load owners for these stores
        const ownerIds = normalizedStores.map((s: any) => s.ownerId || s.owner_id).filter(Boolean);
        if (ownerIds.length) {
          // Fetch all users to build owner map (since filter isn't supported on backend currently)
          const ures = await PlatformUsers.list({ limit: 1000 });
          const uitemsData = ures?.items || ures?.data || ures;
          const uitems = Array.isArray(uitemsData) ? uitemsData : [];

          const map: Record<string, { name: string; email: string }> = {};
          uitems.forEach((u: any) => {
            const uid = u._id || u.id;
            const firstName = u.firstName || u.first_name || "";
            const lastName = u.lastName || u.last_name || "";
            const name = `${firstName} ${lastName}`.trim();
            map[String(uid)] = { name: name || u.email, email: u.email };
          });
          setOwnerMap(map);
        } else {
          setOwnerMap({});
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load stores");
      } finally { setLoading(false); }
    };
    fetch();
  }, [refreshKey]);

  useEffect(() => {
    if (!deleteOpen) return;
    setDeleteCountdown(5);
    const id = setInterval(() => setDeleteCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [deleteOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      const name = (s.storeName || s.storeSlug || "").toLowerCase();
      const matchesQ = !q || name.includes(q);
      const active = (s.status || "active").toLowerCase() === "active";
      const matchesStatus = status === "all" || (status === "active" ? active : !active);
      return matchesQ && matchesStatus;
    });
  }, [stores, search, status]);

  async function confirmDelete() {
    if (!selected) return;
    try {
      await PlatformStores.remove(selected._id);
      toast.success("Store deleted");
      setDeleteOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete store");
    }
  }

  async function toggleActive(store: StoreDoc) {
    try {
      const isCurrentlyActive = (store.status || "active").toLowerCase() === "active";
      const nextStatus = isCurrentlyActive ? "inactive" : "active";

      await PlatformStores.update(store._id || store.id || "", { status: nextStatus });

      toast.success(nextStatus === "active" ? "Store Activated" : "Store Deactivated");
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      console.error("Store update error:", e);
      toast.error(e?.response?.data?.message || "Failed to update store");
    }
  }

  const [planMap, setPlanMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await PlatformSubscriptionPlans.list({ limit: 100 });
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const map: Record<string, string> = {};
        items.forEach((p: any) => { map[String(p._id || p.id)] = p.name; });
        setPlanMap(map);
      } catch (e) {
        console.error("Plan load error:", e);
      }
    };
    fetchPlans();
  }, []);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Stores Management</h1>
              <p className="text-sm text-slate-500 mt-1">Manage, monitor, and configure all platform store instances.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setRefreshKey(k => k + 1)}
                iconName="RefreshCw"
                className="text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                Sync Registry
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Icon name="Store" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Hubs</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{stores.length}</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Platform Wide</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icon name="Zap" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Nodes</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{stores.filter((s) => (s.status || "active").toLowerCase() === "active").length}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Live Status</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Icon name="Power" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Standby</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{stores.filter((s) => (s.status || "active").toLowerCase() !== "active").length}</span>
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Offline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Table Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Table Controls */}
            <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="Search" size={18} />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search store name, slug..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-32">Identity</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-1/3">Store Details</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-1/4">Plan & Domain</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-32">Status</th>
                    <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 text-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 text-sm">
                        No stores found matching your criteria.
                      </td>
                    </tr>
                  ) : filtered.map((s: any) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">
                            {s.human_id || `ST-${String(s._id).substring(0, 4).toUpperCase()}`}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {s.storeName?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <div className="flex flex-col">
                            <Link href={`/admin/stores/${s._id}`} className="text-sm font-semibold text-slate-900 leading-none hover:text-indigo-600 transition-colors">
                              {s.storeName || "Unnamed Store"}
                            </Link>
                            <span className="text-xs text-slate-500 mt-1">{s.owner_name || ownerMap[s.owner_id]?.name || "Unassigned"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${(planMap[s.plan_id] || 'Basic').toLowerCase().includes('pro') ? 'border-indigo-100 bg-indigo-50 text-indigo-600' :
                              (planMap[s.plan_id] || 'Elite').toLowerCase().includes('elite') ? 'border-amber-100 bg-amber-50 text-amber-600' :
                                'border-slate-100 bg-slate-50 text-slate-600'
                              }`}>
                              {planMap[s.plan_id] || 'Standard'}
                            </span>
                            <Link href={`/admin/stores/${s._id}`} className="text-[10px] font-bold text-indigo-600 hover:underline">
                              {s.storeSlug}
                            </Link>
                          </div>
                          <a
                            href={s.custom_domain && s.custom_domain !== '—' ? `https://${s.custom_domain}` : `http://${s.storeSlug}.localhost:3000`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-400 mt-1 italic hover:text-indigo-500 transition-colors"
                          >
                            {s.custom_domain && s.custom_domain !== '—' ? s.custom_domain : `${s.storeSlug}.localhost`}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(s)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${(s.status || "active").toLowerCase() === 'active'
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${(s.status || "active").toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          {(s.status || "active").toLowerCase() === 'active' ? 'Active' : 'Offline'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">

                          <Link
                            href={`/admin/stores/${s._id}`}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Icon name="Eye" size={16} />
                          </Link>
                          <Link
                            href={`/admin/stores/${s._id}/edit`}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icon name="Edit" size={16} />
                          </Link>
                          <button
                            onClick={() => { setSelected(s); setDeleteOpen(true); }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteOpen && selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteOpen(false)}></div>
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6">
                <Icon name="AlertTriangle" size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Store Instance?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                You are about to delete <span className="font-bold text-slate-900">{selected.storeName}</span>. This action will permanently remove all associated data and cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={deleteCountdown > 0}
                  iconName="Trash2"
                >
                  {deleteCountdown > 0 ? `Confirm (${deleteCountdown}s)` : 'Delete Store'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 border-slate-200 text-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
