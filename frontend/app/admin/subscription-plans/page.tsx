"use client";
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import AdminGuard from "../../../components/AdminGuard";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { PlatformSubscriptionPlans } from "../../../lib/api";
import { toast } from "react-toastify";

type Plan = {
  _id: string;
  name: string;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  is_active?: boolean;
  isActive?: boolean;
  createdAt?: string;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: "",
    features: [] as string[],
    priceMonthly: "",
    priceYearly: "",
  });
  const [featureInput, setFeatureInput] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);

  const getCategoryColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('elite') || n.includes('enterprise')) return 'from-amber-400 to-orange-600';
    if (n.includes('pro') || n.includes('growth')) return 'from-indigo-500 to-purple-600';
    if (n.includes('starter') || n.includes('basic')) return 'from-emerald-400 to-teal-600';
    if (n.includes('free')) return 'from-slate-400 to-slate-600';
    return 'from-blue-500 to-cyan-600';
  };

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('elite') || n.includes('enterprise')) return 'Crown';
    if (n.includes('pro') || n.includes('growth')) return 'Zap';
    if (n.includes('starter') || n.includes('basic')) return 'Rocket';
    return 'Sparkles';
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await PlatformSubscriptionPlans.list({
          limit: 100,
          sort: JSON.stringify({ createdAt: -1 }),
        });
        const items = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
            ? res.data
            : res;
        const normalized = (Array.isArray(items) ? items : []).map((p: any) => ({
          ...p,
          _id: p._id || p.id,
          isActive: p.isActive ?? p.is_active ?? true
        }));

        // Deduplication removed to show all plans as per user request
        setPlans(normalized.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ));
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load plans");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showForm]);

  useEffect(() => {
    if (!deleteOpen) return;
    setDeleteCountdown(5);
    const id = setInterval(
      () => setDeleteCountdown((c) => (c > 0 ? c - 1 : 0)),
      1000
    );
    return () => clearInterval(id);
  }, [deleteOpen]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const slug = form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const payload = {
        name: form.name.trim(),
        features: (form.features || []).map((s) => s.trim()).filter(Boolean),
        priceMonthly: Number(form.priceMonthly || 0),
        priceYearly: Number(form.priceYearly || 0),
        slug,
      };
      if (editing) {
        await PlatformSubscriptionPlans.update(editing._id, payload);
        toast.success("Plan updated");
      } else {
        await PlatformSubscriptionPlans.create(payload);
        toast.success("Plan created");
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", features: [], priceMonthly: "", priceYearly: "" });
      setFeatureInput("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save plan");
    }
  }

  async function confirmDelete() {
    if (!selectedId) return;
    try {
      await PlatformSubscriptionPlans.remove(selectedId);
      toast.success("Plan deleted");
      setSelectedId(null);
      setDeleteOpen(false);
      setPlans((prev) => prev.filter((p) => p._id !== selectedId));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete plan");
    }
  }

  async function toggleActive(p: Plan) {
    try {
      const currentActive = p.isActive ?? p.is_active ?? true;
      const next = !currentActive;
      await PlatformSubscriptionPlans.update(p._id, { is_active: next });
      setPlans((prev) =>
        prev.map((x) => (x._id === p._id ? { ...x, isActive: next, is_active: next } : x))
      );
      toast.success(next ? "Activated" : "Deactivated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update status");
    }
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className=" flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Subscription Plans</h1>
              <p className="text-sm text-slate-600">
                Define pricing and features for monthly and yearly billing.
              </p>
            </div>
            <Button
              iconName="Plus"
              onClick={() => {
                setEditing(null);
                setForm({
                  name: "",
                  features: [],
                  priceMonthly: "",
                  priceYearly: "",
                });
                setFeatureInput("");
                setShowForm(true);
              }}
            >
              New Plan
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Plans</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {plans.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Book" size={24} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {plans.filter((p) => p.isActive !== false).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Icon
                    name="CheckCircle"
                    size={24}
                    className="text-emerald-600"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Inactive</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {plans.filter((p) => p.isActive === false).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Icon name="XCircle" size={24} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
            <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${billingCycle === "monthly" ? "bg-white text-indigo-600 shadow-lg scale-105" : "text-slate-500 hover:text-slate-700"}`}
              >
                <span>Monthly</span>
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${billingCycle === "yearly" ? "bg-white text-indigo-600 shadow-lg scale-105" : "text-slate-500 hover:text-slate-700"}`}
              >
                <span>Yearly</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full animate-pulse">-20%</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                {plans.length} Premium Tiers Available
              </p>
            </div>
          </div>

          {/* Premium Plans Grid */}
          {loading ? (
            <div className="p-24 text-center bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                <Icon name="Zap" size={32} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
              </div>
              <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent italic">Syncing with Cloud Registry...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 p-20 text-center shadow-2xl">
              <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 shadow-inner">
                <Icon name="PackagePlus" size={48} className="text-slate-300" />
              </div>
              <p className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Empty Vault</p>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Your subscription registry is currently empty. Initialize the first tier to begin scaling.</p>
              <Button onClick={() => setShowForm(true)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 hover:scale-105 transition-all text-lg font-bold">
                Deploy First Plan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {plans.map((p) => {
                const isPremium = p.name.toLowerCase().includes('elite') || p.name.toLowerCase().includes('enterprise') || p.name.toLowerCase().includes('pro');
                return (
                  <div
                    key={p._id}
                    className={`group relative flex flex-col rounded-[2rem] bg-white border-2 border-slate-100 shadow-xl transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:border-indigo-200 overflow-hidden ${isPremium ? 'ring-2 ring-indigo-500/20' : ''}`}
                  >
                    {/* Floating Glow */}
                    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br ${getCategoryColor(p.name)}`}></div>

                    {/* Header Section */}
                    <div className={`p-5 pb-2 relative`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${getCategoryColor(p.name)} text-white transform group-hover:rotate-12 transition-transform duration-500`}>
                          <Icon name={getCategoryIcon(p.name)} size={20} />
                        </div>
                        {!(p.isActive ?? p.is_active ?? true) && (
                          <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-1 rounded-full border border-red-100 uppercase tracking-widest shadow-sm">Offline</span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.name}</h3>
                      <div className="h-1 w-8 bg-indigo-100 rounded-full mt-1 group-hover:w-16 transition-all duration-500"></div>
                    </div>

                    {/* Pricing Section */}
                    <div className="px-5 py-4 bg-slate-50/50 relative overflow-hidden text-center md:text-left">
                      <div className="flex items-baseline mb-0 justify-center md:justify-start">
                        <span className="text-2xl font-black text-slate-900 leading-none">₹{billingCycle === 'monthly' ? p.priceMonthly : p.priceYearly}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1.5">/ {billingCycle}</span>
                      </div>
                      {billingCycle === 'yearly' && p.priceMonthly > 0 && (
                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Save ₹{(p.priceMonthly * 12) - p.priceYearly} /yr</p>
                      )}
                    </div>

                    {/* Features Section */}
                    <div className="p-5 pt-4 flex-grow space-y-3">
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Privileges</div>
                      <ul className="space-y-2">
                        {Array.isArray(p.features) && p.features.length > 0 ? (
                          p.features.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-start group/li transition-transform duration-300 hover:translate-x-1">
                              <div className={`mt-0.5 mr-2 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getCategoryColor(p.name)} text-white shadow-sm opacity-80`}>
                                <Icon name="Check" size={10} strokeWidth={4} />
                              </div>
                              <span className="text-xs font-semibold text-slate-600 group-hover/li:text-slate-900 transition-colors truncate">{f}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs font-medium italic text-slate-400">Standard Tier</li>
                        )}
                        {p.features && p.features.length > 4 && (
                          <li className="text-[9px] font-bold text-indigo-500 pt-1 border-t border-slate-100">+{p.features.length - 4} more perks</li>
                        )}
                      </ul>
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 border-t border-slate-50 bg-white flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setForm({
                            name: p.name,
                            features: (p.features || []).slice(),
                            priceMonthly: String(p.priceMonthly || 0),
                            priceYearly: String(p.priceYearly || 0),
                          });
                          setFeatureInput("");
                          setShowForm(true);
                        }}
                        className="flex-1 py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-indigo-100 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => toggleActive(p)}
                        className={`p-2 rounded-lg border transition-all duration-300 hover:scale-105 ${(p.isActive ?? p.is_active ?? true) ? "border-emerald-100 text-emerald-500 hover:bg-emerald-50" : "border-red-100 text-red-500 hover:bg-red-50"}`}
                        title={(p.isActive ?? p.is_active ?? true) ? "Deactivate" : "Activate"}
                      >
                        <Icon name={(p.isActive ?? p.is_active ?? true) ? "Power" : "Zap"} size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedId(p._id);
                          setDeleteOpen(true);
                        }}
                        className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:border-red-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:scale-105"
                        title="Delete"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}



          {/* Create / Edit Drawer */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {editing ? "Edit Plan" : "Create Plan"}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Icon name="X" size={20} className="text-slate-600" />
                  </button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Plan name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Features
                    </label>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = featureInput.trim();
                            if (v) {
                              setForm((f) => ({
                                ...f,
                                features: [...(f.features || []), v],
                              }));
                              setFeatureInput("");
                            }
                          }
                        }}
                        placeholder="Type a feature and press Enter"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        iconName="Plus"
                        onClick={() => {
                          const v = featureInput.trim();
                          if (!v) return;
                          setForm((f) => ({
                            ...f,
                            features: [...(f.features || []), v],
                          }));
                          setFeatureInput("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(form.features || []).map((ftr, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"
                        >
                          {ftr}
                          <button
                            type="button"
                            className="ml-2 text-slate-500 hover:text-slate-700"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                features: (f.features || []).filter(
                                  (_, i) => i !== idx
                                ),
                              }))
                            }
                            aria-label="Remove feature"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Monthly price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.priceMonthly}
                        onChange={(e) =>
                          setForm({ ...form, priceMonthly: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Yearly price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.priceYearly}
                        onChange={(e) =>
                          setForm({ ...form, priceYearly: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center space-x-3">
                    <Button type="submit" className="bg-primary text-white">
                      {editing ? "Update" : "Create"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {deleteOpen && selectedId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Delete Plan
                  </h3>
                  <p className="text-sm text-red-700 mt-1 bg-red-50 border border-red-200 rounded-md p-3">
                    This action is permanent. The plan will be deleted and cannot
                    be recovered.
                  </p>
                </div>
                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                    iconName="Trash2"
                    disabled={deleteCountdown > 0}
                  >
                    {deleteCountdown > 0
                      ? `Delete in ${deleteCountdown}s`
                      : "Delete"}
                  </Button>
                  <Button
                    onClick={() => setDeleteOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Plan Details Modal */}
        {viewingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className={`p-8 pb-6 bg-gradient-to-br ${getCategoryColor(viewingPlan.name)} relative overflow-hidden`}>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Icon name={getCategoryIcon(viewingPlan.name)} size={120} />
                </div>

                <button
                  onClick={() => setViewingPlan(null)}
                  className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md z-50"
                  type="button"
                >
                  <Icon name="X" size={20} />
                </button>

                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/10">
                    <Icon name={getCategoryIcon(viewingPlan.name)} size={32} />
                  </div>
                  {viewingPlan.name.toLowerCase().includes('growth') && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Best Value</span>
                  )}
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10">{viewingPlan.name}</h2>
                <div className="flex items-baseline gap-1 text-white/90 relative z-10">
                  <span className="text-4xl font-black">₹{billingCycle === 'monthly' ? viewingPlan.priceMonthly : viewingPlan.priceYearly}</span>
                  <span className="text-sm font-bold opacity-80 uppercase tracking-widest">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Icon name="Layers" size={14} /> Included Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {viewingPlan.features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className={`mt-0.5 p-1 rounded-full text-white flex-shrink-0 bg-gradient-to-br ${getCategoryColor(viewingPlan.name)} shadow-sm`}>
                        <Icon name="Check" size={10} strokeWidth={4} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Details */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <p className="text-xs font-medium text-slate-500">
                    Admin view: You can edit or delete this plan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditing(viewingPlan);
                    setForm({
                      name: viewingPlan.name,
                      features: (viewingPlan.features || []).slice(),
                      priceMonthly: String(viewingPlan.priceMonthly || 0),
                      priceYearly: String(viewingPlan.priceYearly || 0),
                    });
                    setFeatureInput("");
                    setShowForm(true);
                    setViewingPlan(null);
                  }}
                  className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg transform transition-all active:scale-95 flex items-center gap-2 text-white bg-slate-900 hover:bg-indigo-600 hover:shadow-xl hover:-translate-y-1`}
                >
                  <Icon name="Edit" size={16} /> Edit Plan
                </button>
              </div>

            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
