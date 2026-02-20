"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "../../../../components/admin/AdminLayout";
import AdminGuard from "../../../../components/AdminGuard";
import Icon from "../../../../components/AppIcon";
import Button from "../../../../components/ui/Button";
import { PlatformStores, PlatformUsers, PlatformSubscriptionPlans } from "../../../../lib/api";
import { toast } from "react-toastify";
import Link from "next/link";

export default function StoreViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [owner, setOwner] = useState<any>(null);
    const [manager, setManager] = useState<any>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [plan, setPlan] = useState<any>(null);
    const [allPlans, setAllPlans] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storeData = await PlatformStores.get(id as string);
                setStore(storeData);

                // Prioritize Store Table Manager Details
                if (storeData.manager_email) {
                    setManager({
                        name: storeData.manager_name || "Assigned Manager",
                        email: storeData.manager_email,
                        phone: storeData.manager_phone,
                        id: storeData.manager_id,
                        role: 'Manager'
                    });
                }

                if (storeData.owner_id) {
                    try {
                        const ownerData = await PlatformUsers.get(storeData.owner_id);
                        setOwner(ownerData);
                    } catch (e) {
                        console.error("Owner fetch error:", e);
                    }
                }

                // Fetch team members and find managers
                try {
                    const teamRes = await PlatformStores.listTeam(id as string);
                    const teamItems = teamRes.success ? teamRes.data.items : (teamRes.items || []);
                    setTeam(teamItems);
                    const foundManager = teamItems.find((m: any) => m.role?.toLowerCase() === 'manager');
                    if (foundManager) setManager(foundManager);
                } catch (e) {
                    console.error("Team fetch error:", e);
                }

                // Fetch products overview
                try {
                    const prodRes = await PlatformStores.listProducts(id as string);
                    setProducts(prodRes.data || prodRes.items || []);
                } catch (e) {
                    console.error("Products fetch error:", e);
                }

                if (storeData.plan_id) {
                    try {
                        const planData = await PlatformSubscriptionPlans.get(storeData.plan_id);
                        setPlan(planData);
                    } catch (e) {
                        console.error("Plan fetch error:", e);
                    }
                }

                // Fetch All Plans for Service Allocation Grid
                try {
                    const allPlansRes = await PlatformSubscriptionPlans.list({ limit: 100 });
                    const planItems = allPlansRes.success ? allPlansRes.data.items || allPlansRes.data : (allPlansRes.items || allPlansRes.data || allPlansRes);
                    setAllPlans(Array.isArray(planItems) ? planItems : []);
                } catch (e) {
                    console.error("All plans fetch error:", e);
                }
            } catch (error: any) {
                toast.error("Failed to load store details");
                router.push("/admin/stores");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, router]);

    if (loading) {
        return (
            <AdminGuard>
                <AdminLayout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </AdminLayout>
            </AdminGuard>
        );
    }

    if (!store) return null;

    return (
        <AdminGuard>
            <AdminLayout>
                <div className="max-w-6xl mx-auto py-4 space-y-6">
                    {/* Header: Compact & High Impact */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-5">
                            <Link
                                href="/admin/stores"
                                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all group"
                                title="Back to Registry"
                            >
                                <Icon name="ArrowLeft" size={20} className="group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <Icon name="Store" size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1 font-black text-[#1a2333]">
                                    <a
                                        href="https://www.bluenile.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-3xl tracking-tight truncate max-w-[300px] hover:text-indigo-600 transition-colors"
                                    >
                                        {store.name || store.storeName}
                                    </a>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${store.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {store.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5"><Icon name="Key" size={12} /> {(store._id || store.id || '').toString().slice(-8)}</span>
                                    <span className="flex items-center gap-1.5"><Icon name="Link" size={12} /> {store.slug || store.storeSlug}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <a
                                href="https://www.bluenile.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                View Live
                            </a>
                            <Link
                                href={`/admin/stores/${id}/edit`}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                            >
                                <Icon name="Settings" size={16} />
                                Configure
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Info Column */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Analytics Mock / Placeholder */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Icon name="BarChart3" size={24} />
                                    </div>
                                </div>
                                <h3 className="text-sm font-black text-[#1a2333] uppercase tracking-widest mb-8">Instance Performance</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    {[
                                        { label: "Active Products", val: store.stats?.activeProducts || 0, color: "indigo", icon: "Package" },
                                        { label: "Active Customers", val: store.stats?.activeCustomers || 0, color: "emerald", icon: "Users" },
                                        { label: "Categories", val: store.stats?.activeCategories || 0, color: "amber", icon: "Tag" },
                                        { label: "Team Size", val: store.stats?.teamSize || 0, color: "purple", icon: "Shield" },
                                    ].map((stat, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Icon name={stat.icon as any} size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                                            </div>
                                            <p className={`text-xl font-black text-${stat.color}-600`}>{stat.val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 h-32 w-full bg-indigo-50/30 rounded-2xl border border-dashed border-indigo-200 flex flex-col items-center justify-center text-indigo-600 font-bold text-xs uppercase tracking-widest gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Real-time Database Connection Active
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-medium lowercase italic">All stats fetched live from registry</span>
                                </div>
                            </div>

                            {/* Network Details */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-[#1a2333] uppercase tracking-widest mb-6">Network Configuration</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                                <Icon name="Globe" size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Domain</p>
                                                <p className="text-sm font-bold text-slate-900">{store.custom_domain || "Not Configured"}</p>
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Verify DNS</button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                                <Icon name="Link2" size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Slug</p>
                                                <p className="text-sm font-bold text-slate-900">/{store.slug || store.storeSlug}</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Resolved</div>
                                    </div>
                                </div>
                            </div>



                            {/* Portfolio Snapshot: Unique Implementation */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black text-[#1a2333] uppercase tracking-widest">Portfolio Snapshot</h3>
                                    <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        Registry Index
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Products</p>
                                            <p className="text-3xl font-black text-[#1a2333] tracking-tighter">{products.length < 10 ? `0${products.length}` : products.length}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Icon name="Package" size={24} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100">
                                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Inventory Valuation</p>
                                        <div className="flex items-end gap-1">
                                            <p className="text-3xl font-black tracking-tighter">
                                                ₹{products.reduce((acc, p) => acc + (p.price || 0), 0).toLocaleString()}
                                            </p>
                                            <span className="text-[10px] font-bold text-indigo-200 uppercase mb-1.5">* Est.</span>
                                        </div>
                                    </div>
                                </div>

                                {products.length > 0 ? (
                                    <div className="mt-8">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Registry Preview</p>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                            {products.slice(0, 5).map((p, i) => (
                                                <div key={i} className="aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden group">
                                                    {p.images?.[0] ? (
                                                        <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    ) : (
                                                        <Icon name="Image" size={16} className="text-slate-300" />
                                                    )}
                                                </div>
                                            ))}
                                            <Link href="/admin/products" className="aspect-square rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                                <Icon name="Plus" size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-8 py-10 border-2 border-dashed border-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <Icon name="PackageSearch" size={32} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Warehouse Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Column */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Proprietor Card */}
                            <div className="bg-[#1a2333] p-8 rounded-[2rem] text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Merchant Identity</h3>
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <Icon name="ShieldCheck" size={16} className="text-indigo-400" />
                                        </div>
                                    </div>
                                    {owner ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold uppercase shadow-lg shadow-indigo-500/20">
                                                    {owner.first_name?.[0]}{owner.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg leading-tight">{owner.first_name} {owner.last_name}</h4>
                                                    <p className="text-xs text-slate-400 font-medium">{owner.email}</p>
                                                </div>
                                            </div>
                                            <Link href="/admin/users" className="block w-full text-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-4">
                                                View Complete Profile
                                            </Link>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 font-bold italic text-sm">Identity unverified in registry.</p>
                                    )}
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full translate-x-10 -translate-y-10"></div>
                            </div>

                            {/* Personnel Registry: Unique List Implementation */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Personnel Registry</h3>
                                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                            <Icon name="Users" size={16} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Primary Manager Node */}
                                        {manager && (
                                            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-100">
                                                        {manager.name?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-sm text-[#1a2333] leading-tight">{manager.name}</h4>
                                                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest">Manager</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                                                        <Icon name="Mail" size={12} className="text-indigo-400" />
                                                        <span className="truncate">{manager.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                                                        <Icon name="Phone" size={12} className="text-indigo-400" />
                                                        <span>{manager.phone || "No contact"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Secondary Crew List */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Active Staff ({team.filter(m => m.role?.toLowerCase() !== 'manager').length})</p>
                                            <div className="max-h-[220px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                                {team.filter(m => m.role?.toLowerCase() !== 'manager').length > 0 ? (
                                                    team.filter(m => m.role?.toLowerCase() !== 'manager').map((member, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all group/member">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover/member:text-indigo-600 group-hover/member:border-indigo-100 transition-colors">
                                                                    {member.name?.[0] || member.email?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-[#1a2333] leading-none mb-1">{member.name || member.email.split('@')[0]}</p>
                                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                                        {member.role || 'Staff'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button className="p-1.5 opacity-0 group-hover/member:opacity-100 text-slate-300 hover:text-indigo-600 transition-all">
                                                                <Icon name="ChevronRight" size={14} />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-slate-300 font-bold italic py-4 text-center">No secondary crew members found.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
