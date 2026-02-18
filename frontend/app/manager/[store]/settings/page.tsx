"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import { Store as StoreAPI } from "../../../../lib/api";
import {
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    InputAdornment,
    Divider,
    Alert
} from "@mui/material";
import { toast } from "react-toastify";
import Icon from "../../../../components/AppIcon";
import Loader from "../../../../components/Loader";

export default function GeneralSettings() {
    const params = useParams();
    const storeSlug = params?.store as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [storeName, setStoreName] = useState("");
    const [tagline, setTagline] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [taxId, setTaxId] = useState("");

    useEffect(() => {
        loadData();
    }, [storeSlug]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await StoreAPI.getBySlug(storeSlug);
            if (res.success && res.data) {
                const s = res.data;
                setStoreName(s.name || "");
                setTagline(s.tagline || "");
                setDescription(s.description || "");
                setEmail(s.email || "");
                setPhone(s.phone || "");
                setBusinessName(s.businessName || "");
                setTaxId(s.taxId || "");
            }
        } catch (err) {
            console.error("Failed to load store settings", err);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Prepare payload
            const payload = {
                storeName,
                tagline,
                description,
                email,
                phone,
                businessName,
                taxId
            };

            const res = await StoreAPI.update(storeSlug, payload);
            if (res.success) {
                toast.success("Store settings updated!");
                // Optionally reload to confirm (though state is already updated)
            } else {
                throw new Error("Update failed");
            }

        } catch (err) {
            console.error("Failed to save", err);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <ManagerLayout title="Store Settings">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Typography variant="h5" fontWeight={700}>General Settings</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage your store details and contact information.
                        </Typography>
                    </div>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={saving ? <Icon name="Loader2" className="animate-spin" /> : <Icon name="Save" />}
                        disabled={saving}
                        onClick={handleSave}
                        sx={{ borderRadius: 2, px: 4, fontWeight: "bold" }}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                <Alert severity="info" icon={<Icon name="Info" size={20} />}>
                    Tip: The <strong>Store Name</strong>, <strong>Tagline</strong>, and <strong>Description</strong> are automatically used by your active theme!
                </Alert>

                {/* Store Identity */}
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                            Store Identity
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Store Name"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    helperText="Visible on your storefront header and invoices."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Store Tagline"
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    helperText="A short phrase describing your brand (e.g. 'Quality Tech for Less')"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Store Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    helperText="Used for SEO and often displayed in the footer or about section."
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                            Contact Details
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Customer Support Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Icon name="Mail" size={18} /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Support Phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Icon name="Phone" size={18} /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Business Details */}
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                            Business Information
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Legal Business Name"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    helperText="The registered name of your company."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Tax ID / GSTIN"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

            </div>
        </ManagerLayout>
    );
}
