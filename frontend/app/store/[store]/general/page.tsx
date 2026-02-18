"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { useStoreCtx } from "../../../../contexts/StoreContext";
import { Store } from "../../../../lib/api";
import { uploadFile } from "../../../../lib/cloudinary";
import AuthGuard from "../../../../components/AuthGuard";
import Loader from "../../../../components/Loader";
import AppIcon from "../../../../components/AppIcon";
import { LogoManager } from "../../../../components/logo/LogoManager";
import {
  FaviconManager,
  FaviconManagerRef,
} from "../../../../components/favicon/FaviconManager";
import { TextField } from "@mui/material";

interface Toast {
  message: string;
  type: "success" | "error" | "info";
}

export default function GeneralSettings() {
  const params = useParams();
  const { storeSlug, setStoreSlug, setPageTitle } = useStoreCtx();
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // OTP Modal State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Simple state for each field
  const [storeName, setStoreName] = useState("");
  const [storeSlugState, setStoreSlugState] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [googleTagManagerId, setGoogleTagManagerId] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  // Edit modes for each section
  const [editBasic, setEditBasic] = useState(false);
  const [editBusiness, setEditBusiness] = useState(false);
  const [editSocial, setEditSocial] = useState(false);
  const [editAnalytics, setEditAnalytics] = useState(false);
  const [editSeo, setEditSeo] = useState(false);
  const [editLogo, setEditLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [favicons, setFavicons] = useState<Record<string, any>>({});
  const faviconManagerRef = React.useRef<FaviconManagerRef>(null);

  // Set page title
  useEffect(() => {
    setPageTitle("General Settings");
  }, [setPageTitle]);

  // Load settings when storeSlug is available
  useEffect(() => {
    if (storeSlug) {
      loadSettings();
    }

    const cleanup = () => {
      const tempLogo = sessionStorage.getItem(`temp_logo_${storeSlug}`);
      if (tempLogo) {
        try {
          const logoData = JSON.parse(tempLogo);
          if (logoData.objectUrl) URL.revokeObjectURL(logoData.objectUrl);
        } catch (e) { }
        sessionStorage.removeItem(`temp_logo_${storeSlug}`);
      }

      const tempFavicons = sessionStorage.getItem(`temp_favicons_${storeSlug}`);
      if (tempFavicons) {
        try {
          const faviconData = JSON.parse(tempFavicons);
          Object.values(faviconData).forEach((favicon: any) => {
            if (favicon.url && favicon.url.startsWith("blob:")) URL.revokeObjectURL(favicon.url);
          });
        } catch (e) { }
        sessionStorage.removeItem(`temp_favicons_${storeSlug}`);
      }
    };

    window.addEventListener("beforeunload", cleanup);
    return () => window.removeEventListener("beforeunload", cleanup);
  }, [storeSlug]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await Store.get(storeSlug);
      if (response.success) {
        const data = response.data;
        setSettings(data);
        setStoreName(data.storeName || "");
        setStoreSlugState(data.storeSlug || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setBusinessName(data.businessName || "");
        setTaxId(data.taxId || "");
        setDescription(data.description || "");
        setTagline(data.tagline || "");
        setFacebook(data.social?.facebook || "");
        setInstagram(data.social?.instagram || "");
        setTwitter(data.social?.twitter || "");
        setPinterest(data.social?.pinterest || "");
        setYoutube(data.social?.youtube || "");
        setTiktok(data.social?.tiktok || "");
        setGoogleAnalyticsId(data.analytics?.googleAnalyticsId || "");
        setFacebookPixelId(data.analytics?.facebookPixelId || "");
        setGoogleTagManagerId(data.analytics?.googleTagManagerId || "");
        setMetaTitle(data.seo?.metaTitle || "");
        setMetaDescription(data.seo?.metaDescription || "");
        setMetaKeywords(data.seo?.metaKeywords || "");
        setLogoUrl(data.logoUrl || "");
        setFavicons(data.favicons || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  const cancelEdit = (section: string) => {
    if (section === "basic") {
      setStoreName(settings.storeName || "");
      setStoreSlugState(settings.storeSlug || "");
      setEmail(settings.email || "");
      setPhone(settings.phone || "");
      setEditBasic(false);
    } else if (section === "business") {
      setBusinessName(settings.businessName || "");
      setTaxId(settings.taxId || "");
      setDescription(settings.description || "");
      setTagline(settings.tagline || "");
      setEditBusiness(false);
    } else if (section === "logo") {
      setLogoUrl(settings.logoUrl || "");
      setFavicons(settings.favicons || {});
      setEditLogo(false);
    }
  };

  const saveSection = async (section: string) => {
    let updateData: any = {};
    if (section === "basic") updateData = { storeName, storeSlug: storeSlugState, email, phone };
    else if (section === "business") updateData = { businessName, taxId, description, tagline };
    else if (section === "logo") {
      try {
        setSaving(true);
        let finalLogoUrl = logoUrl;
        if (logoUrl && logoUrl.startsWith("blob:")) {
          const blob = await fetch(logoUrl).then(r => r.blob());
          const file = new File([blob], "logo.png", { type: blob.type });
          const uploadedRes = await uploadFile(file);
          if (uploadedRes.success && uploadedRes.data) {
            finalLogoUrl = uploadedRes.data.url;
          }
        }
        let finalFavicons = favicons;
        if (faviconManagerRef.current?.hasTempFavicons) {
          finalFavicons = await faviconManagerRef.current.saveFavicons();
        }
        updateData = { logoUrl: finalLogoUrl, favicons: finalFavicons };
      } catch (err) {
        setToast({ message: "Upload failed", type: "error" });
        setSaving(false); return;
      }
    }

    try {
      setSaving(true);
      const response = await Store.update(storeSlug, updateData);
      if (response.success) {
        setSettings({ ...settings, ...updateData });
        setToast({ message: "Updated successfully", type: "success" });
        if (section === "basic" && updateData.storeSlug !== storeSlug) {
          setStoreSlug(updateData.storeSlug);
          setTimeout(() => router.push(`/store/${updateData.storeSlug}/general`), 1000);
        }
        if (section === "basic") setEditBasic(false);
        if (section === "business") setEditBusiness(false);
        if (section === "logo") setEditLogo(false);
      }
    } catch (err) {
      setToast({ message: "Update failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="bg-indigo-600 h-1 w-full sticky top-0 z-[100]" />

        {toast && (
          <div className="fixed top-6 right-6 z-50">
            <div className={`px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 border bg-white ${toast.type === "success" ? "border-green-100 text-green-700" : "border-red-100 text-red-700"}`}>
              <AppIcon name={toast.type === "success" ? "CheckCircle" : "AlertCircle"} size={20} />
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <AppIcon name="Store" size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-lg">Store Identity</h3>
                  </div>
                  {!editBasic && (
                    <button onClick={() => setEditBasic(true)} className="p-2 text-slate-400">
                      <AppIcon name="Edit" size={18} />
                    </button>
                  )}
                </div>
                <div className="p-8">
                  {editBasic ? (
                    <div className="space-y-6">
                      <TextField label="Store Name" value={storeName} onChange={(e) => { setStoreName(e.target.value); setStoreSlugState(generateSlug(e.target.value)); }} fullWidth />
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Slug Preview</p>
                        <p className="font-mono text-indigo-600">/{storeSlugState}</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => saveSection("basic")} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Save Changes</button>
                        <button onClick={() => cancelEdit("basic")} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Store Name</p>
                        <p className="text-lg font-bold text-slate-900">{settings.storeName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Slug</p>
                        <p className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">/{settings.storeSlug}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <AppIcon name="Briefcase" size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-lg">Business Details</h3>
                  </div>
                  {!editBusiness && (
                    <button onClick={() => setEditBusiness(true)} className="p-2 text-slate-400">
                      <AppIcon name="Edit" size={18} />
                    </button>
                  )}
                </div>
                <div className="p-8">
                  {editBusiness ? (
                    <div className="space-y-6">
                      <TextField label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} fullWidth />
                      <TextField label="Tax ID" value={taxId} onChange={(e) => setTaxId(e.target.value)} fullWidth />
                      <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} />
                      <div className="flex gap-4">
                        <button onClick={() => saveSection("business")} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Save Changes</button>
                        <button onClick={() => cancelEdit("business")} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Description</p>
                        <p className="text-slate-700 leading-relaxed font-medium">{settings.description || "Not added yet."}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8">
                <LogoManager
                  storeSlug={storeSlug}
                  currentLogoUrl={logoUrl}
                  onLogoUpdated={setLogoUrl}
                />
                {!editLogo && (
                  <button onClick={() => setEditLogo(true)} className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors">
                    Manage Logo & Assets
                  </button>
                )}
                {editLogo && (
                  <div className="mt-6 flex flex-col gap-3">
                    <button onClick={() => saveSection("logo")} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Upload & Save</button>
                    <button onClick={() => cancelEdit("logo")} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8">
                <FaviconManager
                  ref={faviconManagerRef}
                  storeSlug={storeSlug}
                  savedFavicons={favicons}
                  onFaviconsUpdated={setFavicons}
                />
              </section>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
