"use client";

import { useState, useMemo } from "react";

type PackageId = "monthly-standard"|"monthly-premium"|"weekend"|"team-desks"|"meeting-room"|"hall"|"daily-dedicated"|"daily-shared"|"custom";

interface Pkg { id: PackageId; label: string; sublabel?: string; price: number; orig?: number; unit: string; custom?: boolean; }

const PKGS: Pkg[] = [
  { id:"monthly-standard", label:"The Helm Monthly Package",                    price:70000, orig:75000,  unit:"/month" },
  { id:"monthly-premium",  label:"The Helm Monthly Package", sublabel:"Premium", price:80000, orig:85000,  unit:"/month" },
  { id:"weekend",          label:"The Helm Weekend Package",                     price:12000,             unit:"/weekend" },
  { id:"team-desks",       label:"Team Desks", sublabel:"Shared Desk - team of 4", price:11000, orig:12500, unit:"/month" },
  { id:"meeting-room",     label:"Meeting Room", sublabel:"9 seats",             price:15000, orig:25000,  unit:"/session" },
  { id:"hall",             label:"The Helm Space Hall", sublabel:"For Rent",     price:80000, orig:100000, unit:"/day" },
  { id:"daily-dedicated",  label:"Daily Pass", sublabel:"Dedicated Desk",        price:2000,  orig:4000,   unit:"/day" },
  { id:"daily-shared",     label:"Daily Pass", sublabel:"Shared Table",          price:1500,  orig:3500,   unit:"/day" },
  { id:"custom",           label:"Custom Date Pass", sublabel:"Shared Table - pick your days", price:1500, unit:"/day", custom:true },
];

const N = (n: number) => "N" + n.toLocaleString("en-NG");

function Calendar({ sel, onToggle }: { sel: Set<string>; onToggle: (k: string) => void }) {
  const now = new Date();
  const [yr, setYr] = useState(now.getFullYear());
  const [mo, setMo] = useState(now.getMonth());
  const first = new Date(yr, mo, 1).getDay();
  const days  = new Date(yr, mo + 1, 0).getDate();
  const name  = new Date(yr, mo).toLocaleString("default", { month: "long" });

  const key = (d: number) => yr + "-" + String(mo+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
  const past = (d: number) => new Date(yr,mo,d) < new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const prev = () => mo===0 ? (setMo(11), setYr(y=>y-1)) : setMo(m=>m-1);
  const next = () => mo===11? (setMo(0),  setYr(y=>y+1)) : setMo(m=>m+1);

  const cells: (number|null)[] = Array(first).fill(null);
  for (let d=1;d<=days;d++) cells.push(d);
  while (cells.length%7!==0) cells.push(null);

  return (
    <div className="mt-5 select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition" aria-label="Prev">
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <span className="font-display font-semibold text-sm text-ink">{name} {yr}</span>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition" aria-label="Next">
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} className="text-center text-[11px] font-medium text-neutral-400 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d,i) => {
          if (!d) return <div key={i}/>;
          const k=key(d), p=past(d), s=sel.has(k);
          return (
            <button key={k} onClick={()=>!p&&onToggle(k)} disabled={p}
              className={["h-9 w-full rounded-lg text-[13px] font-medium transition-all",
                p?"text-neutral-300 cursor-not-allowed":"cursor-pointer",
                s?"bg-[#f1552b] text-white shadow-sm":p?"":"hover:bg-[#fce9e2] text-ink"].join(" ")}>
              {d}
            </button>
          );
        })}
      </div>
      {sel.size>0&&<p className="mt-3 text-xs text-neutral-500"><span className="font-semibold text-[#f1552b]">{sel.size}</span> {sel.size===1?"day":"days"} &middot; {N(sel.size*1500)}</p>}
    </div>
  );
}

