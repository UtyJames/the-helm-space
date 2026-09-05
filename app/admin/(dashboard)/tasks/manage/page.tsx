"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type Staff = { id: string; name?: string; username: string };
type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  repeatType?: string;
  repeatDays?: string;
  repeatDates?: string;
  assignedTo: { name?: string; username: string };
  createdBy: { name?: string; username: string };
  createdAt: string;
  comments: { id: string }[];
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE:        "bg-emerald-100 text-emerald-700",
};

const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function ManageTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [repeatType, setRepeatType] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY_DATES">("NONE");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);

  const [isPending, start] = useTransition();

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/tasks").then(r => r.json()),
      fetch("/api/admin/staff").then(r => r.json()),
    ])
      .then(([tData, sData]) => {
        setTasks(tData.tasks ?? []);
        setStaff(sData.staff ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleDate = (num: number) => {
    setSelectedDates(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!assignedToId) {
      toast.error("Please select a staff member.");
      return;
    }

    if (repeatType === "WEEKLY" && selectedDays.length === 0) {
      toast.error("Please select at least one day of the week.");
      return;
    }

    if (repeatType === "MONTHLY_DATES" && selectedDates.length === 0) {
      toast.error("Please select at least one day of the month.");
      return;
    }

    start(async () => {
      const payload = {
        title,
        description,
        assignedToId,
        dueDate: dueDate || undefined,
        repeatType,
        repeatDays: repeatType === "WEEKLY" ? selectedDays.join(",") : null,
        repeatDates: repeatType === "MONTHLY_DATES" ? selectedDates : null,
      };

      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Task created and assigned!");
        setTitle("");
        setDescription("");
        setAssignedToId("");
        setDueDate("");
        setRepeatType("NONE");
        setSelectedDays([]);
        setSelectedDates([]);
        setShowForm(false);
        load();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to create task.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    start(async () => {
      const res = await fetch("/api/admin/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Task deleted.");
        load();
      } else {
        toast.error("Delete failed.");
      }
    });
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>
            Management
          </p>
          <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Assign & Manage Tasks
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Create recurring daily or custom tasks and assign them to staff.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95"
          style={{ background: "#141414" }}
        >
          <i className={`ti ${showForm ? "ti-x" : "ti-plus"} text-sm`} />
          {showForm ? "Cancel" : "New Task"}
        </button>
      </div>

      {/* Create Task Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6 mb-8 shadow-sm" style={{ borderColor: "#ebebeb" }}>
          <h3 className="text-sm font-bold text-[#141414] mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Create & Assign Task
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Task Title *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Verify morning check-ins & clean workspace"
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: "#e5e5e5" }}
                onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                onBlur={e => (e.target.style.boxShadow = "none")}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional task details or checklist items…"
                rows={3}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#e5e5e5" }}
                onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                onBlur={e => (e.target.style.boxShadow = "none")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                  Assign To *
                </label>
                <select
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  <option value="">Select staff member…</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name ?? s.username} (@{s.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                  Due Date (One-off)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none bg-white"
                  style={{ borderColor: "#e5e5e5" }}
                  onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                  onBlur={e => (e.target.style.boxShadow = "none")}
                />
              </div>
            </div>

            {/* Repeat Options */}
            <div className="p-4 rounded-xl border bg-neutral-50/50 space-y-3" style={{ borderColor: "#e5e5e5" }}>
              <div>
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  <i className="ti ti-repeat mr-1 text-[#f1552b]" /> Repeat Schedule
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "NONE", label: "No Repeat" },
                    { key: "DAILY", label: "Every Day (Daily)" },
                    { key: "WEEKLY", label: "Specific Days of Week" },
                    { key: "MONTHLY_DATES", label: "Specific Dates of Month" },
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => setRepeatType(opt.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        repeatType === opt.key
                          ? "bg-[#141414] text-white border-[#141414]"
                          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days of week picker */}
              {repeatType === "WEEKLY" && (
                <div>
                  <p className="text-[11px] text-neutral-500 mb-1.5 font-medium">Select active days:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`w-12 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                          selectedDays.includes(day)
                            ? "bg-[#f1552b] text-white border-[#f1552b]"
                            : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates of month picker */}
              {repeatType === "MONTHLY_DATES" && (
                <div>
                  <p className="text-[11px] text-neutral-500 mb-1.5 font-medium">Select dates of each month (1 - 31):</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(num => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => toggleDate(num)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all border ${
                          selectedDates.includes(num)
                            ? "bg-[#f1552b] text-white border-[#f1552b]"
                            : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#f1552b" }}
            >
              {isPending ? "Creating…" : "Create Task →"}
            </button>
          </form>
        </div>
      )}

      {/* All Tasks Table */}
      {loading ? (
        <div className="text-center py-20">
          <i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#ebebeb" }}>
          <i className="ti ti-clipboard-list text-4xl text-neutral-200 block mb-3" />
          <p className="text-sm text-neutral-400">No tasks created yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ebebeb" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8f8f8" }}>
                <tr>
                  {["Task", "Assigned To", "Status", "Schedule / Repeat", "Due", "Comments", "Created", ""].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr
                    key={t.id}
                    className="border-t hover:bg-neutral-50/60 transition-colors"
                    style={{ borderColor: "#f0f0f0" }}
                  >
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <p className="font-semibold text-[#141414] leading-snug">{t.title}</p>
                      {t.description && (
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{t.description}</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs font-medium text-neutral-700">
                      {t.assignedTo?.name ?? t.assignedTo?.username}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          STATUS_STYLES[t.status] ?? "bg-neutral-100"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Schedule / Repeat info */}
                    <td className="px-4 py-3.5">
                      {t.repeatType === "DAILY" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          🔁 Daily
                        </span>
                      ) : t.repeatType === "WEEKLY" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                          🔁 {t.repeatDays || "Weekly"}
                        </span>
                      ) : t.repeatType === "MONTHLY_DATES" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-mono">
                          🔁 Dates: {t.repeatDates || "Monthly"}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">One-off</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-neutral-500 font-mono">
                      {t.dueDate
                        ? new Date(t.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                        : "—"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-neutral-500 font-mono">
                      {t.comments?.length ?? 0}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-neutral-400 font-mono">
                      {new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-neutral-300 hover:text-red-500"
                        title="Delete Task"
                      >
                        <i className="ti ti-trash text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
