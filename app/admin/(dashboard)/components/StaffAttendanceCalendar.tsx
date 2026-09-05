"use client";

import { useState, useEffect } from "react";

type Shift = {
  id: string;
  clockInAt: string;
  clockOutAt: string | null;
  clockInLocation?: string;
  clockOutLocation?: string;
};

export default function StaffAttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const loadShifts = (y: number, m: number) => {
    setLoading(true);
    fetch(`/api/admin/shifts/me?year=${y}&month=${m + 1}`)
      .then(res => res.json())
      .then(data => {
        setShifts(data.shifts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadShifts(year, month);
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create a map of day number to shifts
  const shiftMap = new Map<number, Shift[]>();
  shifts.forEach(shift => {
    const d = new Date(shift.clockInAt);
    const day = d.getDate();
    const existing = shiftMap.get(day) ?? [];
    existing.push(shift);
    shiftMap.set(day, existing);
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const daysWorkedCount = shiftMap.size;

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              My Attendance Calendar
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {daysWorkedCount} days worked
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Track your shifts and days on duty</p>
        </div>

        {/* Month switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-neutral-50 transition-colors"
            style={{ borderColor: "#e5e5e5" }}
            title="Previous Month"
          >
            <i className="ti ti-chevron-left text-xs text-neutral-600" />
          </button>
          <span className="text-sm font-semibold text-[#141414] min-w-[130px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-neutral-50 transition-colors"
            style={{ borderColor: "#e5e5e5" }}
            title="Next Month"
          >
            <i className="ti ti-chevron-right text-xs text-neutral-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <i className="ti ti-loader-2 animate-spin text-xl text-neutral-300" />
        </div>
      ) : (
        <>
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <span key={d} className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 rounded-xl bg-neutral-50/50" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayShifts = shiftMap.get(day);
              const worked = Boolean(dayShifts && dayShifts.length > 0);
              const isPast = isCurrentMonth ? day < todayDate : new Date(year, month, day) < today;
              const isToday = isCurrentMonth && day === todayDate;

              return (
                <div
                  key={day}
                  className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between transition-all relative ${
                    worked
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      : isToday
                      ? "bg-orange-50/50 border-[#f1552b] text-[#141414]"
                      : isPast
                      ? "bg-red-50/20 border-red-100 text-neutral-400"
                      : "bg-neutral-50/40 border-neutral-100 text-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isToday ? "text-[#f1552b] font-bold" : ""}`}>
                      {day}
                    </span>
                    {worked && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                    )}
                    {!worked && isPast && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
                    )}
                  </div>

                  {worked && dayShifts ? (
                    <div className="text-[9px] font-mono font-medium text-emerald-700 truncate">
                      {dayShifts.length === 1 ? "Present" : `${dayShifts.length} shifts`}
                    </div>
                  ) : isToday ? (
                    <div className="text-[9px] font-medium text-[#f1552b]">
                      Today
                    </div>
                  ) : isPast ? (
                    <div className="text-[9px] text-red-400 font-normal">
                      Off
                    </div>
                  ) : (
                    <div className="text-[9px] text-neutral-300">
                      —
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-5 pt-4 border-t text-xs text-neutral-500" style={{ borderColor: "#f0f0f0" }}>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
              <span>Present / Clocked in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-red-50 border border-red-200" />
              <span>Off / Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border border-[#f1552b] bg-orange-50" />
              <span>Today</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
