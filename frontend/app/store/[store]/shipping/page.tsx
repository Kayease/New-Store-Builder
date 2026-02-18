"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { Store } from "../../../../lib/api";
import AuthGuard from "../../../../components/AuthGuard";
import Loader from "../../../../components/Loader";
import AppIcon from "../../../../components/AppIcon";

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  enabled: boolean;
}

interface ShippingConfig {
  enabled: boolean;
  methods: ShippingMethod[];
  freeShippingThreshold: number;
}

export default function ShippingPage() {
  const router = useRouter();
  const { userStore } = useAuth();
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ShippingConfig>({
    enabled: true,
    methods: [
      { id: "standard", name: "Standard Delivery", price: 50, estimatedDays: "3-5", enabled: true },
      { id: "express", name: "Express Delivery", price: 120, estimatedDays: "1-2", enabled: false }
    ],
    freeShippingThreshold: 1000
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const storeMatch = path.match(/\/store\/([^\/]+)/);
    if (storeMatch) {
      setStoreSlug(storeMatch[1]);
    }
  }, []);

  useEffect(() => {
    if (storeSlug) {
      loadSettings();
    }
  }, [storeSlug]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await Store.get(storeSlug);
      if (response.success && response.data.config?.shipping) {
        setConfig(response.data.config.shipping);
      }
    } catch (error) {
      console.error("Failed to load shipping settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Fetch current settings first to merge config
      const current = await Store.get(storeSlug);
      const currentConfig = current.data.config || {};

      const response = await Store.update(storeSlug, {
        config: {
          ...currentConfig,
          shipping: config
        }
      });

      if (response.success) {
        setToast({ message: "Shipping settings updated successfully", type: "success" });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ message: "Failed to update settings", type: "error" });
      }
    } catch (error) {
      setToast({ message: "An error occurred while saving", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (id: string) => {
    setConfig(prev => ({
      ...prev,
      methods: prev.methods.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m)
    }));
  };

  const updateMethod = (id: string, field: keyof ShippingMethod, value: any) => {
    setConfig(prev => ({
      ...prev,
      methods: prev.methods.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping & Delivery</h1>
          <p className="text-sm text-gray-500 mt-1">Configure how you deliver products to your customers</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <AppIcon name="Loader2" size={16} className="animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {toast && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          <AppIcon name={toast.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={20} />
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Configuration */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">General Configuration</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.enabled}
                onChange={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">{config.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={config.freeShippingThreshold}
                  onChange={(e) => setConfig(prev => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. 1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Orders above this amount will have free shipping enabled.</p>
            </div>
          </div>
        </div>

        {/* Shipping Methods */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping Methods</h3>
          <div className="space-y-4">
            {config.methods.map((method) => (
              <div key={method.id} className={`p-4 rounded-xl border transition-all ${method.enabled ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${method.enabled ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                        <AppIcon name="Truck" size={20} />
                      </div>
                      <input
                        type="text"
                        value={method.name}
                        onChange={(e) => updateMethod(method.id, 'name', e.target.value)}
                        className="bg-transparent font-semibold text-gray-900 focus:outline-none border-b border-transparent focus:border-primary/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Rate (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs text-xs">₹</span>
                          <input
                            type="number"
                            value={method.price}
                            onChange={(e) => updateMethod(method.id, 'price', Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Est. Delivery Time</label>
                        <input
                          type="text"
                          value={method.estimatedDays}
                          onChange={(e) => updateMethod(method.id, 'estimatedDays', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="e.g. 3-5 days"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMethod(method.id)}
                    className={`ml-4 p-2 rounded-lg transition-colors ${method.enabled ? 'text-primary hover:bg-primary/10' : 'text-gray-400 hover:bg-gray-200'}`}
                  >
                    <AppIcon name={method.enabled ? "CheckCircle2" : "Circle"} size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2 group">
            <AppIcon name="Plus" size={20} className="group-hover:scale-110 transition-transform" />
            Add New Method
          </button>
        </div>
      </div>
    </div>
  );
}
