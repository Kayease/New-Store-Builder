"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { Store, MerchantDashboard } from "../../../../lib/api";
import Loader from "../../../../components/Loader";
import AppIcon from "../../../../components/AppIcon";
import Link from "next/link";

export default function StoreViewPage() {
  const { userStore } = useAuth();
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const storeMatch = path.match(/\/store\/([^\/]+)/);
    if (storeMatch) {
      setStoreSlug(storeMatch[1]);
    }
  }, []);

  useEffect(() => {
    if (storeSlug) {
      loadData();
    }
  }, [storeSlug]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, statsRes] = await Promise.all([
        Store.get(storeSlug),
        userStore ? MerchantDashboard.getStats(userStore._id || userStore.id) : null
      ]);

      if (settingsRes.success) {
        setSettings(settingsRes.data);
      }
      setStats(statsRes);
    } catch (error) {
      console.error("Failed to load store view data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const shippingConfig = settings?.config?.shipping;
  const paymentConfig = settings?.config?.payment;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Store Overview */}
        <div className="lg:col-span-2 space-y-6">

          {/* Store Quick Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 p-8 flex items-end">
              <div className="flex items-center gap-4 translate-y-12">
                <div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  {settings?.logo_url ? (
                    <img src={settings.logo_url} alt={settings.name} className="h-full w-full object-cover" />
                  ) : (
                    <AppIcon name="Store" size={40} className="text-primary/20" />
                  )}
                </div>
                <div className="mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{settings?.name}</h1>
                  <p className="text-sm text-gray-500 font-medium">{settings?.slug}.storecraft.com</p>
                </div>
              </div>
            </div>
            <div className="pt-16 pb-8 px-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${settings?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-sm font-semibold capitalize">{settings?.status || 'Active'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Plan</p>
                  <p className="mt-1 text-sm font-semibold">Professional</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Joined</p>
                  <p className="mt-1 text-sm font-semibold">{settings?.created_at ? new Date(settings.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <Link href={`/manager/${storeSlug}/home`} className="mt-1 inline-flex items-center text-sm font-bold text-primary hover:underline gap-1">
                    Manage Store <AppIcon name="ChevronRight" size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Shipping Summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AppIcon name="Truck" size={18} className="text-primary" /> Shipping
                </h3>
                <Link href="./shipping" className="text-xs font-bold text-primary hover:underline">Edit</Link>
              </div>
              {shippingConfig?.enabled ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Methods</span>
                    <span className="font-semibold">{shippingConfig.methods.filter((m: any) => m.enabled).length} Methods</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Free threshold</span>
                    <span className="font-semibold">₹{shippingConfig.freeShippingThreshold}</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-gray-400 italic">Shipping is not configured yet.</p>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AppIcon name="CreditCard" size={18} className="text-primary" /> Payments
                </h3>
                <Link href="./payment" className="text-xs font-bold text-primary hover:underline">Edit</Link>
              </div>
              {paymentConfig?.methods ? (
                <div className="space-y-3">
                  {paymentConfig.methods.map((m: any) => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span className="text-gray-500">{m.name}</span>
                      <span className={`font-semibold ${m.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {m.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-gray-400 italic">Payment methods not set.</p>
                </div>
              )}
            </div>
          </div>

          {/* Notifications Summary */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AppIcon name="Bell" size={18} className="text-primary" /> Notification Settings
              </h3>
              <Link href="./notifications" className="text-xs font-bold text-primary hover:underline">Edit</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Order Updates</p>
                <p className="text-sm font-semibold text-green-600 mt-0.5">Enabled</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Inventory Alerts</p>
                <p className="text-sm font-semibold text-green-600 mt-0.5">Enabled</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Marketing Emails</p>
                <p className="text-sm font-semibold text-gray-400 mt-0.5">Disabled</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Stats Snapshot */}
        <div className="space-y-6">
          <div className="bg-primary rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
            <h3 className="text-sm font-medium opacity-80 mb-4">Gross Sales (30 Days)</h3>
            <p className="text-3xl font-bold">{stats?.stats?.find((s: any) => s.label === 'Gross Sale')?.value || '₹0.00'}</p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-white/70">
              <AppIcon name="TrendingUp" size={14} />
              <span>+12.5% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Store Performance</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <AppIcon name="ShoppingBag" size={16} />
                  </div>
                  <span className="text-sm text-gray-600">Total Orders</span>
                </div>
                <span className="text-sm font-bold">{stats?.counts?.orders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <AppIcon name="Users" size={16} />
                  </div>
                  <span className="text-sm text-gray-600">Customers</span>
                </div>
                <span className="text-sm font-bold">{stats?.counts?.customers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <AppIcon name="Package" size={16} />
                  </div>
                  <span className="text-sm text-gray-600">Products</span>
                </div>
                <span className="text-sm font-bold">{stats?.counts?.products || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <AppIcon name="Zap" size={18} />
              </div>
              <h4 className="font-bold text-emerald-900">Setup Score</h4>
            </div>
            <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-emerald-600 h-full w-[85%] rounded-full"></div>
            </div>
            <p className="text-xs text-emerald-700 font-medium">Your store is 85% ready for launch! Complete domain verification to hit 100%.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
