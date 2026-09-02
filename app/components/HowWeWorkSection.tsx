"use client";

import { useEffect, useRef } from "react";

export default function HowWeWorkSection() {
  const sectionRef   = useRef<HTMLElement>(null);
  const pathRef      = useRef<SVGPathElement>(null);  // orange path — for emoji tracking
  const maskRectRef  = useRef<SVGRectElement>(null);  // mask rect — for dotted reveal
  const emojiRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { gsap }          = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current || !pathRef.current || !maskRectRef.current || !emojiRef.current) return;

      const path     = pathRef.current;
      const svgEl    = path.ownerSVGElement!;
      const maskRect = maskRectRef.current;
      const wrapper  = emojiRef.current;
      const length   = path.getTotalLength();

      // ── Reveal dotted path via mask rect height (preserves dot pattern) ──
      // Start fully hidden
      maskRect.setAttribute("height", "0");

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start:   "top 40%",
        end:     "bottom 80%",
        scrub:   1,
        onUpdate(self) {
          // Grow the mask rect from y=0 downward to reveal orange dots
          maskRect.setAttribute("height", String(1050 * self.progress));

          // Move emoji along path
          const pt       = path.getPointAtLength(self.progress * length);
          const svgRect  = svgEl.getBoundingClientRect();
          const vb       = svgEl.viewBox.baseVal;   // 640 × 1050
          const scaleX   = svgRect.width  / vb.width;
          const scaleY   = svgRect.height / vb.height;
          const parentEl = wrapper.parentElement as HTMLElement;
          const parentRect = parentEl.getBoundingClientRect();
          const x = svgRect.left - parentRect.left + pt.x * scaleX - 18;
          const y = svgRect.top  - parentRect.top  + pt.y * scaleY - 18;
          gsap.set(wrapper, { x, y });
        },
      });
    })();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white font-body">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        {/* Header */}
        <div className="max-w-lg mb-4">
          <span className="inline-block text-xs font-medium border border-neutral-300 rounded-full px-4 py-1.5 mb-6 text-neutral-600">
            How we work
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5 text-ink">
            Let us show you how we drive your workday to new heights
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
            Four simple steps from booking your workspace to deep focus. We handle the logistics so you can get down to business.
          </p>
        </div>

        {/* Process Cards relative wrapper — extra height so SVG tail bleeds into next section */}
        <div className="relative mt-16 mx-auto md:mx-0 md:ml-8 md:w-[640px] md:h-[1050px] h-auto">
          {/* Marquee watermark band behind cards */}
          <div className="hidden md:block absolute top-[360px] left-1/2 -translate-x-1/2 w-[1400px] -z-10 rotate-[-3deg] overflow-hidden pointer-events-none select-none">
            <div className="flex w-max marquee-track">
              <div className="flex items-center shrink-0">
                <span className="font-display marquee-outline font-bold text-[110px] leading-none whitespace-nowrap pr-8">
                  BOOK &nbsp;•&nbsp; FOCUS &nbsp;•&nbsp; WORK &nbsp;•&nbsp; REFUEL &nbsp;•&nbsp;
                </span>
                <span className="font-display marquee-outline font-bold text-[110px] leading-none whitespace-nowrap pr-8">
                  BOOK &nbsp;•&nbsp; FOCUS &nbsp;•&nbsp; WORK &nbsp;•&nbsp; REFUEL &nbsp;•&nbsp;
                </span>
              </div>
              <div className="flex items-center shrink-0" aria-hidden="true">
                <span className="font-display marquee-outline font-bold text-[110px] leading-none whitespace-nowrap pr-8">
                  BOOK &nbsp;•&nbsp; FOCUS &nbsp;•&nbsp; WORK &nbsp;•&nbsp; REFUEL &nbsp;•&nbsp;
                </span>
                <span className="font-display marquee-outline font-bold text-[110px] leading-none whitespace-nowrap pr-8">
                  BOOK &nbsp;•&nbsp; FOCUS &nbsp;•&nbsp; WORK &nbsp;•&nbsp; REFUEL &nbsp;•&nbsp;
                </span>
              </div>
            </div>
          </div>

          {/* ── SVG connector — overflow:visible so tail bleeds into next section ── */}
          <svg
            className="hidden md:block absolute inset-0 w-full h-full -z-0 overflow-visible"
            viewBox="0 0 640 1050"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {/*
                Mask rect grows from height=0 to height=1050 on scroll.
                This reveals the orange dotted path without touching strokeDasharray,
                so the dot pattern is always preserved.
              */}
              <mask id="path-reveal-mask">
                <rect
                  ref={maskRectRef}
                  x="-40"
                  y="0"
                  width="720"
                  height="0"
                  fill="white"
                />
              </mask>
            </defs>

            {/* Ghost dotted underlay — always visible, full grey path */}
            <path
              d="M490 66 C 400 105, 220 135, 140 216
                 C 200 285, 420 385, 490 486
                 C 420 525, 220 565, 140 646
                 C 190 725, 320 785, 420 850
                 C 480 900, 540 950, 470 1050"
              stroke="#d4d4d4"
              strokeWidth="1.6"
              strokeDasharray="5 6"
              fill="none"
            />

            {/*
              Orange dotted path — masked by the growing rect.
              GSAP never touches stroke properties here, so dots stay intact.
              pathRef is kept here for getPointAtLength (emoji tracking).
            */}
            <path
              ref={pathRef}
              d="M490 66 C 400 105, 220 135, 140 216
                 C 200 285, 420 385, 490 486
                 C 420 525, 220 565, 140 646
                 C 190 725, 320 785, 420 850
                 C 480 900, 540 950, 470 1050"
              stroke="#f1552b"
              strokeWidth="1.6"
              strokeDasharray="5 6"
              fill="none"
              mask="url(#path-reveal-mask)"
            />

            {/* "Ready to focus!" handwriting text at the path end */}
            <text
              x="295"
              y="1020"
              fontFamily="'Caveat', cursive"
              fontSize="30"
              fill="#141414"
              transform="rotate(-6, 295, 1020)"
              className="select-none pointer-events-none"
            >
              Ready to focus!
            </text>
          </svg>

          {/* 😊 emoji that rides along the path on scroll */}
          <div
            ref={emojiRef}
            className="hidden md:flex absolute top-0 left-0 w-9 h-9 items-center justify-center text-[22px] pointer-events-none select-none z-30 drop-shadow"
            style={{ willChange: "transform" }}
            aria-hidden="true"
          >
            😊
          </div>

          {/* Card 01 - Pick your spot */}
          <div className="relative md:absolute md:top-[40px] md:right-[10px] w-full md:w-[280px] mb-10 md:mb-0 rotate-0 md:rotate-[4deg] z-10">
            <div className="hidden md:block absolute -inset-2 translate-x-2 translate-y-2 bg-white border border-neutral-200 rounded-[22px] -z-10 shadow-[0_35px_60px_-25px_rgba(0,0,0,0.35)]"></div>
            <div className="relative bg-card border border-neutral-300/70 rounded-2xl shadow-[0_18px_35px_-15px_rgba(0,0,0,0.18)] pt-14 px-7 pb-8">
              <span className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 z-30 w-7 h-7 rounded-full bg-white ring-1 ring-neutral-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)] items-center justify-center">
                <span className="w-3 h-3 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #9a9a9a, #1c1c1c 65%)" }}></span>
              </span>
              <p className="font-display text-xs text-neutral-500 mb-3">01</p>
              <h3 className="font-display text-xl font-bold mb-2 text-ink">Pick your spot</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Choose a single desk, shared table, or private meeting room. Pay only for what you use, when you need it.
              </p>
            </div>
          </div>

          {/* Card 02 - Confirm booking */}
          <div className="relative md:absolute md:top-[190px] md:left-0 w-full md:w-[280px] mb-10 md:mb-0 rotate-0 md:rotate-[-6deg] z-20">
            <div className="hidden md:block absolute -inset-2 translate-x-2 translate-y-2 bg-white border border-neutral-200 rounded-[22px] -z-10 shadow-[0_35px_60px_-25px_rgba(0,0,0,0.35)]"></div>
            <div className="relative bg-card border border-neutral-300/70 rounded-2xl shadow-[0_18px_35px_-15px_rgba(0,0,0,0.18)] pt-14 px-7 pb-8">
              <span className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 z-30 w-7 h-7 rounded-full bg-white ring-1 ring-neutral-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)] items-center justify-center">
                <span className="w-3 h-3 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #9a9a9a, #1c1c1c 65%)" }}></span>
              </span>
              <p className="font-display text-xs text-neutral-500 mb-3">02</p>
              <h3 className="font-display text-xl font-bold mb-2 text-ink">Confirm booking</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Book same-day with no commitment needed. A confirmation email and entry code hit your inbox in seconds.
              </p>
            </div>
          </div>

          {/* Card 03 - Walk straight in */}
          <div className="relative md:absolute md:top-[460px] md:right-[10px] w-full md:w-[280px] mb-10 md:mb-0 rotate-0 md:rotate-[3deg] z-10">
            <div className="hidden md:block absolute -inset-2 translate-x-2 translate-y-2 bg-white border border-neutral-200 rounded-[22px] -z-10 shadow-[0_35px_60px_-25px_rgba(0,0,0,0.35)]"></div>
            <div className="relative bg-card border border-neutral-300/70 rounded-2xl shadow-[0_18px_35px_-15px_rgba(0,0,0,0.18)] pt-14 px-7 pb-8">
              <span className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 z-30 w-7 h-7 rounded-full bg-white ring-1 ring-neutral-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)] items-center justify-center">
                <span className="w-3 h-3 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #9a9a9a, #1c1c1c 65%)" }}></span>
              </span>
              <p className="font-display text-xs text-neutral-500 mb-3">03</p>
              <h3 className="font-display text-xl font-bold mb-2 text-ink">Walk straight in</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Your selected desk is active and waiting. Just walk in, connect to the fiber wifi, and start creating.
              </p>
            </div>
          </div>

          {/* Card 04 - Get to work */}
          <div className="relative md:absolute md:top-[620px] md:left-0 w-full md:w-[280px] mb-2 md:mb-0 rotate-0 md:rotate-[-5deg] z-20">
            <div className="hidden md:block absolute -inset-2 translate-x-2 translate-y-2 bg-white border border-neutral-200 rounded-[22px] -z-10 shadow-[0_35px_60px_-25px_rgba(0,0,0,0.35)]"></div>
            <div className="relative bg-card border border-neutral-300/70 rounded-2xl shadow-[0_18px_35px_-15px_rgba(0,0,0,0.18)] pt-14 px-7 pb-8 w-full md:w-[280px]">
              <span className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 z-30 w-7 h-7 rounded-full bg-white ring-1 ring-neutral-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)] items-center justify-center">
                <span className="w-3 h-3 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #9a9a9a, #1c1c1c 65%)" }}></span>
              </span>
              <p className="font-display text-xs text-neutral-500 mb-3">04</p>
              <h3 className="font-display text-xl font-bold mb-2 text-ink">Get to work</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Unlimited backup power, hot premium coffee, and a quiet room for calls are ready. Zero faff, maximum focus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
