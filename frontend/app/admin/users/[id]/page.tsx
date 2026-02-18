"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "../../../../components/admin/AdminLayout";
import AdminGuard from "../../../../components/AdminGuard";
import Icon from "../../../../components/AppIcon";
import Button from "../../../../components/ui/Button";
import { PlatformUsers, PlatformStores } from "../../../../lib/api";
import { toast } from "react-toastify";
import Link from "next/link";

export default function UserViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await PlatformUsers.get(id as string);
                setUser(userData);

                // Fetch stores owned by this user
                const storesRes = await PlatformStores.list({ limit: 100 });
                const storeItems = storesRes?.items || storesRes?.data || storesRes;
                const userStores = Array.isArray(storeItems)
                    ? storeItems.filter(s => (s.owner_id === id || s.ownerId === id))
                    : [];
                setStores(userStores);
            } catch (error: any) {
                toast.error("Failed to load user details");
                router.push("/admin/users");
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

    if (!user) return null;

    const initials = `${user.firstName?.[0] || user.first_name?.[0] || ''}${user.lastName?.[0] || user.last_name?.[0] || ''}`.toUpperCase();

    return (
        <AdminGuard>
            <AdminLayout>
                <div className="max-w-5xl mx-auto py-6 space-y-8">
                    {/* Compact Profile Header */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
                                {initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-black text-[#1a2333] tracking-tight">
                                        {user.firstName || user.first_name} {user.lastName || user.last_name}
                                    </h1>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {user.role || 'User'}
                                    </span>
                                </div>
                                <p className="text-slate-400 font-bold text-sm">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/admin/users/edit/${id}`)}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                            >
                                <Icon name="Edit" size={16} />
                                Edit Profile
                            </Button>
                            <Button
                                onClick={() => router.push("/admin/users")}
                                className="px-6 py-2.5 bg-[#1a2333] text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                <Icon name="ArrowLeft" size={16} />
                                Back
                            </Button>
                        </div>

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Information Grid */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Personal Dossier</h3>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                            <Icon name="Mail" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                                            <p className="text-sm font-bold text-[#1a2333]">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                            <Icon name="Phone" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                                            <p className="text-sm font-bold text-[#1a2333]">{user.phone || 'Not provided'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                            <Icon name="Calendar" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Created</p>
                                            <p className="text-sm font-bold text-[#1a2333]">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                            <Icon name="Shield" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Security Status</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 font-black"></div>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Verified Identity</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Associated Stores / Business Column */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group min-h-[400px]">
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Owned Enterprises</h3>
                                    <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        {stores.length} Linked Units
                                    </div>
                                </div>

                                {stores.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                        {stores.map((s, i) => (
                                            <Link
                                                key={i}
                                                href={`/admin/stores/${s._id || s.id}`}
                                                className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-indigo-600 hover:text-white transition-all group/card shadow-sm hover:shadow-xl hover:shadow-indigo-600/10"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover/card:bg-indigo-500/20 group-hover/card:border-transparent flex items-center justify-center text-indigo-600 group-hover/card:text-white transition-all shadow-sm">
                                                        <Icon name="Store" size={24} />
                                                    </div>
                                                    <Icon name="ArrowUpRight" size={16} className="text-slate-300 group-hover/card:text-indigo-200" />
                                                </div>
                                                <h4 className="text-lg font-black tracking-tight mb-1">{s.name || s.storeName}</h4>
                                                <div className="flex items-center justify-between mt-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">/{s.slug || s.storeSlug}</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} group-hover/card:bg-white/20 group-hover/card:text-white`}>
                                                        {s.status || 'Active'}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-slate-300 gap-4 relative z-10">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                                            <Icon name="Store" size={32} />
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center">No Storefronts Registered<br /><span className="text-[9px] font-medium normal-case tracking-normal opacity-60">This user hasn't initialized any businesses yet.</span></p>
                                    </div>
                                )}

                                {/* Decorative Abstract Pattern */}
                                <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-50/30 blur-[80px] rounded-full translate-x-1/4 translate-y-1/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
