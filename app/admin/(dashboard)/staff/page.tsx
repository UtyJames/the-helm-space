"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type Staff = {
  id: string; name?: string; username: string; email?: string;
  role: string; active: boolean; password: string; pin?: string; createdAt: string;
};

type Modal =
  | { type: "create" }
  | { type: "password"; staff: Staff }
  | { type: "pin"; staff: Staff }
  | { type: "delete"; staff: Staff }
  | { type: "view"; staff: Staff }
  | null;

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [isPending, start] = useTransition();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/staff").then(r => r.json()).then(d => { setStaff(d.staff ?? []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const doDelete = (id: string) => {
    start(async () => {
      const res = await fetch("/api/admin/staff", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { toast.success("Staff account deleted."); load(); setModal(null); }
      else { const d = await res.json(); toast.error(d.error ?? "Delete failed."); }
    });
  };

  const doUpdate = (id: string, data: Record<string, unknown>) => {
    start(async () => {
      const res = await fetch("/api/admin/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
      if (res.ok) { toast.success("Updated!"); load(); setModal(null); }
      else { const d = await res.json(); toast.error(d.error ?? "Update failed."); }
    });
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>Management</p>
          <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Staff</h1>
        </div>
        <button onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#141414" }}>
          <i className="ti ti-plus text-sm"/> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ebebeb" }}>
        {loading ? (
          <div className="py-16 text-center"><i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8f8f8" }}>
                <tr>
                  {["Name","Username","Role","Status","Created","Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-t hover:bg-neutral-50/60 transition-colors" style={{ borderColor: "#f0f0f0" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#f1552b" }}>
                          {(s.name ?? s.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#141414]">{s.name ?? s.username}</p>
                          {s.email && <p className="text-xs text-neutral-400">{s.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{s.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${s.role === "SUPER_ADMIN" ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-600"}`}>
                        {s.role === "SUPER_ADMIN" ? "Super Admin" : "Receptionist"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {new Date(s.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ type: "view", staff: s })}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700" title="View credentials">
                          <i className="ti ti-eye text-sm"/>
                        </button>
                        <button onClick={() => setModal({ type: "password", staff: s })}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700" title="Change password">
                          <i className="ti ti-key text-sm"/>
                        </button>
                        <button onClick={() => setModal({ type: "pin", staff: s })}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700" title="Change PIN">
                          <i className="ti ti-number text-sm"/>
                        </button>
                        <button onClick={() => setModal({ type: "delete", staff: s })}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-neutral-400 hover:text-red-500" title="Delete">
                          <i className="ti ti-trash text-sm"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">

            {/* View credentials */}
            {modal.type === "view" && (
              <>
                <h3 className="text-base font-bold text-[#141414] mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Credentials — {modal.staff.name ?? modal.staff.username}
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Username", value: modal.staff.username },
                    { label: "Password", value: modal.staff.password },
                    { label: "PIN", value: modal.staff.pin ?? "(not set)" },
                    { label: "Role", value: modal.staff.role === "SUPER_ADMIN" ? "Super Admin" : "Receptionist" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-neutral-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-medium text-[#141414] font-mono">{value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setModal(null)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-[#141414] border" style={{ borderColor: "#e5e5e5" }}>
                  Close
                </button>
              </>
            )}

            {/* Change password */}
            {modal.type === "password" && (
              <ChangeFieldModal
                title={`Change Password — ${modal.staff.name ?? modal.staff.username}`}
                label="New Password"
                type="text"
                placeholder="Enter new password"
                onSubmit={(v) => doUpdate(modal.staff.id, { password: v })}
                onClose={() => setModal(null)}
                loading={isPending}
              />
            )}

            {/* Change PIN */}
            {modal.type === "pin" && (
              <ChangeFieldModal
                title={`Change PIN — ${modal.staff.name ?? modal.staff.username}`}
                label="New 4-Digit PIN"
                type="text"
                maxLength={4}
                placeholder="e.g. 1234"
                validate={(v) => /^\d{4}$/.test(v) ? null : "PIN must be exactly 4 digits."}
                onSubmit={(v) => doUpdate(modal.staff.id, { pin: v })}
                onClose={() => setModal(null)}
                loading={isPending}
              />
            )}

            {/* Delete confirm */}
            {modal.type === "delete" && (
              <>
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
                  <i className="ti ti-trash text-xl text-red-500"/>
                </div>
                <h3 className="text-base font-bold text-center text-[#141414] mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Delete Account
                </h3>
                <p className="text-sm text-neutral-500 text-center mb-6">
                  Are you sure you want to delete <strong>{modal.staff.name ?? modal.staff.username}</strong>? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-neutral-600" style={{ borderColor: "#e5e5e5" }}>
                    Cancel
                  </button>
                  <button onClick={() => doDelete(modal.staff.id)} disabled={isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#ef4444" }}>
                    {isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </>
            )}

            {/* Create staff */}
            {modal.type === "create" && (
              <CreateStaffModal
                onClose={() => setModal(null)}
                onCreated={() => { load(); setModal(null); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChangeFieldModal({ title, label, type, placeholder, maxLength, validate, onSubmit, onClose, loading }:
  { title: string; label: string; type: string; placeholder: string; maxLength?: number; validate?: (v: string) => string | null; onSubmit: (v: string) => void; onClose: () => void; loading: boolean }) {
  const [value, setValue] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) { toast.error("Field is required."); return; }
    const err = validate?.(value);
    if (err) { toast.error(err); return; }
    onSubmit(value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-base font-bold text-[#141414] mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{title}</h3>
      <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">{label}</label>
      <input type={type} value={value} maxLength={maxLength} onChange={e => setValue(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border px-4 py-3 text-sm mb-4 focus:outline-none" style={{ borderColor: "#e5e5e5" }}
        onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)"}
        onBlur={e => e.target.style.boxShadow = "none"}/>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-neutral-600" style={{ borderColor: "#e5e5e5" }}>Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#141414" }}>
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function CreateStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", username: "", password: "", pin: "", role: "RECEPTIONIST" });
  const [loading, start] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error("Username and password are required."); return; }
    if (form.pin && !/^\d{4}$/.test(form.pin)) { toast.error("PIN must be 4 digits."); return; }
    start(async () => {
      const res = await fetch("/api/admin/staff", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pin: form.pin || undefined }),
      });
      if (res.ok) { toast.success("Staff account created!"); onCreated(); }
      else { const d = await res.json(); toast.error(d.error ?? "Failed to create."); }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-base font-bold text-[#141414] mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Add Staff</h3>
      <div className="space-y-3">
        {[
          { key: "name", label: "Full Name", placeholder: "e.g. Jane Doe", type: "text" },
          { key: "username", label: "Username *", placeholder: "e.g. janedoe", type: "text" },
          { key: "password", label: "Password *", placeholder: "Set a strong password", type: "text" },
          { key: "pin", label: "PIN (optional)", placeholder: "4 digits e.g. 1234", type: "text", maxLength: 4 },
        ].map(({ key, label, placeholder, type, maxLength }) => (
          <div key={key}>
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{label}</label>
            <input type={type} value={form[key as keyof typeof form]} maxLength={maxLength}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#e5e5e5" }}
              onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)"}
              onBlur={e => e.target.style.boxShadow = "none"}/>
          </div>
        ))}
        <div>
          <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Role</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="w-full rounded-xl border px-4 py-2.5 text-sm bg-white focus:outline-none" style={{ borderColor: "#e5e5e5" }}>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-neutral-600" style={{ borderColor: "#e5e5e5" }}>Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#141414" }}>
          {loading ? "Creating…" : "Create Account"}
        </button>
      </div>
    </form>
  );
}
