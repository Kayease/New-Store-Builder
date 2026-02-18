// @ts-nocheck
"use client";
import React, { useState } from "react";
import AdminLayout from "../../../../components/admin/AdminLayout";
import AdminGuard from "../../../../components/AdminGuard";
import Icon from "../../../../components/AppIcon";
import Button from "../../../../components/ui/Button";
import { PlatformUsers } from "../../../../lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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

export default function NewMerchantPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        active: true,
        password: "",
        phone: "",
        storeName: "",
        storeSlug: "",
        address: {
            line1: "",
            city: "",
            state: "",
            country: "India",
            postalCode: "",
        },
        productName: "",
        productPrice: "",
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await PlatformUsers.create({
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                password: form.password,
                role: "merchant",
                status: form.active ? "active" : "pending",
                phone: form.phone,
                address: form.address,
                storeName: form.storeName,
                storeSlug: form.storeSlug,
            });
            toast.success("Merchant Account & Store Created!");
            router.push("/admin/users");
        } catch (e: any) {
            console.error("Creation Error:", e);
            toast.error(e?.response?.data?.detail || e?.response?.data?.message || "Creation failed");
        } finally {
            setLoading(false);
        }
    };

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
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Add New Merchant</h1>
                                <p className="text-gray-500">Setup business profile, store domain, and physical presence</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()} className="px-6 border-gray-300">Cancel</Button>
                            <Button
                                type="submit"
                                form="merchant-create-form"
                                disabled={loading}
                                className="bg-primary hover:bg-primary/90 text-white px-10 py-2.5 rounded-xl shadow-xl shadow-primary/20 flex items-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="CheckCircle" size={18} />}
                                {loading ? "Processing..." : "Create Merchant"}
                            </Button>
                        </div>
                    </div>

                    <form id="merchant-create-form" onSubmit={handleCreate} className="space-y-8" autoComplete="off">
                        {/* Hidden dummy fields to capture browser autofill */}
                        <input type="text" name="email" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                        <input type="password" name="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                        {/* Section 1: Merchant Account */}
                        <Card>
                            <CardHeader title="Account Details" iconName="User" subtitle="Personal information for the store owner" />
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="First Name" required><Input placeholder="John" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></FormField>
                                <FormField label="Last Name" required><Input placeholder="Doe" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></FormField>
                                <FormField label="Email Address" required><Input type="email" autoComplete="new-email" placeholder="merchant@brand.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></FormField>
                                <FormField label="Phone Number"><Input placeholder="+91 00000 00000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></FormField>
                                <div className="md:col-span-2">
                                    <FormField label="Access Password" required><Input type="password" autoComplete="new-password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></FormField>
                                </div>
                            </div>
                        </Card>

                        {/* Section 2: Store Configuration */}
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

                        {/* Section 3: Business Address */}
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

                        {/* Section 4: Initial Product Inventory */}
                        <Card className="border-primary/20 bg-primary/[0.01]">
                            <CardHeader title="Initial Inventory" iconName="Package" subtitle="Quick-start with a featured product" />
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Product Name"><Input placeholder="e.g. Silk Saree" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} /></FormField>
                                <FormField label="Base Listing Price (₹)"><Input placeholder="0.00" type="number" value={form.productPrice} onChange={e => setForm({ ...form, productPrice: e.target.value })} /></FormField>
                            </div>
                        </Card>
                    </form>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
