"use client";
import React, { useEffect, useState, useMemo } from "react";
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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import Icon from "../../../../components/AppIcon";
import { ManagerAPI } from "../../../../lib/manager-api";

// Types
interface QuestionApi {
  _id: string;
  productId: string;
  storeId: string;
  customer: { name: string; email?: string };
  question: string;
  answer?: string;
  status: "pending" | "answered" | "hidden";
  askedAt: string;
  answerAt?: string;
}

type ListState = {
  loading: boolean;
  error: string | null;
  data: QuestionApi[];
};

const StatusChip = ({ s }: { s: QuestionApi["status"] }) => {
  if (s === "pending")
    return (
      <Chip size="small" color="warning" label="Pending" variant="outlined" />
    );
  if (s === "answered")
    return (
      <Chip size="small" color="success" label="Answered" variant="outlined" />
    );
  return (
    <Chip size="small" color="default" label="Hidden" variant="outlined" />
  );
};

const DEV_MODE =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_MODE === "development";

export default function QAPage() {
  const [tab, setTab] = useState<"all" | QuestionApi["status"]>("all");
  const [query, setQuery] = useState("");

  const [list, setList] = useState<ListState>({
    loading: true,
    error: null,
    data: [],
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Editing/answering dialog
  const [qaOpen, setQaOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");

  //snackbar

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch all questions on load/refresh
  async function fetchQuestions() {
    setList({ loading: true, error: null, data: [] });
    try {
      const { data }: any = await ManagerAPI.questions.list();
      setList({ loading: false, error: null, data: data.items || [] });
    } catch (err: any) {
      showSnackbar(`Failed to load questions `, "error"),
        setList({
          loading: false,
          error: err?.message || "Failed to load questions.",
          data: [],
        });
    }
  }
  useEffect(() => {
    fetchQuestions();
  }, []);
  const refresh = () => {
    setRefreshing(true);
    fetchQuestions().finally(() => setRefreshing(false));
  };

  // Filtering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.data.filter((r) => {
      const byTab = tab === "all" ? true : r.status === tab;
      const byQuery = !q
        ? true
        : [r.productId, r.customer.name, r.customer.email, r.question, r.answer]
            .join(" ")
            .toLowerCase()
            .includes(q);
      return byTab && byQuery;
    });
  }, [list.data, tab, query]);

  const counts = useMemo(
    () =>
      list.data.reduce(
        (a, r) => ({
          all: a.all + 1,
          pending: a.pending + (r.status === "pending" ? 1 : 0),
          answered: a.answered + (r.status === "answered" ? 1 : 0),
          hidden: a.hidden + (r.status === "hidden" ? 1 : 0),
        }),
        { all: 0, pending: 0, answered: 0, hidden: 0 }
      ),
    [list.data]
  );

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Selection logic
  const allSelected =
    filtered.length > 0 && selected.length === filtered.length;
  const indeterminate = selected.length > 0 && !allSelected;
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? filtered.map((r) => r._id) : []);
  const toggleOne = (id: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );

  // Answer handler
  const openAnswerDialog = (q: QuestionApi) => {
    setCurrentId(q._id);
    setCurrentQuestion(q.question);
    setAnswerText(q.answer || "");
    setQaOpen(true);
  };
  const saveAnswer = async () => {
    if (!currentId) return;
    try {
      await ManagerAPI.questions.update(currentId, { answer: answerText });
      setQaOpen(false);
      refresh();
      showSnackbar("Answer saved successfully.", "success");
    } catch (err: any) {
      showSnackbar("Failed to save answer.", "error");
    }
  };

  // Hide/Unhide
  const toggleHidden = async (q: QuestionApi) => {
    try {
      await ManagerAPI.questions.update(q._id, {
        status: q.status === "hidden" ? "pending" : "hidden",
      });
      refresh();
      showSnackbar(
        q.status === "hidden" ? "Question unhidden." : "Question hidden.",
        "success"
      );
    } catch (err: any) {
      showSnackbar("Failed to update status.", "error");
    }
  };

  // Bulk hide questions
  const bulkHide = async () => {
    if (selected.length === 0) {
      showSnackbar("No questions selected.", "info");
      return;
    }
    let errors = 0;
    for (const id of selected) {
      try {
        await ManagerAPI.questions.update(id, { status: "hidden" });
      } catch {
        errors += 1;
      }
    }
    setSelected([]);
    refresh();
    if (errors === 0) {
      showSnackbar("Selected questions hidden.", "success");
    } else {
      showSnackbar(`Hidden with ${errors} error(s).`, "error");
    }
  };

  // Bulk delete questions
  const bulkDelete = async () => {
    if (selected.length === 0) {
      showSnackbar("No questions selected.", "info");
      return;
    }
    let errors = 0;
    for (const id of selected) {
      try {
        await ManagerAPI.questions.delete(id);
      } catch {
        errors += 1;
      }
    }
    setSelected([]);
    refresh();
    if (errors === 0) {
      showSnackbar("Selected questions deleted.", "success");
    } else {
      showSnackbar(`Deleted with ${errors} error(s).`, "error");
    }
  };

  // Bulk answer prefill
  const bulkAnswer = () => {
    if (selected.length === 0) {
      showSnackbar("No questions selected.", "info");
      return;
    }
    const first = filtered.find((r) => r._id === selected[0]);
    if (first) openAnswerDialog(first);
  };

  // Remove single
  const remove = async (id: string) => {
    try {
      await ManagerAPI.questions.delete(id);
      refresh();
      showSnackbar("Question deleted.", "success");
    } catch (err: any) {
      showSnackbar("Failed to delete question.", "error");
    }
  };

  // Developer: create sample question
  const createSampleQuestion = async () => {
    try {
      const randProduct = `prod-test-${Math.floor(Math.random() * 1000)}`;
      const randUser =
        Math.random() > 0.5
          ? { name: "Dev Tester", email: "dev@yourstore.test" }
          : { name: "QA User" };
      const randQ = [
        "How many colors are available?",
        "Is this product returnable?",
        "Can I get a bulk discount?",
        "What is the warranty period?",
        "Does the price include tax?",
      ][Math.floor(Math.random() * 5)];
      await ManagerAPI.questions.create({
        productId: randProduct,
        question: randQ,
        customer: randUser,
      });
      refresh();
      showSnackbar("Sample question created.", "success");
    } catch (err: any) {
      showSnackbar("Failed to create sample question.", "error");
    }
  };

  return (
    <ManagerLayout title="Product Questions">
      <div className="space-y-6 max-w-7xl mx-auto">
        {DEV_MODE && (
          <div className="flex justify-end my-3">
            <Button
              variant="outlined"
              sx={{ color: "#0891b2", borderColor: "#0891b2" }}
              onClick={createSampleQuestion}
            >
              + Create Sample Question (DEV)
            </Button>
          </div>
        )}
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent sx={{ paddingRight: 5, paddingLeft: 5 }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Tabs
                  value={tab}
                  onChange={(_, v) => {
                    setTab(v);
                    setSelected([]);
                  }}
                >
                  <Tab
                    value="all"
                    label={
                      <div className="flex items-center gap-1">
                        All <Chip size="small" label={counts.all} />
                      </div>
                    }
                  />
                  <Tab
                    value="pending"
                    label={
                      <div className="flex items-center gap-1">
                        Pending{" "}
                        <Chip
                          size="small"
                          color="warning"
                          label={counts.pending}
                        />
                      </div>
                    }
                  />
                  <Tab
                    value="answered"
                    label={
                      <div className="flex items-center gap-1">
                        Answered{" "}
                        <Chip
                          size="small"
                          color="success"
                          label={counts.answered}
                        />
                      </div>
                    }
                  />
                  <Tab
                    value="hidden"
                    label={
                      <div className="flex items-center gap-1">
                        Hidden <Chip size="small" label={counts.hidden} />
                      </div>
                    }
                  />
                </Tabs>
                <TextField
                  placeholder="Search questions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  sx={{ width: 320 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">🔎</InputAdornment>
                    ),
                  }}
                />
              </div>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={refresh}
                  disabled={list.loading || refreshing}
                >
                  <Icon name="RefreshCw" />
                </IconButton>
              </Tooltip>
            </div>

            {list.loading ? (
              <div className="py-16 text-center text-gray-500">Loading...</div>
            ) : list.error ? (
              <div className="py-16 text-center text-rose-600">
                {list.error}
              </div>
            ) : (
              <>
                {selected.length > 0 && (
                  <div className="flex items-center justify-between p-3 mb-3 border rounded bg-gray-50">
                    <Typography variant="body2" fontWeight={600}>
                      {selected.length} selected
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Icon name="MessageSquare" />}
                        onClick={bulkAnswer}
                      >
                        Answer
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Icon name="EyeOff" />}
                        onClick={bulkHide}
                      >
                        Hide
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Icon name="Trash2" />}
                        onClick={bulkDelete}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
                <Table
                  size="small"
                  sx={{
                    "& thead th": {
                      fontWeight: 700,
                      color: "text.secondary",
                      backgroundColor: "#fafafa",
                    },
                    "& td, & th": { borderColor: "#eef2f7" },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ width: 48 }}>
                        <Checkbox
                          color="primary"
                          indeterminate={indeterminate}
                          checked={allSelected}
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>Product ID</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Customer</TableCell>
                      <TableCell sx={{ minWidth: 320 }}>Question</TableCell>
                      <TableCell sx={{ width: 140 }}>Date</TableCell>
                      <TableCell sx={{ width: 120 }}>Status</TableCell>
                      <TableCell sx={{ width: 140 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((r) => (
                      <TableRow key={r._id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={selected.includes(r._id)}
                            onChange={(e) => toggleOne(r._id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{r.productId}</TableCell>
                        <TableCell>
                          <div className="min-w-[120px]">
                            <div className="font-medium">{r.customer.name}</div>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {r.customer.email ?? "—"}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Typography
                            noWrap
                            title={r.question}
                            className="max-w-[520px]"
                          >
                            {r.question}
                          </Typography>
                          {r.answer && (
                            <Typography
                              variant="caption"
                              color="success.main"
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              Answer: {r.answer}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {r.askedAt
                            ? new Date(r.askedAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusChip s={r.status} />
                        </TableCell>
                        <TableCell align="right">
                          <div className="flex justify-end gap-1">
                            <Tooltip title="Answer">
                              <IconButton onClick={() => openAnswerDialog(r)}>
                                <Icon name="MessageSquare" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={r.status === "hidden" ? "Unhide" : "Hide"}
                            >
                              <IconButton onClick={() => toggleHidden(r)}>
                                <Icon name="EyeOff" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => remove(r._id)}
                              >
                                <Icon name="Trash2" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {paginated.length === 0 && (
                  <div className="py-16 text-center text-gray-600">
                    <div className="mb-2 text-5xl">💬</div>
                    <Typography variant="h6" gutterBottom>
                      {tab === "pending"
                        ? "No pending questions"
                        : tab === "answered"
                        ? "No answered questions"
                        : tab === "hidden"
                        ? "No hidden questions"
                        : "No questions found"}
                    </Typography>
                    <Typography color="text.secondary">
                      Try adjusting your filters or search.
                    </Typography>
                  </div>
                )}
                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Typography>Rows per page:</Typography>
                    <TextField
                      select
                      size="small"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(0);
                      }}
                      SelectProps={{ native: true }}
                      sx={{ width: 80 }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </TextField>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      {filtered.length === 0
                        ? "0–0 of 0"
                        : `${page * rowsPerPage + 1}–${Math.min(
                            (page + 1) * rowsPerPage,
                            filtered.length
                          )} of ${filtered.length}`}
                    </div>
                    <div className="flex gap-1">
                      <IconButton
                        size="small"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        <Icon name="ChevronLeft" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={page + 1 >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                      >
                        <Icon name="ChevronRight" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for answer entry */}
      <Dialog
        open={qaOpen}
        onClose={() => setQaOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Question & Answer</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>
            Question
          </Typography>
          <Typography sx={{ mb: 2 }}>{currentQuestion}</Typography>
          <Typography variant="subtitle2" gutterBottom>
            Answer
          </Typography>
          <TextField
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type answer here..."
            multiline
            minRows={4}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setQaOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveAnswer}
            disabled={!answerText.trim()}
          >
            Save
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
