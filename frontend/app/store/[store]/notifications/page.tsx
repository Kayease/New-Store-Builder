"use client";

import React, { useState, useEffect } from "react";
import { Store } from "../../../../lib/api";
import Loader from "../../../../components/Loader";
import AppIcon from "../../../../components/AppIcon";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export default function NotificationsPage() {
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: "order_confirmation", title: "Order Confirmation", description: "Sent to customers when they place an order.", email: true, sms: true, push: false },
    { id: "shipping_update", title: "Shipping Updates", description: "Notify customers when their order is shipped.", email: true, sms: false, push: true },
    { id: "inventory_alert", title: "Low Inventory Alerts", description: "Get notified when product stock is low.", email: true, sms: false, push: false },
    { id: "payout_notification", title: "Payout Notifications", description: "Receive alerts for successful payouts.", email: true, sms: false, push: false }
  ]);

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
      if (response.success && response.data.config?.notifications) {
        setSettings(response.data.config.notifications);
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const current = await Store.get(storeSlug);
      const currentConfig = current.data.config || {};

      const response = await Store.update(storeSlug, {
        config: {
          ...currentConfig,
          notifications: settings
        }
      });

      if (response.success) {
        setToast({ message: "Notification settings updated successfully", type: "success" });
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

  const toggleSetting = (id: string, channel: 'email' | 'sms' | 'push') => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [channel]: !s[channel] } : s));
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Manage how you and your customers get notified about store events</p>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">SMS</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Push</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {settings.map((setting) => (
              <tr key={setting.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5">
                  <p className="text-sm font-semibold text-gray-900">{setting.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                </td>
                <td className="px-6 py-5 text-center">
                  <button onClick={() => toggleSetting(setting.id, 'email')} className={`inline-flex items-center justify-center h-8 w-12 rounded-lg transition-colors ${setting.email ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <AppIcon name={setting.email ? "Check" : "Minus"} size={16} />
                  </button>
                </td>
                <td className="px-6 py-5 text-center">
                  <button onClick={() => toggleSetting(setting.id, 'sms')} className={`inline-flex items-center justify-center h-8 w-12 rounded-lg transition-colors ${setting.sms ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <AppIcon name={setting.sms ? "Check" : "Minus"} size={16} />
                  </button>
                </td>
                <td className="px-6 py-5 text-center">
                  <button onClick={() => toggleSetting(setting.id, 'push')} className={`inline-flex items-center justify-center h-8 w-12 rounded-lg transition-colors ${setting.push ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <AppIcon name={setting.push ? "Check" : "Minus"} size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
          <AppIcon name="Mail" size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Custom SMTP Settings</h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            By default, all emails are sent via StoreCraft servers. Upgrade to the Enterprise plan to use your own SMTP server or Amazon SES for better deliverability and custom branding.
          </p>
          <button className="mt-4 text-xs font-bold text-blue-700 hover:underline">Learn More</button>
        </div>
      </div>
    </div>
  );
}
