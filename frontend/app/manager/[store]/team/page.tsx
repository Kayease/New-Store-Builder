"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
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
} from "@mui/material";
import { ManagerAPI } from "../../../../lib/manager-api";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "quill/dist/quill.snow.css";
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

export default function Page() {
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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openPicker = () => fileInputRef.current?.click();
  const [skillsInput, setSkillsInput] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Normalize any shape of skills into a clean string array
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
    setSkillsInput("");
    setOpen(true);
  };
  const startEdit = (m: Member) => {
    const skillsArr = normalizeSkills(m.skills);
    setCurrent(m);
    setForm({ ...m, skills: skillsArr });
    setSkillsInput(skillsArr.join(", "));
    setOpen(true);
  };
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res: any = await ManagerAPI.team.list();
      const items = (res?.data?.items || res?.items || []).map((m: any) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        active: Boolean(m.isActive),
        avatar: m.avatarUrl,
        description: m.description,
        skills: normalizeSkills(m.skills),
      }));
      setRows(items);
    } catch (e) {
      console.error("Load team failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      if (current) {
        if (avatarFile) {
          const fd = new FormData();
          fd.append("name", form.name);
          fd.append("email", form.email);
          if (form.role) fd.append("role", form.role);
          if (form.description) fd.append("description", form.description);
          if (form.skills && form.skills.length)
            fd.append("skills", JSON.stringify(form.skills));
          fd.append("avatar", avatarFile);
          await ManagerAPI.team.update(current.id, fd);
        } else {
          const payload: any = { ...form };
          await ManagerAPI.team.update(current.id, payload);
        }
      } else {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("email", form.email);
        if (form.role) fd.append("role", form.role);
        if (form.description) fd.append("description", form.description);
        if (form.skills && form.skills.length)
          fd.append("skills", JSON.stringify(form.skills));
        if (avatarFile) fd.append("avatar", avatarFile);
        await ManagerAPI.team.invite(fd);
      }
      setOpen(false);
      setAvatarFile(null);
      await fetchTeam();
      setSnackbar({ open: true, message: "Member saved", severity: "success" });
    } catch (e) {
      console.error("Save member failed", e);
      setSnackbar({
        open: true,
        message: "Failed to save member",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerLayout title="My Team">
      <div className="space-y-6 max-w-7xl mx-auto">
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent sx={{ paddingRight: 5, paddingLeft: 5 }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <TextField
                placeholder="Search name, email or role..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ width: 360 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">🔎</InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<Icon name="Plus" />}
                onClick={startCreate}
              >
                Add member
              </Button>
            </div>
            {loading && <LinearProgress />}
            {!loading && rows.length === 0 ? (
              <div className="py-24 bg-gray-50 rounded border border-dashed text-center">
                <div className="mb-2 text-5xl">👥</div>
                <Typography variant="h6" gutterBottom>
                  No team members yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Invite your first manager to collaborate on this store.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Icon name="Plus" />}
                  onClick={startCreate}
                >
                  Add member
                </Button>
              </div>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <img
                          src={m.avatar}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>{m.role}</TableCell>
                      <TableCell>
                        {m.active ? (
                          <span className="text-green-500">Active</span>
                        ) : (
                          <span className="text-red-500">Inactive</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => startEdit(m)}>
                            <Icon name="Pencil" className="text-green-500" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Toogle Status">
                          <IconButton
                            onClick={() => {
                              setTogglingId(m.id);
                              (async () => {
                                try {
                                  await ManagerAPI.team.toggle(m.id);
                                  setRows((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? { ...x, active: !x.active }
                                        : x
                                    )
                                  );
                                } catch (e) {
                                  console.error("Toggle member failed", e);
                                  setSnackbar({
                                    open: true,
                                    message: "Failed to toggle",
                                    severity: "error",
                                  });
                                } finally {
                                  setTogglingId(null);
                                }
                              })();
                            }}
                            disabled={togglingId === m.id}
                          >
                            {m.active ? (
                              <Icon name="Pause" className="text-blue-500" />
                            ) : (
                              <Icon name="Play" className="text-green-500" />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => {
                              setConfirmId(m.id);
                              setCurrent(m);
                            }}
                            disabled={deletingId === m.id}
                          >
                            <Icon name="Trash2" className="text-rose-500" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add or edit member dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{current ? "Edit member" : "Add member"}</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-3">
            <TextField
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Role (type to set)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              fullWidth
            />
            <div
              className={`border-2 border-dashed rounded p-4 text-center ${dragOver
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300"
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                const url = URL.createObjectURL(f);
                setAvatarFile(f);
                setForm({ ...form, avatar: url });
              }}
              onClick={() =>
                (
                  document.getElementById(
                    "member-avatar-input"
                  ) as HTMLInputElement
                )?.click()
              }
            >
              <div className="flex flex-col items-center gap-1 select-none">
                <Icon
                  name="UploadCloud"
                  className={dragOver ? "text-primary" : "text-slate-400"}
                />
                <Typography fontWeight={600}>Avatar image</Typography>
                <Typography variant="caption" color="text.secondary">
                  Drag & drop image here, or click to browse
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PNG or JPG, up to 5MB
                </Typography>
              </div>
              {form.avatar && (
                <div className="mt-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.avatar}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover border"
                  />
                </div>
              )}
              <input
                id="member-avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setAvatarFile(f);
                  setForm({ ...form, avatar: URL.createObjectURL(f) });
                }}
              />
            </div>
            <TextField
              label="Short description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Skills (comma separated)"
              value={skillsInput}
              onChange={(e) => {
                setSkillsInput(e.target.value);
                setForm({
                  ...form,
                  skills: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                });
              }}
              fullWidth
            />
            {form.skills && form.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {form.skills.map((s, i) => (
                  <Chip key={i} label={s} />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={16} className="text-blue-500" />
              ) : (
                <Icon name="Save" />
              )
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to remove this member?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setConfirmId(null)}
            disabled={!!deletingId}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() =>
              confirmId &&
              (async () => {
                setDeletingId(confirmId);
                try {
                  await ManagerAPI.team.remove(confirmId);
                  await fetchTeam();
                  setSnackbar({
                    open: true,
                    message: "Member deleted",
                    severity: "success",
                  });
                } catch (e) {
                  console.error("Delete member failed", e);
                  setSnackbar({
                    open: true,
                    message: "Failed to delete",
                    severity: "error",
                  });
                } finally {
                  setDeletingId(null);
                  setConfirmId(null);
                }
              })()
            }
            disabled={!!deletingId}
            startIcon={
              deletingId ? (
                <CircularProgress size={16} className="text-red-500" />
              ) : (
                <Icon name="Trash2" className="text-rose-500" />
              )
            }
          >
            {deletingId ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar  */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({ open: false, message: "", severity: "success" })
        }
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ManagerLayout>
  );
}
