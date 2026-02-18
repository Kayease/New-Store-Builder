"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import AdminGuard from "../../../components/AdminGuard";
import { PlatformDashboard } from "../../../lib/api";
import Icon from "../../../components/AppIcon";


type DashboardStats = {
  total_users: number;
  total_merchants: number;
  total_stores: number;
  active_stores: number;
  total_revenue: number;
  recent_revenue: number;
  active_subscriptions: number;
  total_plans: number;
  currency: string;
};

type Activity = {
  type: string;
  message: string;
  email?: string;
  slug?: string;
  status?: string;
  timestamp: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          PlatformDashboard.getStats(),
          PlatformDashboard.getRecentActivity()
        ]);
        const statsData = statsRes.success ? statsRes.data : statsRes;
        const activitiesData = activityRes.success ? activityRes.data : activityRes;
        setStats(statsData);
        setActivities(activitiesData.items || activitiesData || []);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="w-full flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  const mainCards = [
    {
      title: "Merchants",
      value: stats?.total_merchants || 0,
      icon: "Users",
      color: "blue",
      subtitle: "Verified platform partners",
      href: "/admin/users"
    },
    {
      title: "Active Stores",
      value: stats?.active_stores || 0,
      icon: "Store",
      color: "emerald",
      subtitle: "Live digital shopfronts",
      href: "/admin/stores"
    },
    {
      title: "Subscription Plans",
      value: stats?.total_plans || 0,
      icon: "Zap",
      color: "amber",
      subtitle: "Available service tiers",
      href: "/admin/subscription-plans"
    },
    {
      title: "Active Subs",
      value: stats?.active_subscriptions || 0,
      icon: "ShieldCheck",
      color: "purple",
      subtitle: "Premium account holders",
      href: "/admin/subscriptions"
    },
    {
      title: "Total Revenue",
      value: `₹${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: "CreditCard",
      color: "rose",
      subtitle: "All-time platform earnings",
      href: "/admin/payment-transactions"
    },
  ];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="max-w-[1600px] mx-auto space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-6">
            <div>
              <h2 className="text-2xl font-black text-[#1a2333] tracking-tight">Home</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Live Platform Feed</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#1a2333] hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                Export Reports
              </button>
              <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-100">
                Sync Registry
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {mainCards.map((card, i) => (
              <a
                key={i}
                href={card.href}
                className="group relative bg-white border border-[#e5eaf2] rounded-[24px] p-6 hover:shadow-2xl hover:shadow-indigo-600/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-out`}>
                    <Icon name={card.icon} size={32} />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {card.title} <span className="text-slate-400">({card.value})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">{card.subtitle}</p>
                </div>
                {/* Decorative background element */}
                <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-${card.color}-50/50 group-hover:scale-150 transition-transform duration-700`}></div>
              </a>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-[#e5eaf2] rounded-[32px] overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-slate-50 bg-[#fafcfe]/50 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1a2333]">Recent Transactions</h3>
                  <button className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="p-4">
                  {activities.length > 0 ? (
                    <div className="space-y-2">
                      {activities.slice(0, 6).map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#f8faff] transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.type === 'payment' ? 'bg-orange-50 text-orange-600' :
                              activity.type === 'new_store' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                              <Icon name={activity.type === 'payment' ? 'CreditCard' : activity.type === 'new_store' ? 'Store' : 'UserPlus'} size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1a2333]">{activity.message}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{new Date(activity.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${activity.type === 'payment' ? 'bg-orange-100 text-orange-700' :
                            activity.type === 'new_store' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {activity.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-slate-400 font-medium">No recent activities found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-6">
              <div className="bg-[#1a2333] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Platform Growth</h3>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">System status is optimal. All cloud registers are synchronized.</p>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 tracking-wider">NETWORK STATUS</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-black tracking-widest">ONLINE</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[94%]" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">94% Capacity Utilized</p>
                  </div>
                </div>
                {/* Decorative SVG/Elements could go here */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
              </div>

              <div className="bg-white border border-[#e5eaf2] rounded-[32px] p-6 shadow-sm">
                <h3 className="text-sm font-black text-[#1a2333] uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Shortcuts</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Plans", icon: "Zap", href: "/admin/subscription-plans" },
                    { label: "Payments", icon: "CreditCard", href: "/admin/payment-transactions" },
                    { label: "Themes", icon: "Palette", href: "/admin/themes" },
                    { label: "Audit", icon: "Shield", href: "/admin/dashboard" },
                  ].map((s, i) => (
                    <a key={i} href={s.href} className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Icon name={s.icon} size={20} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{s.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
