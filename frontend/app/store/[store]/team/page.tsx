"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStoreCtx } from "../../../../contexts/StoreContext";
import {
    Card,
    CardContent,
    Typography,
    TextField,
    InputAdornment,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Switch,
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
    Tooltip,
    Avatar,
    Box,
    Paper,
} from "@mui/material";
import { MerchantAPI } from "../../../../lib/merchant-api";
import { useParams } from "next/navigation";
import Icon from "../../../../components/AppIcon";

type Member = {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    avatar?: string;
    description?: string;
    skills?: string[];
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
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });
    const [invitedMember, setInvitedMember] = useState<{ email: string, password?: string } | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((r) =>
            [r.name, r.email, r.role].join(" ").toLowerCase().includes(q)
        );
    }, [rows, query]);

    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<Member | null>(null);
    const [form, setForm] = useState<Member>({
        id: "",
        name: "",
        email: "",
        role: "Manager",
        active: true,
        avatar: "",
        description: "",
        skills: [],
    });

    const normalizeSkills = (val: any): string[] => {
        try {
            if (!val) return [];
            if (Array.isArray(val))
                return val.map((s) => String(s).trim()).filter(Boolean);
            if (typeof val === "string") {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed))
                        return parsed.map((s) => String(s).trim()).filter(Boolean);
                } catch { }
                return val
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
            return [];
        } catch {
            return [];
        }
    };

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const res: any = await MerchantAPI.team.list();
            const items = (res?.data?.items || res?.items || res?.data || []).map((m: any) => ({
                id: m._id || m.id,
                name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Unknown',
                email: m.email,
                role: m.role || 'Member',
                active: Boolean(m.isActive !== undefined ? m.isActive : true),
                avatar: m.avatarUrl || m.avatar || "",
                description: m.description || "",
                skills: normalizeSkills(m.skills),
            }));
            setRows(items);
        } catch (e) {
            console.error("Load team failed", e);
            setSnackbar({ open: true, message: "Failed to load team members", severity: "error" });
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
            id: "",
            name: "",
            email: "",
            role: "Manager",
            active: true,
            avatar: "",
            description: "",
            skills: [],
        });
        setOpen(true);
    };

    const startEdit = (m: Member) => {
        const skillsArr = normalizeSkills(m.skills);
        setCurrent(m);
        setForm({ ...m, skills: skillsArr });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.email) {
            setSnackbar({ open: true, message: "Name and Email are required", severity: "error" });
            return;
        }

        try {
            setSaving(true);
            if (current) {
                const res: any = await MerchantAPI.team.update(current.id, form);
                if (res.success) {
                    setSnackbar({ open: true, message: "Member updated successfully", severity: "success" });
                }
            } else {
                const res: any = await MerchantAPI.team.invite(form);
                if (res.success) {
                    setSnackbar({ open: true, message: "Invitation sent successfully", severity: "success" });
                    if (res.data?.temporary_password) {
                        setInvitedMember({ email: res.data.email, password: res.data.temporary_password });
                    }
                }
            }
            setOpen(false);
            await fetchTeam();
        } catch (e: any) {
            setSnackbar({
                open: true,
                message: e?.response?.data?.message || "Failed to save team member",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmId) return;
        try {
            setDeletingId(confirmId);
            await MerchantAPI.team.remove(confirmId);
            setSnackbar({ open: true, message: "Member removed from team", severity: "success" });
            await fetchTeam();
            setConfirmId(null);
        } catch (e) {
            setSnackbar({ open: true, message: "Failed to remove member", severity: "error" });
        } finally {
            setDeletingId(null);
        }
    };

    const [confirmId, setConfirmId] = useState<string | null>(null);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-24 translate-x-24 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center text-white shadow-xl shadow-indigo-900/20">
                            <Icon name="Users" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff & Permissions</h1>
                            <p className="text-slate-500 font-medium">Manage your store collaborators and their access levels.</p>
                        </div>
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
                            fontWeight: 700,
                            fontSize: '0.95rem'
                        }}
                    >
                        Invite Team Member
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 6, bgcolor: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div className="relative z-10">
                        <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ letterSpacing: '0.1em' }}>Total Members</Typography>
                        <Typography variant="h2" fontWeight={900} sx={{ mt: 1, color: '#1e293b' }}>{rows.length}</Typography>
                    </div>
                    <Icon name="Users" size={80} className="absolute -right-4 -bottom-4 text-slate-50 opacity-50" />
                </Paper>
                <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 6, bgcolor: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div className="relative z-10">
                        <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ letterSpacing: '0.1em' }}>Active Accounts</Typography>
                        <Typography variant="h2" fontWeight={900} sx={{ mt: 1, color: '#10b981' }}>{rows.filter(r => r.active).length}</Typography>
                    </div>
                    <Icon name="CheckCircle" size={80} className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50" />
                </Paper>
                <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 6, bgcolor: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div className="relative z-10">
                        <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ letterSpacing: '0.1em' }}>Roles Defined</Typography>
                        <Typography variant="h2" fontWeight={900} sx={{ mt: 1, color: '#6366f1' }}>{new Set(rows.map(r => r.role)).size}</Typography>
                    </div>
                    <Icon name="Shield" size={80} className="absolute -right-4 -bottom-4 text-indigo-50 opacity-50" />
                </Paper>
            </div>

            {/* Table Card */}
            <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 6, overflow: 'hidden', bgcolor: 'white' }}>
                <Box p={4} borderBottom="1px solid #f1f5f9" display="flex" justifyContent="space-between" alignItems="center" gap={4}>
                    <TextField
                        placeholder="Search team members..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="medium"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: '#f8fafc',
                                '& fieldset': { border: 'none' },
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon name="Search" size={18} className="text-slate-400" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <CardContent sx={{ p: 0 }}>
                    {loading && <LinearProgress color="primary" />}
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 3 }}>Member</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', pr: 4 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 12 }}>
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Icon name="Users" size={32} className="text-slate-200" />
                                        </div>
                                        <Typography variant="h6" fontWeight={700} color="text.secondary">No team members found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((m) => (
                                    <TableRow key={m.id} hover sx={{ '&:hover': { bgcolor: '#f1f5f9/50' } }}>
                                        <TableCell sx={{ py: 3 }}>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar
                                                    src={m.avatar}
                                                    sx={{ width: 44, height: 44, border: '2px solid #fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                                >
                                                    {m.name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography fontWeight={700} color="#1e293b">{m.name}</Typography>
                                                    {m.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{m.description}</Typography>}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500} color="#64748b">{m.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={m.role}
                                                size="small"
                                                sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${m.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                <Typography variant="body2" fontWeight={700} color={m.active ? '#059669' : '#64748b'}>
                                                    {m.active ? 'Active' : 'Inactive'}
                                                </Typography>
                                            </div>
                                        </TableCell>
                                        <TableCell align="right" sx={{ pr: 4 }}>
                                            <Box display="flex" justifyContent="flex-end" gap={1}>
                                                <IconButton size="small" onClick={() => startEdit(m)} sx={{ color: '#6366f1', bgcolor: '#f5f3ff', '&:hover': { bgcolor: '#ede9fe' } }}>
                                                    <Icon name="Pencil" size={16} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => setConfirmId(m.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                    <Icon name="Trash2" size={16} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialogs and Snackbars remain mostly the same but with style tweaks */}
            <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 6, p: 2 } }}>
                <DialogTitle>
                    <Typography variant="h5" fontWeight={900}>{current ? "Edit permissions" : "Invite Staff Member"}</Typography>
                </DialogTitle>
                <DialogContent>
                    <div className="space-y-6 pt-4">
                        <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                        <TextField label="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth disabled={!!current} />
                        <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth SelectProps={{ native: true }}>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Editor">Editor</option>
                            <option value="Support">Support</option>
                        </TextField>
                    </div>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 3, px: 4, bgcolor: '#6366f1' }}>
                        {saving ? <CircularProgress size={20} color="inherit" /> : (current ? "Update" : "Send Invite")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!confirmId} onClose={() => setConfirmId(null)} PaperProps={{ sx: { borderRadius: 6 } }}>
                <DialogTitle sx={{ textAlign: 'center', pt: 6 }}>
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Trash2" className="text-red-500" size={32} />
                    </div>
                    <Typography variant="h5" fontWeight={900}>Remove Team Member?</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
                    <Typography color="text.secondary">Their access will be immediately revoked.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
                    <Button fullWidth variant="outlined" onClick={() => setConfirmId(null)} sx={{ borderRadius: 3 }}>Cancel</Button>
                    <Button fullWidth variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: 3, bgcolor: '#ef4444' }}>Remove</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 3 }}>{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
}
