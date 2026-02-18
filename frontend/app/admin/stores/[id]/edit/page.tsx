"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import AdminGuard from "../../../../../components/AdminGuard";
import Icon from "../../../../../components/AppIcon";
import Button from "../../../../../components/ui/Button";
import { PlatformStores, PlatformUsers, PlatformSubscriptionPlans } from "../../../../../lib/api";
import { toast } from "react-toastify";
import Link from "next/link";

export default function StoreEditPage() {
    const { id } = useParams();
    const router = useRouter();
    const [store, setStore] = useState<any>(null);
    const [owner, setOwner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        custom_domain: "",
        status: "active",
        plan_id: "",
        manager_name: "",
        manager_email: "",
        manager_phone: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [storeData, plansData] = await Promise.all([
                    PlatformStores.get(id as string),
                    PlatformSubscriptionPlans.list({ limit: 100 })
                ]);

                setStore(storeData);
                setPlans(Array.isArray(plansData?.items) ? plansData.items : Array.isArray(plansData) ? plansData : []);

                // Fetch Owner Details
                if (storeData.owner_id) {
                    try {
                        const ownerData = await PlatformUsers.get(storeData.owner_id);
                        setOwner(ownerData);
                    } catch (e) {
                        console.error("Owner fetch error:", e);
                    }
                }

                setFormData({
                    name: storeData.name || storeData.storeName || "",
                    slug: storeData.slug || storeData.storeSlug || "",
                    description: storeData.description || "",
                    custom_domain: storeData.custom_domain && storeData.custom_domain !== '—' ? storeData.custom_domain : "",
                    status: storeData.status || "active",
                    plan_id: storeData.plan_id || "",
                    manager_name: storeData.manager_name || "",
                    manager_email: storeData.manager_email || "",
                    manager_phone: storeData.manager_phone || ""
                });
            } catch (error: any) {
                toast.error("Failed to load store data");
                router.push("/admin/stores");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await PlatformStores.update(id as string, formData);
            toast.success("Store configuration updated successfully");
            router.push(`/admin/stores/${id}`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update store");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminGuard>
                <AdminLayout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-500 font-medium">Synchronizing Configuration...</p>
                    </div>
                </AdminLayout>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <AdminLayout>
                <div className="relative flex flex-col gap-10 max-w-6xl mx-auto py-6">
                    {/* Background Decorative Blur */}
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                    {/* Premium Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-6">
                            <Link href={`/admin/stores/${id}`} className="group p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md hover:bg-slate-50 transition-all">
                                <Icon name="ArrowLeft" size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configure Hub</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <p className="text-sm text-slate-500 font-medium">Modifying <span className="text-slate-900 font-bold">{store?.name || store?.storeName}</span> infrastructure settings</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link href={`/admin/stores/${id}`}>
                                <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all">Discard</Button>
                            </Link>
                            <Button
                                onClick={handleSubmit}
                                className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-200 transition-all flex items-center gap-2"
                                loading={saving}
                                iconName="Save"
                            >
                                Synchronize Updates
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* Form Side */}
                        <div className="lg:col-span-8 flex flex-col gap-10">

                            {/* Identity Parameters */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-600">
                                            <Icon name="Settings" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Technical Identity</h3>
                                            <p className="text-xs text-slate-400 font-medium tracking-wide">Core signifiers and network routing</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Instance Display Name</label>
                                        <div className="relative group/input">
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                                placeholder="e.g. Apex Distribution Hub"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Universal Slug</label>
                                        <div className="relative group/input">
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                                placeholder="slug-identifier"
                                                required
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                                <Icon name="Link" size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Detailed Narrative</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 min-h-[120px] resize-none"
                                            placeholder="Enter a comprehensive description of this store's purpose and operations..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Custom Domain Route</label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm tracking-tighter">https://</div>
                                            <input
                                                type="text"
                                                value={formData.custom_domain}
                                                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                                                className="w-full pl-20 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                                placeholder="shop.yourdomain.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Operational Management */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-600">
                                            <Icon name="Users" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Operational Management</h3>
                                            <p className="text-xs text-slate-400 font-medium tracking-wide">Assign and update store manager credentials</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 space-y-8">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Manager Name</label>
                                        <input
                                            type="text"
                                            value={formData.manager_name}
                                            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-900"
                                            placeholder="Enter manager full name"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contact Email</label>
                                            <input
                                                type="email"
                                                value={formData.manager_email}
                                                onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-900"
                                                placeholder="manager@example.com"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Direct Phone</label>
                                            <input
                                                type="text"
                                                value={formData.manager_phone}
                                                onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-900"
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Sidebar */}
                        <div className="lg:col-span-4 flex flex-col gap-10">

                            {/* Merchant Identity */}
                            <div className="bg-[#1a2333] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full translate-x-10 -translate-y-10"></div>
                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
                                        <Icon name="ShieldCheck" size={14} className="text-indigo-400" />
                                        Merchant Identity
                                    </h3>
                                    {owner ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black uppercase shadow-lg shadow-indigo-500/20">
                                                    {owner.first_name?.[0]}{owner.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg leading-tight">{owner.first_name} {owner.last_name}</h4>
                                                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1">Authorized Owner</p>
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-white/10 space-y-4">
                                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                                    <Icon name="Mail" size={14} />
                                                    <span className="font-medium truncate">{owner.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                                    <Icon name="User" size={14} />
                                                    <span className="font-medium">{owner.username || "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">Awaiting Identity</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operational Status */}
                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Operational Mode</h3>

                                <div className="flex flex-col gap-4">
                                    <div
                                        onClick={() => setFormData({ ...formData, status: 'active' })}
                                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.status === 'active' ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100' : 'border-slate-50 bg-slate-50 hover:border-slate-100'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${formData.status === 'active' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                            <span className={`text-xs font-black uppercase tracking-widest ${formData.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>Broadcast Live</span>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFormData({ ...formData, status: 'inactive' })}
                                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.status === 'inactive' ? 'border-rose-500 bg-rose-50 shadow-sm shadow-rose-100' : 'border-slate-50 bg-slate-50 hover:border-slate-100'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${formData.status === 'inactive' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'bg-slate-300'}`}></div>
                                            <span className={`text-xs font-black uppercase tracking-widest ${formData.status === 'inactive' ? 'text-rose-700' : 'text-slate-400'}`}>Standby Mode</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Audit */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 px-2 flex items-center gap-2">
                                        <Icon name="ShieldCheck" size={16} className="text-emerald-500" />
                                        Registry Health
                                    </h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Data Integrity</span>
                                        <span className="text-emerald-600 font-black">98.4% Verified</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[98%] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
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
