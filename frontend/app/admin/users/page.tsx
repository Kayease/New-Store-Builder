// @ts-nocheck
"use client";
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import AdminGuard from "../../../components/AdminGuard";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { PlatformUsers, PlatformStores } from "../../../lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Helper components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

type Role = "admin" | "merchant" | "manager" | "customer" | "user";
type UserDoc = {
  isActive: boolean;
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: Role;
  status?: "active" | "suspended" | "deleted" | string;
  createdAt?: string;
};
type StoreDoc = { _id: string; storeName?: string; ownerId?: string };

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<StoreDoc[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<UserDoc | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await PlatformUsers.list({
          limit: 500,
          sort: JSON.stringify({ createdAt: -1 }),
        });
        const items = res?.items || res?.data || res;
        setUsers(Array.isArray(items) ? items : []);

        const sres = await PlatformStores.list({
          limit: 1000
        });
        const sitems = sres?.items || sres?.data || sres;
        const normalizedStores = Array.isArray(sitems) ? sitems.map(s => ({
          ...s,
          _id: s._id || s.id,
          storeName: s.storeName || s.name || s.store_name,
          ownerId: s.ownerId || s.owner_id
        })) : [];
        setStores(normalizedStores);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const uRole = (u.role || "").toLowerCase();

      // Filter logic
      const matchesQ = !q ||
        (u.firstName || u.first_name || "").toLowerCase().includes(q) ||
        (u.lastName || u.last_name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      // Default view: Show everything EXCEPT admins
      // If role filter is 'all', we specifically exclude admins to keep the list clean
      const matchesRole = role === "all"
        ? !uRole.includes("admin")
        : uRole === role.toLowerCase();

      const active = (u.status || "active") === "active";
      const matchesStatus = status === "all" || (status === "active" ? active : !active);

      return matchesQ && matchesRole && matchesStatus;
    });
  }, [users, search, role, status]);

  const stats = useMemo(() => {
    const merchants = users.filter((u) => (u.role || "").toLowerCase() === "merchant").length;
    const managers = users.filter((u) => (u.role || "").toLowerCase() === "manager").length;
    return {
      totalClients: merchants + managers,
      merchants,
      managers,
    };
  }, [users]);

  const getStoreForUser = (user: UserDoc) => {
    // 1. Try store_name on user object (from backend mapping)
    const nameOnUser = user.storeName || user.store_name;
    if (nameOnUser) return nameOnUser;

    // 2. Try to find in stores list by ownerId
    const userId = user._id || user.id;
    const store = stores.find(s => s.ownerId === userId || s.owner_id === userId);
    return store?.storeName || store?.name || "—";
  };

  const getUserInitials = (user: UserDoc) => {
    const f = user.firstName || user.first_name || "";
    const l = user.lastName || user.last_name || "";
    return `${f[0] || ""}${l[0] || ""}`.toUpperCase();
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await PlatformUsers.remove(selected._id || selected.id);
      toast.success("User & Store Removed");
      setDeleteOpen(false);
      setRefreshKey(k => k + 1);
    } catch (e) {
      toast.error("Deletion failed");
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Users Management</h1>
            <Button onClick={() => router.push("/admin/users/new")} className="bg-primary hover:bg-primary/90 text-white shadow-lg px-8 py-2.5 rounded-xl font-semibold flex items-center gap-2">
              <Icon name="PlusCircle" size={20} />
              Add Merchant
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total  Users", val: stats.totalClients, icon: "Users", color: "blue" },
              { label: "Active Merchants", val: stats.merchants, icon: "Store", color: "emerald" },
              { label: "Store Managers", val: stats.managers, icon: "UserCheck", color: "indigo" },
            ].map(s => (
              <Card key={s.label} className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-${s.color}-50 text-${s.color}-600`}>
                    <Icon name={s.icon} size={28} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-black text-gray-900">{s.val}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Search & List */}
          <Card>
            <div className="p-4 border-b bg-gray-50/50 flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search name or email..."
                  className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select value={role} onChange={e => setRole(e.target.value)} className="bg-white border text-sm rounded-lg px-3 py-2 outline-none">
                <option value="all">All Roles</option>
                <option value="merchant">Merchant</option>
                <option value="manager">Manager</option>
                <option value="admin">Admins (System)</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fcfdfe] text-gray-600 font-semibold border-b">
                  <tr>
                    <th className="px-6 py-4 w-1/3">USER DETAILS</th>
                    <th className="px-6 py-4 w-32">ROLE</th>
                    <th className="px-6 py-4 w-32">STATUS</th>
                    <th className="px-6 py-4 w-1/4">STORE</th>
                    <th className="px-6 py-4 text-right w-32">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.slice((page - 1) * pageSize, page * pageSize).map(u => (
                    <tr key={u._id || u.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {getUserInitials(u)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.firstName || u.first_name} {u.lastName || u.last_name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">{u.role}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStoreForUser(u)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => router.push(`/admin/users/${u._id || u.id}`)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors" title="View Profile"><Icon name="Eye" size={16} /></button>
                        <button onClick={() => router.push(`/admin/users/edit/${u._id || u.id}`)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit User"><Icon name="Edit" size={16} /></button>
                        <button onClick={() => { setSelected(u); setDeleteOpen(true); }} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Delete Account"><Icon name="Trash2" size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between text-gray-500">
              <p>Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)} to {Math.min(filtered.length, page * pageSize)} of {filtered.length} entries</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => (p * pageSize < filtered.length ? p + 1 : p))} disabled={page * pageSize >= filtered.length}>Next</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Delete Confirmation */}
        {deleteOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Icon name="Trash2" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Are you sure?</h3>
                <p className="text-gray-500">This will permanently delete the merchant profile and all their store data. This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>No, Keep</Button>
                <Button className="flex-1 bg-red-600 text-white" onClick={handleDelete}>Yes, Delete</Button>
              </div>
            </div>
          </div>
        )}

      </AdminLayout>
    </AdminGuard>
  );
}
