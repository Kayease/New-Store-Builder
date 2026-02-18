// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import AdminGuard from "../../../../../components/AdminGuard";
import Icon from "../../../../../components/AppIcon";
import Button from "../../../../../components/ui/Button";
import { PlatformUsers, PlatformStores } from "../../../../../lib/api";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";

// Helper components
const Card = ({ children, className = "" }) => (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ title, iconName, subtitle }) => (
    <div className="bg-white px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
            {iconName && <Icon name={iconName} size={18} className="text-primary" />}
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </div>
    </div>
);

const FormField = ({ label, children, required }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const Input = (props) => (
    <input
        {...props}
        className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm outline-none placeholder:text-gray-400 ${props.className || ""}`}
    />
);

export default function EditMerchantPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "merchant",
        active: true,
        phone: "",
        // Store details (if any)
        storeId: "",
        storeName: "",
        storeSlug: "",
        address: {
            line1: "",
            city: "",
            state: "",
            country: "India",
            postalCode: "",
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = await PlatformUsers.get(id);

                // Get store if user is a merchant
                let storeData = null;
                if (user.role === 'merchant') {
                    const storesRes = await PlatformStores.list({
                        filter: JSON.stringify({ ownerId: id })
                    });
                    const stores = storesRes?.items || storesRes?.data || storesRes;
                    storeData = Array.isArray(stores) ? stores[0] : null;
                }

                setForm({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email || "",
                    role: user.role || "merchant",
                    active: (user.status || "active") === "active",
                    phone: user.profile?.phone || user.phone || "",
                    storeId: storeData?._id || "",
                    storeName: storeData?.storeName || "",
                    storeSlug: storeData?.storeSlug || "",
                    address: {
                        line1: storeData?.address?.line1 || "",
                        city: storeData?.address?.city || "",
                        state: storeData?.address?.state || "",
                        country: storeData?.address?.country || "India",
                        postalCode: storeData?.address?.postalCode || "",
                    }
                });
            } catch (err) {
                toast.error("Failed to load merchant data");
                router.push("/admin/users");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update User & Store (Backend now handles store update if storeName is provided)
            await PlatformUsers.update(id, {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                role: form.role,
                status: form.active ? "active" : "suspended",
                phone: form.phone,
                storeName: form.storeName,
                storeSlug: form.storeSlug,
                address: form.address,
            });

            toast.success("Merchant & Store Updated Successfully!");
            router.push("/admin/users");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <AdminGuard>
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </AdminLayout>
        </AdminGuard>
    );

    return (
        <AdminGuard>
            <AdminLayout>
                <div className="max-w-5xl mx-auto space-y-8 pb-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                            >
                                <Icon name="ArrowLeft" size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Merchant</h1>
                                <p className="text-gray-500">Update business profile, store settings, and address</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()} className="px-6 border-gray-300">Cancel</Button>
                            <Button
                                type="submit"
                                form="merchant-edit-form"
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-white px-10 py-2.5 rounded-xl shadow-xl shadow-primary/20 flex items-center gap-2"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={18} />}
                                {saving ? "Saving Changes..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>

                    <form id="merchant-edit-form" onSubmit={handleUpdate} className="space-y-8" autoComplete="off">
                        {/* Section 1: Merchant Account */}
                        <Card>
                            <CardHeader title="Account Details" iconName="User" subtitle="Personal information for the store owner" />
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="First Name" required><Input placeholder="John" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></FormField>
                                <FormField label="Last Name" required><Input placeholder="Doe" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></FormField>
                                <FormField label="Email Address" required><Input type="email" placeholder="merchant@brand.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></FormField>
                                <FormField label="Phone Number"><Input placeholder="+91 00000 00000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></FormField>

                                <div className="md:col-span-1">
                                    <FormField label="Account Role" required>
                                        <select
                                            value={form.role}
                                            onChange={e => setForm({ ...form, role: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm outline-none"
                                        >
                                            <option value="merchant">Merchant</option>
                                            <option value="admin">Admin</option>
                                            <option value="customer">Customer</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                    </FormField>
                                </div>

                                <div className="flex items-center gap-2 pt-8">
                                    <input
                                        type="checkbox"
                                        id="active-status"
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        checked={form.active}
                                        onChange={e => setForm({ ...form, active: e.target.checked })}
                                    />
                                    <label htmlFor="active-status" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Account is Active</label>
                                </div>
                            </div>
                        </Card>

                        {/* Section 2: Store Configuration (Only if merchant) */}
                        {form.role === 'merchant' && (
                            <Card>
                                <CardHeader title="Store Information" iconName="Store" subtitle="Branding and domain settings" />
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="Store Business Name" required><Input placeholder="Elegant Boutique" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} required /></FormField>
                                    <FormField label="Store Slug / URL" required>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs italic">/store/</span>
                                            <Input className="pl-14" placeholder="elegant-boutique" value={form.storeSlug} onChange={e => setForm({ ...form, storeSlug: e.target.value })} required />
                                        </div>
                                    </FormField>
                                </div>
                            </Card>
                        )}

                        {/* Section 3: Business Address (Only if merchant) */}
                        {form.role === 'merchant' && (
                            <Card>
                                <CardHeader title="Business Address" iconName="MapPin" subtitle="Primary base of operations" />
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-3">
                                        <FormField label="Street Address"><Input placeholder="Building, Street, Landmark" value={form.address.line1} onChange={e => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} /></FormField>
                                    </div>
                                    <FormField label="City"><Input placeholder="Mumbai" value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} /></FormField>
                                    <FormField label="State"><Input placeholder="Maharashtra" value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} /></FormField>
                                    <FormField label="Zip Code"><Input placeholder="400001" value={form.address.postalCode} onChange={e => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })} /></FormField>
                                </div>
                            </Card>
                        )}
                    </form>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
