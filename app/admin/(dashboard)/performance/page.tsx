"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Staff = {
  id: string;
  name?: string;
  username: string;
  role: string;
  email?: string;
};

type Shift = {
  id: string;
  userId: string;
  clockInAt: string;
  clockOutAt: string | null;
  clockInLocation?: string;
  clockOutLocation?: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  dueForDate?: string;
  createdAt: string;
  completedAt?: string;
  assignedToId: string;
};

type DayModalData = {
  staff: Staff;
  date: Date;
  shifts: Shift[];
  completedTasks: Task[];
  pendingTasks: Task[];
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PerformancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [dayModal, setDayModal] = useState<DayModalData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month + 1));
    if (selectedStaffId !== "ALL") params.set("staffId", selectedStaffId);

    fetch(`/api/admin/performance?${params}`)
      .then(r => r.json())
      .then(d => {
        setStaffList(d.staff ?? []);
        setShifts(d.shifts ?? []);
        setTasks(d.tasks ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [year, month, selectedStaffId]); // eslint-disable-line

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const handleDayClick = (staff: Staff, day: number) => {
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(year, month, day + 1);
    nextDay.setHours(0, 0, 0, 0);

    // Filter shifts for this day & staff
    const dayShifts = shifts.filter(s => {
      if (s.userId !== staff.id) return false;
      const d = new Date(s.clockInAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    // Match tasks assigned to this staff:
    // 1. Completed tasks completed on this date or assigned for this date
    // 2. Pending tasks due on or created on this date
    const staffTasks = tasks.filter(t => t.assignedToId === staff.id);

    const completed = staffTasks.filter(t => {
      if (t.status !== "DONE") return false;
      if (t.completedAt) {
        const cDate = new Date(t.completedAt);
        if (cDate.getFullYear() === year && cDate.getMonth() === month && cDate.getDate() === day) {
          return true;
        }
      }
      if (t.dueDate) {
        const dDate = new Date(t.dueDate);
        if (dDate.getFullYear() === year && dDate.getMonth() === month && dDate.getDate() === day) {
          return true;
        }
      }
      const crDate = new Date(t.createdAt);
      return crDate.getFullYear() === year && crDate.getMonth() === month && crDate.getDate() === day;
    });

    const pending = staffTasks.filter(t => {
      if (t.status === "DONE") return false;
      if (t.dueDate) {
        const dDate = new Date(t.dueDate);
        if (dDate.getFullYear() === year && dDate.getMonth() === month && dDate.getDate() === day) {
          return true;
        }
      }
      const crDate = new Date(t.createdAt);
      return crDate.getFullYear() === year && crDate.getMonth() === month && crDate.getDate() === day;
    });

    setDayModal({
      staff,
      date: new Date(year, month, day),
      shifts: dayShifts,
      completedTasks: completed,
      pendingTasks: pending,
    });
  };

  const calcHours = (shiftIn: string, shiftOut: string | null) => {
    if (!shiftOut) return "Active now";
    const diff = new Date(shiftOut).getTime() - new Date(shiftIn).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const exportCSV = () => {
    try {
      const headers = [
        "Staff Name",
        "Username",
        "Date",
        "Status",
        "Clock In",
        "Clock Out",
        "Duration",
        "Tasks Completed",
      ];

      const rows: (string | number)[][] = [];

      const displayStaff = selectedStaffId === "ALL"
        ? staffList
        : staffList.filter(s => s.id === selectedStaffId);

      displayStaff.forEach(st => {
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(year, month, day);
          const isFuture = d > today;
          if (isFuture) continue;

          const dayShifts = shifts.filter(s => {
            if (s.userId !== st.id) return false;
            const sDate = new Date(s.clockInAt);
            return sDate.getFullYear() === year && sDate.getMonth() === month && sDate.getDate() === day;
          });

          const dayTasksDone = tasks.filter(t => {
            if (t.assignedToId !== st.id || t.status !== "DONE") return false;
            const cDate = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
            return cDate.getFullYear() === year && cDate.getMonth() === month && cDate.getDate() === day;
          }).length;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

          if (dayShifts.length > 0) {
            dayShifts.forEach(sh => {
              rows.push([
                `"${st.name ?? st.username}"`,
                `"${st.username}"`,
                dateStr,
                "PRESENT",
                `"${new Date(sh.clockInAt).toLocaleTimeString()}"`,
                `"${sh.clockOutAt ? new Date(sh.clockOutAt).toLocaleTimeString() : "Active"}"`,
                `"${calcHours(sh.clockInAt, sh.clockOutAt)}"`,
                dayTasksDone,
              ]);
            });
          } else {
            rows.push([
              `"${st.name ?? st.username}"`,
              `"${st.username}"`,
              dateStr,
              "ABSENT / OFF",
              "—",
              "—",
              "—",
              dayTasksDone,
            ]);
          }
        }
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `staff-performance-${MONTH_NAMES[month]}-${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Attendance CSV exported!");
    } catch {
      toast.error("Failed to export attendance CSV.");
    }
  };

  const displayedStaff = selectedStaffId === "ALL"
    ? staffList
    : staffList.filter(s => s.id === selectedStaffId);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>
            Management
          </p>
          <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Staff Performance & Attendance
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Click any day on a staff's calendar to inspect shifts and tasks performed on that date.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Switcher */}
          <div className="flex items-center gap-1.5 bg-white border rounded-xl p-1 shadow-sm" style={{ borderColor: "#e5e5e5" }}>
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center transition-colors"
            >
              <i className="ti ti-chevron-left text-xs text-neutral-600" />
            </button>
            <span className="text-xs font-bold text-[#141414] px-2 min-w-[120px] text-center font-mono">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center transition-colors"
            >
              <i className="ti ti-chevron-right text-xs text-neutral-600" />
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border bg-white hover:bg-neutral-50 shadow-sm transition-all text-[#141414]"
            style={{ borderColor: "#e5e5e5" }}
          >
            <i className="ti ti-download text-sm" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Staff Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedStaffId("ALL")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            selectedStaffId === "ALL"
              ? "bg-[#141414] text-white border-[#141414]"
              : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          All Staff ({staffList.length})
        </button>
        {staffList.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStaffId(s.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
              selectedStaffId === s.id
                ? "bg-[#141414] text-white border-[#141414]"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {s.name ?? s.username}
          </button>
        ))}
      </div>

      {/* Main Staff Calendars */}
      {loading ? (
        <div className="py-20 text-center">
          <i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300" />
        </div>
      ) : displayedStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#ebebeb" }}>
          <p className="text-sm text-neutral-400">No staff found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedStaff.map(staff => {
            // Calculate staff stats for current month
            const staffShifts = shifts.filter(s => s.userId === staff.id);
            const daysWorked = new Set(
              staffShifts.map(s => new Date(s.clockInAt).getDate())
            ).size;

            const staffCompletedTasks = tasks.filter(
              t => t.assignedToId === staff.id && t.status === "DONE"
            ).length;

            const totalActiveDaysSoFar = isCurrentMonth ? todayDate : daysInMonth;
            const attendancePct = Math.round((daysWorked / totalActiveDaysSoFar) * 100) || 0;

            return (
              <div
                key={staff.id}
                className="bg-white rounded-2xl border p-6 shadow-sm transition-all"
                style={{ borderColor: "#ebebeb" }}
              >
                {/* Staff Header & Summary Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b mb-5" style={{ borderColor: "#f0f0f0" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: "#f1552b" }}
                    >
                      {(staff.name ?? staff.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#141414] text-base" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                          {staff.name ?? staff.username}
                        </h3>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                          {staff.role === "SUPER_ADMIN" ? "Super Admin" : "Receptionist"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">@{staff.username}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[9px] font-mono text-emerald-600 uppercase">Days Worked</p>
                      <p className="text-sm font-bold text-emerald-800 font-mono">{daysWorked} days</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <p className="text-[9px] font-mono text-neutral-500 uppercase">Attendance</p>
                      <p className="text-sm font-bold text-[#141414] font-mono">{attendancePct}%</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200">
                      <p className="text-[9px] font-mono text-[#f1552b] uppercase">Tasks Done</p>
                      <p className="text-sm font-bold text-[#f1552b] font-mono">{staffCompletedTasks}</p>
                    </div>
                  </div>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <span key={d} className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty offsets */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-16 rounded-xl bg-neutral-50/40" />
                  ))}

                  {/* Day Blocks */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayShifts = staffShifts.filter(s => new Date(s.clockInAt).getDate() === day);
                    const worked = dayShifts.length > 0;
                    const isPast = isCurrentMonth ? day < todayDate : new Date(year, month, day) < today;
                    const isToday = isCurrentMonth && day === todayDate;

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(staff, day)}
                        className={`h-16 p-2 rounded-xl border flex flex-col justify-between text-left transition-all relative group hover:shadow-md ${
                          worked
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-100"
                            : isToday
                            ? "bg-orange-50/60 border-[#f1552b] text-[#141414] hover:bg-orange-100/50"
                            : isPast
                            ? "bg-red-50/40 border-red-200 text-neutral-600 hover:bg-red-50"
                            : "bg-neutral-50/50 border-neutral-100 text-neutral-300 cursor-default"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold ${isToday ? "text-[#f1552b]" : ""}`}>
                            {day}
                          </span>
                          {worked ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                          ) : isPast ? (
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                          ) : null}
                        </div>

                        <div className="text-[10px] font-mono truncate">
                          {worked ? (
                            <span className="text-emerald-700 font-semibold">● Present</span>
                          ) : isToday ? (
                            <span className="text-[#f1552b] font-semibold">Today</span>
                          ) : isPast ? (
                            <span className="text-red-500">✕ Off</span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="flex items-center gap-5 mt-4 pt-3 border-t text-xs text-neutral-500" style={{ borderColor: "#f5f5f5" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                    <span>Present (Green)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-50 border border-red-300" />
                    <span>Did not work / Off (Red)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded border border-[#f1552b] bg-orange-50" />
                    <span>Today</span>
                  </div>
                  <span className="ml-auto text-[11px] text-neutral-400 italic">
                    💡 Click any day to see shifts & tasks details
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Chronological Shift Log Table */}
      {!loading && shifts.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm mt-8" style={{ borderColor: "#ebebeb" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f0f0f0" }}>
            <div>
              <h3 className="font-bold text-[#141414] text-base" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Detailed Shift Time Records
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Exact clock in/out timestamps, durations, and locations for {MONTH_NAMES[month]} {year}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
              {shifts.length} shift{shifts.length !== 1 ? "s" : ""} recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8f8f8" }}>
                <tr>
                  {["Staff Member", "Date", "Clock In Time", "Clock Out Time", "Duration", "Location (In / Out)"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map(sh => {
                  const staffObj = staffList.find(s => s.id === sh.userId);
                  const inDate = new Date(sh.clockInAt);
                  const outDate = sh.clockOutAt ? new Date(sh.clockOutAt) : null;

                  return (
                    <tr key={sh.id} className="border-t hover:bg-neutral-50/60 transition-colors" style={{ borderColor: "#f0f0f0" }}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "#f1552b" }}
                          >
                            {(staffObj?.name ?? staffObj?.username ?? "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-[#141414]">{staffObj?.name ?? staffObj?.username ?? "Staff"}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">@{staffObj?.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-neutral-600 font-medium">
                        {inDate.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          {inDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {outDate ? (
                          <span className="font-mono text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">
                            {outDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                            ● Active Now
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-neutral-700">
                        {calcHours(sh.clockInAt, sh.clockOutAt)}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-neutral-400 font-mono max-w-[200px] truncate">
                        {sh.clockInLocation || "—"} {sh.clockOutLocation ? `→ ${sh.clockOutLocation}` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {dayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b mb-5" style={{ borderColor: "#f0f0f0" }}>
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-[#f1552b] mb-1">
                  Day Inspection
                </p>
                <h3 className="text-lg font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {dayModal.staff.name ?? dayModal.staff.username}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {dayModal.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setDayModal(null)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"
              >
                <i className="ti ti-x text-neutral-500" />
              </button>
            </div>

            {/* Attendance & Shift Details */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Shift & Attendance
              </h4>
              {dayModal.shifts.length === 0 ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                  <i className="ti ti-clock-off text-red-500 text-lg" />
                  <div>
                    <p className="text-xs font-semibold text-red-800">No shift recorded</p>
                    <p className="text-[11px] text-red-600">Staff did not clock in on this date.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayModal.shifts.map(sh => (
                    <div
                      key={sh.id}
                      className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-emerald-950 font-mono">
                            {new Date(sh.clockInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            {" → "}
                            {sh.clockOutAt
                              ? new Date(sh.clockOutAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                              : "Active"}
                          </span>
                        </div>
                        {sh.clockInLocation && (
                          <p className="text-[10px] text-neutral-500 truncate max-w-[280px]">
                            📍 In: {sh.clockInLocation}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold font-mono text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                        {calcHours(sh.clockInAt, sh.clockOutAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div className="space-y-4">
              {/* Tasks Performed (Completed) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ti ti-circle-check text-sm" /> Tasks Performed ({dayModal.completedTasks.length})
                  </h4>
                </div>

                {dayModal.completedTasks.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    No completed tasks recorded for this day.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayModal.completedTasks.map(t => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs"
                      >
                        <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                          <i className="ti ti-check text-emerald-600 font-bold" /> {t.title}
                        </p>
                        {t.description && (
                          <p className="text-[11px] text-neutral-500 mt-1 pl-4">{t.description}</p>
                        )}
                        {t.completedAt && (
                          <p className="text-[10px] font-mono text-neutral-400 mt-1 pl-4">
                            Completed at {new Date(t.completedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks Not Performed (Pending) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ti ti-clock text-sm" /> Tasks Not Performed ({dayModal.pendingTasks.length})
                  </h4>
                </div>

                {dayModal.pendingTasks.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    No pending/unperformed tasks for this day.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayModal.pendingTasks.map(t => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-orange-50/40 border border-orange-200 text-xs"
                      >
                        <p className="font-semibold text-[#141414] flex items-center gap-1.5">
                          <i className="ti ti-alert-circle text-orange-500" /> {t.title}
                        </p>
                        {t.description && (
                          <p className="text-[11px] text-neutral-500 mt-1 pl-4">{t.description}</p>
                        )}
                        <span className="inline-block mt-1.5 ml-4 text-[9px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                          Status: {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setDayModal(null)}
              className="w-full mt-6 py-2.5 rounded-xl text-sm font-medium text-neutral-600 border hover:bg-neutral-50"
              style={{ borderColor: "#e5e5e5" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
