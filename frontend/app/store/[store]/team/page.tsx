"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useStoreCtx } from "../../../../contexts/StoreContext";
import {
    Card,
    CardContent,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    Snackbar,
    Alert,
    LinearProgress,
    CircularProgress,
    Avatar,
    Box,
    Paper,
    Grid,
    MenuItem,
    Divider
} from "@mui/material";
import { MerchantAPI } from "../../../../lib/merchant-api";
import { useParams } from "next/navigation";
import Icon from "../../../../components/AppIcon";

// Updated Member Type
type Member = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    avatar?: string;

    // Sensitive / KYB
    aadhar_no?: string;
    pan_no?: string;
    address?: string;
    pin_code?: string;
};

export default function TeamPage() {
    const params = useParams();
    const storeSlug = params.store as string;
    const { setPageTitle } = useStoreCtx();

    useEffect(() => {
        setPageTitle("Team & Permissions");
    }, [setPageTitle]);

    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((r) =>
            [r.first_name, r.last_name, r.email, r.role].join(" ").toLowerCase().includes(q)
        );
    }, [rows, query]);

    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<Member | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    // Enhanced Form State
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "", // Only for creation
        phone: "",
        role: "manager",
        status: "active",
        aadhar_no: "",
        pan_no: "",
        address: "",
        pin_code: "",
    });

    const [showPassword, setShowPassword] = useState(false);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const res: any = await MerchantAPI.team.list(storeSlug); // We need to update API lib
            const items = (res?.data?.items || res?.items || []).map((m: any) => ({
                id: m.id,
                first_name: m.first_name || m.firstName,
                last_name: m.last_name || m.lastName,
                email: m.email,
                phone: m.phone,
                role: m.role || 'manager',
                status: m.status || 'active',
                avatar: m.avatar_url || m.avatar,
                aadhar_no: m.aadhar_no,
                pan_no: m.pan_no,
                address: m.address,
                pin_code: m.pin_code
            }));
            setRows(items);
        } catch (e) {
            console.error("Load team failed", e);
            // Ignore error for now until API is consistent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (storeSlug) fetchTeam();
    }, [storeSlug]);

    const startCreate = () => {
        setCurrent(null);
        setForm({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            phone: "",
            role: "manager",
            status: "active",
            aadhar_no: "",
            pan_no: "",
            address: "",
            pin_code: "",
        });
        setOpen(true);
    };

    const startEdit = (m: Member) => {
        setCurrent(m);
        setForm({
            ...m,
            // @ts-ignore
            password: "", // Don't show password
            phone: m.phone || "",
            aadhar_no: m.aadhar_no || "",
            pan_no: m.pan_no || "",
            address: m.address || "",
            pin_code: m.pin_code || ""
        });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.first_name || !form.email || (!current && !form.password)) {
            setSnackbar({ open: true, message: "Name, Email, and Password are required", severity: "error" });
            return;
        }

        try {
            setSaving(true);
            if (current) {
                // Update
                const payload = { ...form };
                delete (payload as any).password; // Don't send empty password on edit
                await MerchantAPI.team.update(current.id, payload);
                setSnackbar({ open: true, message: "Member updated successfully", severity: "success" });
            } else {
                // Create
                await MerchantAPI.team.create({ ...form, store_slug: storeSlug });
                setSnackbar({ open: true, message: "Member invited successfully", severity: "success" });
            }
            setOpen(false);
            await fetchTeam();
        } catch (e: any) {
            setSnackbar({
                open: true,
                message: e?.response?.data?.detail || "Failed to save team member",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmId) return;
        try {
            await MerchantAPI.team.remove(confirmId);
            setSnackbar({ open: true, message: "Member removed", severity: "success" });
            await fetchTeam();
        } catch (e: any) {
            setSnackbar({ open: true, message: "Failed to remove member", severity: "error" });
        } finally {
            setConfirmId(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff & Permissions</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage store managers and their access levels.</p>
                </div>
                <Button
                    variant="contained"
                    startIcon={<Icon name="Plus" />}
                    onClick={startCreate}
                    sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        bgcolor: '#6366f1',
                        '&:hover': { bgcolor: '#4f46e5' },
                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
                        textTransform: 'none',
                        fontWeight: 700
                    }}
                >
                    Add Team Member
                </Button>
            </div>

            {/* Search Bar */}
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 4 }}>
                <TextField
                    placeholder="Search by name, email, or role..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    fullWidth
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                            <InputAdornment position="start">
                                <Icon name="Search" size={20} className="text-slate-400" />
                            </InputAdornment>
                        ),
                        sx: { fontSize: '1.1rem' }
                    }}
                />
            </Paper>

            {loading && <LinearProgress sx={{ borderRadius: 2 }} />}

            {/* Manager Cards Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((m) => (
                        <Card key={m.id} elevation={0} sx={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)' }
                        }}>
                            <CardContent className="space-y-4 p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={m.avatar}
                                            sx={{ width: 56, height: 56, bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 800 }}
                                        >
                                            {m.first_name[0]}{m.last_name[0]}
                                        </Avatar>
                                        <div>
                                            <Typography variant="h6" fontWeight={700} color="#1e293b">
                                                {m.first_name} {m.last_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {m.role}
                                            </Typography>
                                        </div>
                                    </div>
                                    <Chip
                                        label={m.status}
                                        size="small"
                                        color={m.status === 'active' ? 'success' : 'default'}
                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                    />
                                </div>

                                <Divider />

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Icon name="Mail" size={16} className="text-slate-400" />
                                        {m.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Icon name="Phone" size={16} className="text-slate-400" />
                                        {m.phone || "N/A"}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Icon name="MapPin" size={16} className="text-slate-400" />
                                        {m.address ? (m.address.length > 30 ? m.address.substring(0, 30) + '...' : m.address) : "No Address"}
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        onClick={() => startEdit(m)}
                                        sx={{ borderRadius: 3, textTransform: 'none', borderColor: '#e2e8f0', color: '#475569' }}
                                    >
                                        View / Edit
                                    </Button>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => setConfirmId(m.id)}
                                        sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                    >
                                        <Icon name="Trash2" size={18} />
                                    </IconButton>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Paper elevation={0} sx={{
                    p: 8,
                    textAlign: 'center',
                    border: "2px dashed #e2e8f0",
                    borderRadius: 8,
                    bgcolor: '#f8fafc'
                }}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                            <Icon name="Users" size={48} className="text-slate-300" />
                        </div>
                        <div>
                            <Typography variant="h6" fontWeight={700} color="text.primary">No team members yet</Typography>
                            <Typography variant="body2" color="text.secondary">Add your first team member to start collaborating.</Typography>
                        </div>
                        <Button
                            variant="outlined"
                            onClick={startCreate}
                            sx={{ mt: 2, borderRadius: 3, textTransform: 'none', px: 4 }}
                        >
                            Get Started
                        </Button>
                    </div>
                </Paper>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 6 } }}>
                <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                    <Typography variant="h5" fontWeight={800}>{current ? "Edit Manager" : "Add New Manager"}</Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <Typography variant="overline" color="primary" fontWeight={800}>Personal Details</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="First Name" fullWidth value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Last Name" fullWidth value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Email" fullWidth type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={!!current} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Phone" fullWidth value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </Grid>

                        {!current && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    fullWidth
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} md={6}>
                            <TextField select label="Role" fullWidth value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <MenuItem value="admin">Administrator</MenuItem>
                                <MenuItem value="manager">Manager</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="overline" color="primary" fontWeight={800}>KYB / Identification</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Aadhar Number" fullWidth value={form.aadhar_no} onChange={e => setForm({ ...form, aadhar_no: e.target.value })} placeholder="XXXX-XXXX-XXXX" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="PAN Number" fullWidth value={form.pan_no} onChange={e => setForm({ ...form, pan_no: e.target.value })} placeholder="ABCDE1234F" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Residential Address" fullWidth multiline rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Pin Code" fullWidth value={form.pin_code} onChange={e => setForm({ ...form, pin_code: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Status" fullWidth value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 0, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 3, px: 5, bgcolor: '#6366f1' }}>
                        {saving ? "Saving..." : (current ? "Update Manager" : "Create Manager")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!confirmId} onClose={() => setConfirmId(null)} PaperProps={{ sx: { borderRadius: 6, width: 400 } }}>
                <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                    <Typography variant="h6" fontWeight={800}>Confirm Removal</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography color="text.secondary">Are you sure you want to remove this manager?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
                    <Button variant="outlined" onClick={() => setConfirmId(null)} sx={{ borderRadius: 3 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: 3, ml: 2 }}>Remove</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 3 }}>{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
}
