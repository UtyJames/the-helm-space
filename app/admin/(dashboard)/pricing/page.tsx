"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type Package = { id: string; key: string; label: string; sublabel?: string; price: number; origPrice?: number; unit: string; custom: boolean; active: boolean };

const N = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: string; price: string; origPrice: string } | null>(null);
  const [isPending, start] = useTransition();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/pricing").then(r => r.json()).then(d => { setPackages(d.packages ?? []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = (id: string) => {
    if (!editing || editing.id !== id) return;
    const price = parseInt(editing.price);
    const origPrice = editing.origPrice ? parseInt(editing.origPrice) : null;
    if (isNaN(price) || price < 0) { toast.error("Invalid price."); return; }

    start(async () => {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price, origPrice }),
      });
      if (res.ok) { toast.success("Price updated!"); setEditing(null); load(); }
      else toast.error("Update failed.");
    });
  };

  const toggleActive = (id: string, active: boolean) => {
    start(async () => {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      if (res.ok) { toast.success(active ? "Package deactivated." : "Package activated!"); load(); }
      else toast.error("Update failed.");
    });
  };

  return (
    <div className="p-6 md:p-8">
      <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>Management</p>
      <h1 className="text-2xl font-bold text-[#141414] mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Pricing</h1>

      {loading ? (
        <div className="text-center py-20"><i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300"/></div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ebebeb" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8f8f8" }}>
                <tr>
                  {["Package","Current Price","Original Price","Unit","Status","Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => {
                  const isEditing = editing?.id === pkg.id;
                  return (
                    <tr key={pkg.id} className="border-t hover:bg-neutral-50/50 transition-colors" style={{ borderColor: "#f0f0f0" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#141414]">{pkg.label}</p>
                        {pkg.sublabel && <p className="text-xs text-neutral-400">{pkg.sublabel}</p>}
                        {pkg.custom && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Custom dates</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={editing.price}
                            onChange={e => setEditing(v => v && { ...v, price: e.target.value })}
                            className="w-28 rounded-lg border px-2 py-1.5 text-sm font-mono focus:outline-none"
                            style={{ borderColor: "#f1552b" }}/>
                        ) : (
                          <span className="font-mono font-semibold text-[#141414]">{N(pkg.price)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={editing.origPrice} placeholder="—"
                            onChange={e => setEditing(v => v && { ...v, origPrice: e.target.value })}
                            className="w-28 rounded-lg border px-2 py-1.5 text-sm font-mono focus:outline-none"
                            style={{ borderColor: "#e5e5e5" }}/>
                        ) : (
                          <span className="font-mono text-neutral-400 line-through">{pkg.origPrice ? N(pkg.origPrice) : "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500 font-mono">{pkg.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${pkg.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>
                          {pkg.active ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSave(pkg.id)} disabled={isPending}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#f1552b" }}>
                                {isPending ? "…" : "Save"}
                              </button>
                              <button onClick={() => setEditing(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 border" style={{ borderColor: "#e5e5e5" }}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditing({ id: pkg.id, price: String(pkg.price), origPrice: pkg.origPrice ? String(pkg.origPrice) : "" })}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700">
                                <i className="ti ti-edit text-sm"/>
                              </button>
                              <button onClick={() => toggleActive(pkg.id, pkg.active)} disabled={isPending}
                                className={`p-1.5 rounded-lg transition-colors text-neutral-400 ${pkg.active ? "hover:bg-red-50 hover:text-red-500" : "hover:bg-emerald-50 hover:text-emerald-600"}`}>
                                <i className={`ti ${pkg.active ? "ti-eye-off" : "ti-eye"} text-sm`}/>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
