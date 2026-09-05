"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import toast from "react-hot-toast";

type Comment = { id: string; content: string; createdAt: string; author: { name?: string; username: string } };
type Task = {
  id: string; title: string; description?: string; status: string; dueDate?: string; createdAt: string;
  assignedTo: { name?: string; username: string };
  createdBy: { name?: string; username: string };
  comments: Comment[];
};
type Booking = {
  id: string; reference: string; customerName: string; email: string; phone: string;
  status: string; amount: number; createdAt: string;
  package: { label: string; sublabel?: string };
};

const STATUS_STYLES: Record<string, { pill: string; label: string; icon: string }> = {
  PENDING:    { pill: "bg-yellow-100 text-yellow-700",  label: "Pending",     icon: "ti-clock" },
  IN_PROGRESS:{ pill: "bg-blue-100 text-blue-700",      label: "In Progress", icon: "ti-loader" },
  DONE:       { pill: "bg-emerald-100 text-emerald-700",label: "Done",        icon: "ti-check" },
};

const N = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "checklist">("kanban");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isPending, start] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Checklist state — persisted per session
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  // Booking search
  const [bookingQ, setBookingQ] = useState("");
  const [bookingResults, setBookingResults] = useState<Booking[] | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/tasks").then(r => r.json()).then(d => { setTasks(d.tasks ?? []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const updateStatus = (id: string, status: string) => {
    start(async () => {
      const res = await fetch("/api/admin/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (res.ok) { toast.success("Task updated!"); load(); }
      else toast.error("Update failed.");
    });
  };

  const markAllDone = () => {
    start(async () => {
      const res = await fetch("/api/admin/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markAll" }) });
      if (res.ok) { toast.success("All tasks marked as done!"); load(); }
      else toast.error("Failed to mark all done.");
    });
  };

  const addComment = (taskId: string) => {
    const content = commentText[taskId]?.trim();
    if (!content) { toast.error("Comment cannot be empty."); return; }
    start(async () => {
      const res = await fetch("/api/admin/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comment", taskId, content }) });
      if (res.ok) { setCommentText(p => ({ ...p, [taskId]: "" })); toast.success("Comment added!"); load(); }
      else toast.error("Failed to add comment.");
    });
  };

  // Check-all for checklist
  const allDone = tasks.every(t => checked[t.id] || t.status === "DONE");
  const checkAll = () => {
    const next: Record<string, boolean> = {};
    tasks.forEach(t => { next[t.id] = true; });
    setChecked(next);
  };

  const completeAll = () => {
    const toComplete = tasks.filter(t => checked[t.id] && t.status !== "DONE").map(t => t.id);
    if (!toComplete.length) { toast("All already done!"); return; }
    start(async () => {
      await Promise.all(toComplete.map(id =>
        fetch("/api/admin/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "DONE" }) })
      ));
      toast.success("Completed!"); load();
    });
  };

  // Drag and drop
  const handleDragStart = (id: string) => setDragging(id);
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };
  const handleDrop = (status: string) => {
    if (!dragging) return;
    const task = tasks.find(t => t.id === dragging);
    if (task && task.status !== status) updateStatus(dragging, status);
    setDragging(null); setDragOver(null);
  };

  // Booking search
  const searchBooking = async () => {
    if (!bookingQ.trim()) return;
    setBookingLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings?q=${encodeURIComponent(bookingQ)}`);
      const d = await res.json();
      setBookingResults(d.bookings ?? []);
    } catch { setBookingResults([]); }
    setBookingLoading(false);
  };

  const groups: Record<string, Task[]> = { PENDING: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(t => { if (groups[t.status]) groups[t.status].push(t); });

  const pendingCount = tasks.filter(t => t.status !== "DONE").length;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>My Work</p>
          <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Tasks</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex rounded-xl border border-neutral-200 bg-white p-1 gap-1">
            {(["kanban","checklist"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all flex items-center gap-1.5"
                style={{ background: view === v ? "#141414" : "transparent", color: view === v ? "#fff" : "#888" }}>
                <i className={`ti ${v === "kanban" ? "ti-layout-kanban" : "ti-list-check"} text-sm`} />
                {v === "kanban" ? "Kanban" : "Checklist"}
              </button>
            ))}
          </div>
          {pendingCount > 0 && (
            <button onClick={markAllDone} disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "#10b981" }}>
              {isPending ? <i className="ti ti-loader-2 animate-spin text-sm" /> : <i className="ti ti-checks text-sm" />}
              Mark All Done
            </button>
          )}
        </div>
      </div>

      {/* Booking Search */}
      <div className="bg-white rounded-2xl border p-4 mb-6" style={{ borderColor: "#ebebeb" }}>
        <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-3">Search Booking by ID / Reference</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
            <input value={bookingQ} onChange={e => setBookingQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") searchBooking(); }}
              placeholder="Enter booking ID, reference, name or email…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#e5e5e5" }}
              onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)"}
              onBlur={e => e.target.style.boxShadow = "none"}
            />
          </div>
          <button onClick={searchBooking} disabled={bookingLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            style={{ background: "#141414" }}>
            {bookingLoading ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-search" />}
            Search
          </button>
          {bookingResults !== null && (
            <button onClick={() => { setBookingResults(null); setBookingQ(""); }}
              className="px-3 py-2.5 rounded-xl text-sm text-neutral-500 border" style={{ borderColor: "#e5e5e5" }}>
              Clear
            </button>
          )}
        </div>
        {bookingResults !== null && (
          <div className="mt-3">
            {bookingResults.length === 0 ? (
              <p className="text-sm text-neutral-400 py-2">No bookings found.</p>
            ) : (
              <div className="space-y-2">
                {bookingResults.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
                    <div>
                      <p className="font-semibold text-sm text-[#141414]">{b.customerName}</p>
                      <p className="text-xs text-neutral-400 font-mono">{b.reference} · {b.id}</p>
                      <p className="text-xs text-neutral-400">{b.email} · {b.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm" style={{ color: "#f1552b" }}>{N(b.amount)}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === "PAID" ? "bg-blue-100 text-blue-700" : b.status === "CHECKED_IN" ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                        {b.status.replace("_"," ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20"><i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300"/></div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#ebebeb" }}>
          <i className="ti ti-checklist text-4xl text-neutral-200 block mb-3"/>
          <p className="text-sm text-neutral-400">No tasks assigned yet.</p>
        </div>
      ) : view === "kanban" ? (
        // ─── KANBAN VIEW ───
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(["PENDING","IN_PROGRESS","DONE"] as const).map(status => (
            <div key={status}
              onDragOver={e => { e.preventDefault(); setDragOver(status); }}
              onDrop={() => handleDrop(status)}
              onDragLeave={() => setDragOver(null)}
              className="rounded-2xl transition-all"
              style={{ 
                outline: dragOver === status ? "2px dashed #f1552b" : "2px solid transparent",
                background: dragOver === status ? "rgba(241,85,43,0.04)" : "transparent",
                minHeight: 200,
              }}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[status].pill}`}>
                  <i className={`ti ${STATUS_STYLES[status].icon} mr-1`}/>{STATUS_STYLES[status].label}
                </span>
                <span className="text-xs text-neutral-400">{groups[status].length}</span>
              </div>
              <div className="space-y-3">
                {groups[status].map(task => (
                  <div key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-white rounded-2xl border overflow-hidden cursor-grab active:cursor-grabbing transition-all"
                    style={{
                      borderColor: "#ebebeb",
                      opacity: dragging === task.id ? 0.5 : 1,
                      transform: dragging === task.id ? "scale(0.98)" : "scale(1)",
                      boxShadow: dragging === task.id ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-[#141414] text-sm leading-snug">{task.title}</p>
                        <i className="ti ti-grip-vertical text-neutral-300 flex-shrink-0 mt-0.5" />
                      </div>
                      {task.description && <p className="text-xs text-neutral-500 leading-relaxed mb-3">{task.description}</p>}
                      {task.dueDate && (
                        <p className="text-[10px] font-mono text-neutral-400 mb-3">
                          <i className="ti ti-calendar mr-1"/>Due: {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {["PENDING","IN_PROGRESS","DONE"].map(s => (
                          <button key={s} onClick={() => updateStatus(task.id, s)} disabled={task.status === s || isPending}
                            className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${task.status === s ? STATUS_STYLES[s].pill : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
                            {s.replace("_"," ")}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                        className="text-[11px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1">
                        <i className={`ti ${expanded === task.id ? "ti-chevron-up" : "ti-chevron-down"} text-xs`}/>
                        {task.comments.length} comment{task.comments.length !== 1 ? "s" : ""}
                      </button>
                    </div>
                    {expanded === task.id && (
                      <div className="border-t px-4 py-4" style={{ borderColor: "#f0f0f0" }}>
                        {task.comments.length > 0 ? (
                          <div className="space-y-3 mb-4">
                            {task.comments.map(c => (
                              <div key={c.id} className="bg-neutral-50 rounded-xl px-3 py-2.5">
                                <p className="text-[10px] font-semibold text-neutral-400 mb-1">
                                  {c.author.name ?? c.author.username} · {new Date(c.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                                </p>
                                <p className="text-xs text-neutral-700 leading-relaxed">{c.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-neutral-400 mb-4">No comments yet.</p>}
                        <div className="flex gap-2">
                          <input value={commentText[task.id] ?? ""} onChange={e => setCommentText(p => ({ ...p, [task.id]: e.target.value }))}
                            placeholder="Add a comment…"
                            className="flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-none"
                            style={{ borderColor: "#e5e5e5" }}
                            onKeyDown={e => { if (e.key === "Enter") addComment(task.id); }}
                            onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)"}
                            onBlur={e => e.target.style.boxShadow = "none"}
                          />
                          <button onClick={() => addComment(task.id)} disabled={isPending}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "#f1552b" }}>
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {groups[status].length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-2xl" style={{ borderColor: dragOver === status ? "#f1552b" : "#e5e5e5" }}>
                    <p className="text-xs text-neutral-300">{dragOver === status ? "Drop here" : "Nothing here"}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ─── CHECKLIST VIEW ───
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ebebeb" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
            <p className="text-sm font-semibold text-[#141414]">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <button onClick={checkAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-neutral-50"
                style={{ borderColor: "#e5e5e5", color: "#555" }}>
                <i className="ti ti-checks text-sm" /> Check All
              </button>
              {Object.values(checked).some(Boolean) && (
                <button onClick={completeAll} disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{ background: "#10b981" }}>
                  {isPending ? <i className="ti ti-loader-2 animate-spin text-sm" /> : <i className="ti ti-check text-sm" />}
                  Complete Checked
                </button>
              )}
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "#f5f5f5" }}>
            {tasks.map(task => {
              const isChecked = checked[task.id] || task.status === "DONE";
              return (
                <div key={task.id} className="px-6 py-4 transition-all hover:bg-neutral-50/50">
                  <div className="flex items-start gap-4">
                    {/* Custom Checkbox */}
                    <button
                      onClick={() => {
                        if (task.status === "DONE") return;
                        setChecked(p => ({ ...p, [task.id]: !p[task.id] }));
                      }}
                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center"
                      style={{
                        borderColor: isChecked ? "#10b981" : "#d1d5db",
                        background: isChecked ? "#10b981" : "white",
                      }}
                    >
                      {isChecked && <i className="ti ti-check text-[10px] text-white font-bold" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm transition-all ${isChecked ? "line-through text-neutral-400" : "text-[#141414]"}`}>
                          {task.title}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]?.pill}`}>
                          {STATUS_STYLES[task.status]?.label}
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] font-mono text-neutral-400">
                            <i className="ti ti-calendar mr-0.5"/>Due: {new Date(task.dueDate).toLocaleDateString("en-GB", { day:"2-digit", month:"short" })}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className={`text-xs mt-1 leading-relaxed ${isChecked ? "line-through text-neutral-300" : "text-neutral-500"}`}>{task.description}</p>
                      )}

                      {/* Comments toggle */}
                      <button onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                        className="text-[11px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1 mt-2">
                        <i className={`ti ${expanded === task.id ? "ti-chevron-up" : "ti-message-circle"} text-xs`}/>
                        {task.comments.length} comment{task.comments.length !== 1 ? "s" : ""}
                      </button>

                      {expanded === task.id && (
                        <div className="mt-3 ml-0">
                          {task.comments.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {task.comments.map(c => (
                                <div key={c.id} className="bg-neutral-50 rounded-xl px-3 py-2">
                                  <p className="text-[10px] font-semibold text-neutral-400 mb-0.5">
                                    {c.author.name ?? c.author.username} · {new Date(c.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                                  </p>
                                  <p className="text-xs text-neutral-600">{c.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input value={commentText[task.id] ?? ""} onChange={e => setCommentText(p => ({ ...p, [task.id]: e.target.value }))}
                              placeholder="Add a comment…"
                              className="flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-none"
                              style={{ borderColor: "#e5e5e5" }}
                              onKeyDown={e => { if (e.key === "Enter") addComment(task.id); }}
                              onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)"}
                              onBlur={e => e.target.style.boxShadow = "none"}
                            />
                            <button onClick={() => addComment(task.id)} disabled={isPending}
                              className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "#f1552b" }}>
                              Post
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete button when all are checked */}
          {tasks.length > 0 && tasks.every(t => checked[t.id] || t.status === "DONE") && (
            <div className="px-6 py-4 border-t" style={{ borderColor: "#f0f0f0", background: "#f0fdf4" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ti ti-confetti text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700">All tasks checked!</p>
                </div>
                <button onClick={completeAll} disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#10b981" }}>
                  {isPending ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-check" />}
                  Submit Complete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
