"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Snackbar,
  Alert,
  Tooltip,
  Box,
  CircularProgress,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "quill/dist/quill.snow.css";

type Blog = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  coverImagePublicId?: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  authorName: string;
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  enableComments: boolean;
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  metaTags: string[];
  viewCount: number;
  readTime: number;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    [{ align: [] }],
    ["clean"],
  ],
};

export default function Page() {
  // State management
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [tab, setTab] = useState<"all" | "published" | "draft" | "archived">(
    "all"
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Dialog states
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    blog: Blog | null;
  }>({
    open: false,
    blog: null,
  });

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft"
  );
  const [enableComments, setEnableComments] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [metaTags, setMetaTags] = useState("");

  // UI states
  const [dragOver, setDragOver] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Helper to strip HTML tags for content validation
  const stripHtmlTags = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  // Generate unique slug with random suffix
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    try {
      // First try the base slug
      const response = (await ManagerAPI.blogs.getBySlug(
        baseSlug
      )) as ApiResponse<Blog>;
      if (!response.success) {
        return baseSlug; // Slug is available
      }
    } catch (error) {
      // If error (404), slug is available
      return baseSlug;
    }

    // If slug exists, add random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    return `${baseSlug}-${randomSuffix}`;
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load blogs on component mount and when filters change
  useEffect(() => {
    loadBlogs();
  }, [tab, debouncedQuery]);

  // Auto-generate slug when title changes
  useEffect(() => {
    if (title && !editing) {
      const generatedSlug = generateSlug(title);
      setSlug(generatedSlug);
    }
  }, [title, editing]);

  const loadBlogs = async () => {
    try {
      setLoading(true);

      const filterParams: any = {};

      // Add search filter
      if (debouncedQuery.trim()) {
        filterParams.search = debouncedQuery.trim();
      }

      // Add status filter
      if (tab !== "all") {
        filterParams.status = tab;
      }

      const response = (await ManagerAPI.blogs.list(
        filterParams
      )) as ApiResponse<Blog>;

      if (response.success) {
        setBlogs(response.items || []);
      } else {
        showSnackbar(response.message || "Failed to load blogs", "error");
      }
    } catch (error: any) {
      console.error("Failed to load blogs:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load blogs";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };


  const filtered = useMemo(() => {
    return blogs;
  }, [blogs]);

  const counts = useMemo(() => {
    return blogs.reduce(
      (acc, blog) => {
        acc.all += 1;
        acc[blog.status] += 1;
        return acc;
      },
      { all: 0, published: 0, draft: 0, archived: 0 }
    );
  }, [blogs]);

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImageUrl("");
    setCoverImageFile(null);
    setCoverImagePreview("");
    setStatus("draft");
    setEnableComments(true);
    setFeatured(false);
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
    setMetaTags("");
    setDragOver(false);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (blog: Blog) => {
    setEditing(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setExcerpt(blog.excerpt || "");
    setContent(blog.content);
    setCoverImageUrl(blog.coverImage || "");
    setCoverImageFile(null);
    setCoverImagePreview(blog.coverImage || "");
    setStatus(blog.status);
    setEnableComments(blog.enableComments);
    setFeatured(blog.featured);
    setMetaTitle(blog.metaTitle || "");
    setMetaDescription(blog.metaDescription || "");
    setMetaKeywords((blog.metaKeywords || []).join(", "));
    setMetaTags((blog.metaTags || []).join(", "));
    setOpen(true);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showSnackbar("Please select an image file", "error");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showSnackbar("File size must be less than 10MB", "error");
      return;
    }

    setCoverImageFile(file);
    setCoverImageUrl(""); // Clear URL when file is selected
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const onPick = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragOver = (e: React.DragEvent) => {
    prevent(e);
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    prevent(e);
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    prevent(e);
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const save = async () => {
    // Check if title is provided and not just whitespace
    const hasTitle = title && title.trim().length > 0;

    // Check if content is provided and has actual text content
    const hasContent =
      content &&
      content.trim().length > 0 &&
      stripHtmlTags(content).trim().length > 0;

    if (!hasTitle) {
      showSnackbar("Title is required", "error");
      return;
    }

    if (!hasContent) {
      showSnackbar("Content is required and must contain actual text", "error");
      return;
    }

    try {
      setSaving(true);

      // Generate unique slug
      const finalSlug = await generateUniqueSlug(slug || generateSlug(title));

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("slug", finalSlug);
      formData.append("excerpt", excerpt.trim());
      formData.append("content", content);
      formData.append("status", status);
      formData.append("enableComments", enableComments.toString());
      formData.append("featured", featured.toString());
      formData.append("metaTitle", metaTitle.trim());
      formData.append("metaDescription", metaDescription.trim());
      formData.append("metaKeywords", metaKeywords);
      formData.append("metaTags", metaTags);

      // Add cover image
      if (coverImageFile) {
        formData.append("coverImage", coverImageFile);
      } else if (coverImageUrl) {
        formData.append("coverImageUrl", coverImageUrl);
      }

      let response: ApiResponse<Blog>;
      if (editing) {
        response = (await ManagerAPI.blogs.update(
          editing._id,
          formData
        )) as ApiResponse<Blog>;
      } else {
        response = (await ManagerAPI.blogs.create(
          formData
        )) as ApiResponse<Blog>;
      }

      if (response.success) {
        showSnackbar(
          editing ? "Blog updated successfully" : "Blog created successfully",
          "success"
        );
        setOpen(false);
        resetForm();
        loadBlogs();
      } else {
        showSnackbar(response.message || "Failed to save blog", "error");
      }
    } catch (error: any) {
      console.error("Failed to save blog:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to save blog";
      showSnackbar(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (blog: Blog) => {
    setDeleteDialog({
      open: true,
      blog: blog,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.blog) return;

    try {
      setLoading(true);
      const response = (await ManagerAPI.blogs.delete(
        deleteDialog.blog._id
      )) as ApiResponse;

      if (response.success) {
        showSnackbar("Blog deleted successfully", "success");
        loadBlogs();
        setDeleteDialog({ open: false, blog: null });
      } else {
        showSnackbar(response.message || "Failed to delete blog", "error");
      }
    } catch (error: any) {
      console.error("Failed to delete blog:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete blog";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, blog: null });
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setLoading(true);
      const response = (await ManagerAPI.blogs.toggleStatus(id)) as ApiResponse;

      if (response.success) {
        showSnackbar("Blog status updated successfully", "success");
        loadBlogs();
      } else {
        showSnackbar(
          response.message || "Failed to update blog status",
          "error"
        );
      }
    } catch (error: any) {
      console.error("Failed to toggle blog status:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update blog status";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for React Quill
  const customStyles = `
    .ql-toolbar { border: none !important; background-color: rgb(249 250 251) !important; border-bottom: 1px solid #e5e7eb !important; border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem; padding: 0.5rem !important; display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .ql-toolbar button { padding: 0.5rem !important; height: 32px !important; width: 32px !important; border-radius: 0.5rem; }
    .ql-toolbar button svg { width: 20px !important; height: 20px !important; }
    .ql-toolbar .ql-picker { height: 32px !important; }
    .ql-toolbar .ql-picker-label { padding: 0.5rem !important; border-radius: 0.5rem; }
    .ql-toolbar button:hover { background-color: rgb(229 231 235) !important; }
    .ql-formats { display: flex !important; gap: 0.25rem; align-items: center; }
    .ql-container { border: none !important; font-size: 1.125rem !important; }
    .ql-editor { padding: 1rem !important; min-height: 300px !important; font-size: 16px; line-height: 1.6; color: #374151; }
    .ql-editor p { margin-bottom: 1rem; }
    .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 { margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 600; color: #111827; }
    .ql-editor h1 { font-size: 2rem; }
    .ql-editor h2 { font-size: 1.75rem; }
    .ql-editor h3 { font-size: 1.5rem; }
    .ql-editor h4 { font-size: 1.25rem; }
    .ql-editor h5 { font-size: 1.125rem; }
    .ql-editor h6 { font-size: 1rem; }
    .ql-editor blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #6b7280; }
    .ql-editor code { background-color: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-family: 'Courier New', monospace; font-size: 0.875rem; }
    .ql-editor pre { background-color: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
    .ql-editor pre code { background-color: transparent; color: inherit; padding: 0; }
    .ql-editor ul, .ql-editor ol { padding-left: 1.5rem; margin: 1rem 0; }
    .ql-editor li { margin-bottom: 0.5rem; }
    .ql-editor img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
    .ql-editor a { color: #3b82f6; text-decoration: underline; }
    .ql-editor a:hover { color: #2563eb; }
    .ql-editor.ql-blank::before { color: #9ca3af; font-style: italic; }
    @media (min-width: 768px) { .ql-editor { min-height: 400px !important; } }
  `;

  useEffect(() => {
    const el = document.createElement("style");
    el.innerHTML = customStyles;
    document.head.appendChild(el);
    return () => {
      try {
        document.head.removeChild(el);
      } catch { }
    };
  }, []);

  return (
    <ManagerLayout title="Blog Management">
      <div className="max-w-[1400px] mx-auto">
        {/* Header with tabs and search */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab
                value="all"
                label={
                  <div className="flex items-center gap-2">
                    <span>All</span>
                    <Chip size="small" label={counts.all} />
                  </div>
                }
              />
              <Tab
                value="published"
                label={
                  <div className="flex items-center gap-2">
                    <span>Published</span>
                    <Chip
                      color="success"
                      size="small"
                      label={counts.published}
                    />
                  </div>
                }
              />
              <Tab
                value="draft"
                label={
                  <div className="flex items-center gap-2">
                    <span>Draft</span>
                    <Chip color="warning" size="small" label={counts.draft} />
                  </div>
                }
              />
              <Tab
                value="archived"
                label={
                  <div className="flex items-center gap-2">
                    <span>Archived</span>
                    <Chip
                      color="default"
                      size="small"
                      label={counts.archived}
                    />
                  </div>
                }
              />
            </Tabs>
            <TextField
              placeholder="Search blogs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ width: 320 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="Search" size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <Button
            variant="contained"
            startIcon={<Icon name="Plus" />}
            onClick={openCreate}
            disabled={loading}
          >
            Add Blog
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <Card
            elevation={0}
            sx={{ border: "1px dashed #cbd5e1", borderRadius: 2 }}
          >
            <CardContent className="text-center py-16">
              <Icon
                name="FileText"
                size={48}
                className="text-gray-400 mx-auto mb-4"
              />
              <Typography variant="h6" gutterBottom>
                No blogs yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Create your first blog post to get started.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Icon name="Plus" />}
                onClick={openCreate}
              >
                Add Blog
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Blog grid */}
        {!loading && filtered.length > 0 && (
          <Grid container spacing={3}>
            {filtered.map((blog) => (
              <Grid item xs={12} md={6} key={blog._id}>
                <Card
                  elevation={0}
                  sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
                >
                  <CardContent sx={{ display: "flex", gap: 2 }}>
                    <div className="w-40 h-28 rounded overflow-hidden bg-gray-100 border">
                      {blog.coverImage ? (
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Icon name="Image" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <Typography fontWeight={700} noWrap>
                          {blog.title}
                        </Typography>
                        <div className="flex items-center gap-1">
                          {blog.featured && (
                            <Chip
                              size="small"
                              label="Featured"
                              color="primary"
                            />
                          )}
                          <Chip
                            size="small"
                            color={
                              blog.status === "published"
                                ? "success"
                                : blog.status === "draft"
                                  ? "warning"
                                  : "default"
                            }
                            label={blog.status}
                          />
                        </div>
                      </div>
                      <Typography
                        color="text.secondary"
                        noWrap
                        className="mb-2"
                      >
                        {blog.excerpt || "No excerpt"}
                      </Typography>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>{blog.readTime} min read</span>
                          <span>{blog.viewCount} views</span>
                          <span>
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip title="Toggle Status">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(blog._id)}
                              disabled={loading}
                            >
                              <Icon
                                name={
                                  blog.status === "published" ? "Pause" : "Play"
                                }
                                size={16}
                                className="text-blue-500 hover:text-blue-600"
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(blog)}
                              disabled={loading}
                            >
                              <Icon
                                name="Pencil"
                                size={16}
                                className="text-green-500 hover:text-green-600"
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(blog)}
                              disabled={loading}
                            >
                              <Icon
                                name="Trash2"
                                size={16}
                                className="text-red-500 hover:text-red-600"
                              />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editing ? "Edit Blog" : "Create New Blog"}</DialogTitle>
        <DialogContent
          dividers
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Blog Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            fullWidth
            placeholder="Auto-generated from title"
            helperText="This will be the URL for your blog post (e.g., /blog/my-awesome-post)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="body2" color="text.secondary">
                    /blog/
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          <div>
            <Typography
              variant="caption"
              color="text.secondary"
              className="mb-1 block"
            >
              Content
            </Typography>
            <div className="border rounded mt-1">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                placeholder="Start writing your blog post..."
              />
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <Typography
              variant="caption"
              color="text.secondary"
              className="mb-1 block"
            >
              Cover Image
            </Typography>
            <div
              className={`mt-1 border-2 border-dashed rounded p-4 text-center ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div
                className="flex flex-col items-center gap-2"
                onClick={onPick}
              >
                <Icon name="UploadCloud" className="text-gray-600" size={24} />
                <Typography fontWeight={600}>
                  Drop or select an image
                </Typography>
                <Typography color="text.secondary">
                  Drag a file here, or click to browse your device.
                </Typography>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                {(coverImagePreview || coverImageUrl) && (
                  <div className="mt-3 w-full flex items-center justify-center">
                    <div className="w-72 h-36 rounded overflow-hidden border">
                      <img
                        src={coverImagePreview || coverImageUrl}
                        alt="cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2">
              <TextField
                label="Or enter image URL"
                value={coverImageUrl}
                onChange={(e) => {
                  setCoverImageUrl(e.target.value);
                  setCoverImageFile(null);
                  setCoverImagePreview("");
                }}
                fullWidth
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={status === "published"}
                onChange={(e) =>
                  setStatus(e.target.checked ? "published" : "draft")
                }
              />
              <Typography>Publish immediately</Typography>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={enableComments}
                onChange={(e) => setEnableComments(e.target.checked)}
              />
              <Typography>Enable comments</Typography>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <Typography>Featured post</Typography>
            </div>
          </div>

          {/* SEO Section */}
          <Typography variant="h6" sx={{ mt: 2 }}>
            SEO Settings
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label="Meta Title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              fullWidth
              placeholder="SEO title for search engines"
            />
            <TextField
              label="Meta Keywords (comma separated)"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              fullWidth
              placeholder="keyword1, keyword2, keyword3"
            />
            <TextField
              label="Meta Tags (comma separated)"
              value={metaTags}
              onChange={(e) => setMetaTags(e.target.value)}
              fullWidth
              placeholder="tag1, tag2, tag3"
            />
            <TextField
              label="Meta Description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Brief description for search engines"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={!title.trim() || !stripHtmlTags(content).trim() || saving}
            startIcon={
              saving ? <CircularProgress size={16} /> : <Icon name="Save" />
            }
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Icon name="AlertTriangle" size={24} color="error" />
            Delete Blog
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this blog?
          </Typography>
          {deleteDialog.blog && (
            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Blog Title:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {deleteDialog.blog.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={1}
              >
                This action cannot be undone. The blog will be moved to trash.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={handleDeleteCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} /> : <Icon name="Trash2" />
            }
          >
            {loading ? "Deleting..." : "Delete Blog"}
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
