"use client";

import { useEffect, useRef } from "react";

const PILLS = [
  { label: "Backup Power",    rotate: -6  },
  { label: "Quiet Rooms",     rotate:  4  },
  { label: "Meeting Space",   rotate: -3  },
  { label: "Team Desks",      rotate:  7  },
  { label: "Fast Wifi",       rotate: -5  },
  { label: "The Kit Shop",    rotate:  3  },
  { label: "Stable Internet", rotate: -8  },
  { label: "Hot Drinks",      rotate:  5  },
];

/* Tightly clustered — mirroring the overlapping pill style in the reference */
const POSITIONS: { top: string; left: string }[] = [
  { top:  "4%", left:  "3%" },
  { top: "16%", left: "38%" },
  { top: "30%", left:  "8%" },
  { top: "43%", left: "46%" },
  { top: "55%", left:  "2%" },
  { top: "66%", left: "32%" },
  { top: "77%", left: "50%" },
  { top: "88%", left: "14%" },
];

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const pillRefs   = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    (async () => {
      const { gsap }          = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      const ctx = gsap.context(() => {
        /* Counter */
        const proxy = { val: 0 };
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 70%",
          once: true,
          onEnter() {
            gsap.to(proxy, {
              val: 150,
              duration: 2.2,
              ease: "power2.out",
              onUpdate() {
                if (counterRef.current)
                  counterRef.current.textContent = String(Math.round(proxy.val));
              },
            });
          },
        });

        /* Desktop pills — fall in with bounce stagger */
        const pills = pillRefs.current.filter(Boolean) as HTMLSpanElement[];
        gsap.set(pills, { opacity: 0, y: -320 });
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 65%",
          once: true,
          onEnter() {
            gsap.to(pills, {
              opacity: 1,
              y: 0,
              stagger: 0.1,
              duration: 0.9,
              ease: "bounce.out",
            });
          },
        });
      }, sectionRef);

      return () => ctx.revert();
    })();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-20 lg:py-28 px-8 md:px-12 lg:px-20"
      style={{ background: "#1C1C1A", zIndex: 2 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-[1100px]">

        {/* Left: Big stat */}
        <div>
          <p className="text-[11px] font-mono tracking-[0.08em] uppercase mb-8" style={{ color: "#f1552b" }}>
            The Helm by the numbers
          </p>
          <div className="flex items-end">
            <span
              ref={counterRef}
              className="font-fraunces leading-[1] text-[#F5F1E8]"
              style={{ fontSize: "clamp(80px, 10vw, 130px)" }}
            >
              0
            </span>
            <span
              className="font-fraunces leading-[1.3] mb-2"
              style={{ fontSize: "clamp(48px, 6vw, 78px)", color: "#f1552b" }}
            >
              +
            </span>
          </div>
          <div className="text-[16px] text-[#9BA9BC] mt-3 mb-8">active members and growing</div>
          <div className="w-12 h-0.5 mb-6" style={{ background: "#f1552b" }} />
          <p className="text-[14px] leading-[1.8] text-[#9BA9BC] max-w-[380px]">
            From solo freelancers to full startup teams. When you need a place that
            actually works, The Helm is where people come back to.
          </p>
        </div>

        {/* Right: Pills */}
        <div>
          {/* Mobile — simple flex-wrap */}
          <div className="flex flex-wrap gap-2 lg:hidden">
            {PILLS.map((p) => (
              <span key={p.label}
                className="inline-flex items-center px-4 py-2 rounded-full text-[13px] font-medium text-[#1a1a1a]"
                style={{ background: "#F5F1E8" }}>
                {p.label}
              </span>
            ))}
          </div>

          {/* Desktop — tightly scattered cluster */}
          <div className="relative hidden lg:block" style={{ minHeight: 340 }}>
            {PILLS.map((p, i) => (
              <span
                key={p.label}
                ref={(el) => { pillRefs.current[i] = el; }}
                className="absolute inline-flex items-center px-5 py-2.5 rounded-full text-[13px] font-medium text-[#1a1a1a] whitespace-nowrap shadow-sm"
                style={{
                  background:  "#F5F1E8",
                  top:         POSITIONS[i].top,
                  left:        POSITIONS[i].left,
                  transform:   `rotate(${p.rotate}deg)`,
                  opacity:     0,   /* GSAP reveals */
                }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
