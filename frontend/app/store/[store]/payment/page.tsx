"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { Store } from "../../../../lib/api";
import AuthGuard from "../../../../components/AuthGuard";
import Loader from "../../../../components/Loader";
import AppIcon from "../../../../components/AppIcon";

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  type: "gateway" | "manual";
  config?: Record<string, any>;
  description: string;
}

interface PaymentConfig {
  methods: PaymentMethod[];
}

export default function PaymentPage() {
  const router = useRouter();
  const { userStore } = useAuth();
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig>({
    methods: [
      {
        id: "razorpay",
        name: "Razorpay",
        enabled: true,
        type: "gateway",
        description: "Accept payments via UPI, Credit/Debit cards, and Netbanking.",
        config: { keyId: "", keySecret: "" }
      },
      {
        id: "cod",
        name: "Cash on Delivery (COD)",
        enabled: false,
        type: "manual",
        description: "Allow customers to pay when they receive the order."
      }
    ]
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
      if (response.success && response.data.config?.payment) {
        setConfig(response.data.config.payment);
      }
    } catch (error) {
      console.error("Failed to load payment settings:", error);
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
          payment: config
        }
      });

      if (response.success) {
        setToast({ message: "Payment settings updated successfully", type: "success" });
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

  const updateConfig = (methodId: string, key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      methods: prev.methods.map(m => m.id === methodId ? {
        ...m,
        config: { ...m.config, [key]: value }
      } : m)
    }));
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-sm text-gray-500 mt-1">Configure how you receive payments from your customers</p>
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
        {config.methods.map((method) => (
          <div key={method.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${method.enabled ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <AppIcon name={method.id === 'razorpay' ? 'CreditCard' : 'Hand'} size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-500 max-w-md">{method.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={method.enabled}
                    onChange={() => toggleMethod(method.id)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {method.enabled && method.id === 'razorpay' && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">API Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Razorpay Key ID</label>
                      <input
                        type="text"
                        value={method.config?.keyId || ""}
                        onChange={(e) => updateConfig(method.id, 'keyId', e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="rzp_test_..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Razorpay Key Secret</label>
                      <input
                        type="password"
                        value={method.config?.keySecret || ""}
                        onChange={(e) => updateConfig(method.id, 'keySecret', e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                    <AppIcon name="AlertTriangle" size={16} className="text-amber-500 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Keep your API keys safe. Do not share them with anyone. These keys are required to process payments through Razorpay.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {method.enabled && (
              <div className="bg-primary/5 px-6 py-3 border-t border-primary/10">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <AppIcon name="ShieldCheck" size={14} />
                  This payment method is currently active on your storefront.
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <AppIcon name="Plus" size={24} className="text-gray-400" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Custom Payment Method</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Need something else? You can request additional payment integrations.</p>
          <button className="mt-4 text-xs font-bold text-primary hover:underline">Contact Support</button>
        </div>
      </div>
    </div>
  );
}