export default function BookPage() {
  const [picked, setPicked] = useState<PackageId|null>(null);
  const [dates,  setDates]  = useState<Set<string>>(new Set());
  const pkg   = PKGS.find(p=>p.id===picked);
  const total = useMemo(()=>!pkg?0:pkg.custom?dates.size*1500:pkg.price,[pkg,dates]);

  const toggle = (k:string) => setDates(prev=>{ const n=new Set(prev); n.has(k)?n.delete(k):n.add(k); return n; });

  return (
    <main className="min-h-screen font-body" style={{backgroundColor:"#faf9f7"}}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-10">
        <p className="text-[10px] font-mono tracking-[0.08em] uppercase mb-3" style={{color:"#f1552b"}}>Confirm your booking</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight max-w-lg">Choose your space package.</h1>
        <p className="mt-3 text-sm text-neutral-500 max-w-md leading-relaxed">Select a plan, pick your dates if needed, then pay securely. All packages include backup power, fast fiber, and quiet rooms.</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-24 grid lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* Package list */}
        <div className="space-y-3">
          {PKGS.map(p=>{
            const on=picked===p.id;
            return (
              <button key={p.id}
                onClick={()=>{setPicked(on?null:p.id); if(!p.custom) setDates(new Set());}}
                className={["w-full text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer",
                  on?"border-[#f1552b] bg-white shadow-md":"border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"].join(" ")}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={["mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",on?"border-[#f1552b]":"border-neutral-300"].join(" ")}>
                      {on&&<span className="w-2 h-2 rounded-full bg-[#f1552b]"/>}
                    </span>
                    <div>
                      <p className="font-display font-semibold text-[15px] text-ink">{p.label}</p>
                      {p.sublabel&&<p className="text-xs text-neutral-400 mt-0.5">{p.sublabel}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-[18px] text-ink">{p.custom?"N1,500":N(p.price)}</p>
                    {p.orig&&<p className="text-xs text-neutral-400 line-through">{N(p.orig)}</p>}
                    <p className="text-[10px] text-neutral-400 font-mono">{p.custom?"/day - pick dates":p.unit}</p>
                  </div>
                </div>
                {on&&p.custom&&(
                  <div className="mt-4 pt-4 border-t border-neutral-100" onClick={e=>e.stopPropagation()}>
                    <Calendar sel={dates} onToggle={toggle}/>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sticky sidebar */}
        <div className="lg:sticky lg:top-8 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-5">Order summary</p>
            {pkg?(
              <div className="space-y-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-sm text-ink">{pkg.label}</p>
                    {pkg.sublabel&&<p className="text-xs text-neutral-400 mt-0.5">{pkg.sublabel}</p>}
                    {pkg.custom&&dates.size>0&&<p className="text-xs text-[#f1552b] mt-1">{dates.size} {dates.size===1?"day":"days"} selected</p>}
                    {pkg.custom&&dates.size===0&&<p className="text-xs text-neutral-400 mt-1">No dates selected</p>}
                  </div>
                  <p className="font-display font-semibold text-sm text-ink whitespace-nowrap">
                    {pkg.custom?dates.size+" x N1,500":N(pkg.price)}
                  </p>
                </div>
                <hr className="border-neutral-100"/>
                <div className="space-y-2">
                  {["100% backup power","Fast fiber internet","Quiet call rooms","Premium access"].map(i=>(
                    <div key={i} className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill="#f1552b" fillOpacity="0.12"/>
                        <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#f1552b" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs text-neutral-500">{i}</span>
                    </div>
                  ))}
                </div>
                <hr className="border-neutral-100"/>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Total</p>
                  <p className="font-display font-bold text-2xl text-ink">{N(total)}</p>
                  {pkg.orig&&!pkg.custom&&<p className="text-xs text-[#f1552b] mt-1">You save {N(pkg.orig-pkg.price)}</p>}
                </div>
                <button disabled={!!pkg.custom&&dates.size===0}
                  className={["w-full py-3.5 rounded-full font-display font-semibold text-sm transition-all",
                    pkg.custom&&dates.size===0?"bg-neutral-200 text-neutral-400 cursor-not-allowed":"bg-[#1a1a1a] text-white hover:bg-neutral-800 shadow-sm"].join(" ")}>
                  {pkg.custom&&dates.size===0?"Select dates to continue":"Pay Now"}
                </button>
                <p className="text-center text-[11px] text-neutral-400">Secure checkout &middot; No hidden fees</p>
              </div>
            ):(
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{background:"rgba(241,85,43,0.10)"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#f1552b" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="font-display font-semibold text-sm text-ink">No package selected</p>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed max-w-[160px] mx-auto">Pick a plan on the left to see your total.</p>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-400 text-center">Need help? <a href="/contact" className="text-[#f1552b] hover:underline no-underline">Talk to us</a></p>
        </div>
      </div>
    </main>
  );
}