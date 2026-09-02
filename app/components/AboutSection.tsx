"use client";

import { useEffect, useRef } from "react";

export default function AboutSection() {
  const counterRef = useRef<HTMLParagraphElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (counterRef.current) {
        const proxy = { val: 0 };
        ScrollTrigger.create({
          trigger: counterRef.current,
          start: "top 85%",
          once: true,
          onEnter() {
            gsap.to(proxy, {
              val: 150,
              duration: 2,
              ease: "power2.out",
              onUpdate() {
                if (counterRef.current) {
                  counterRef.current.textContent = `${Math.round(proxy.val)}+`;
                }
              },
            });
          },
        });
      }

      if (pillsRef.current) {
        const pills = pillsRef.current.querySelectorAll<HTMLElement>(".pill-item");

        gsap.set(pills, {
          y: -220,
          opacity: 0,
          rotate: (i) => (i % 2 === 0 ? -12 : 12),
        });

        ScrollTrigger.create({
          trigger: pillsRef.current,
          start: "top 85%",
          once: true,
          onEnter() {
            pills.forEach((pill, idx) => {
              const targetRot = parseFloat(pill.dataset.rotation || "0");
              gsap.to(pill, {
                y: 0,
                opacity: 1,
                rotate: targetRot,
                duration: 1.1,
                delay: idx * 0.08,
                ease: "bounce.out",
              });
            });
          },
        });
      }
    })();
  }, []);

  return (
    <section className="bg-card">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
        {/* Top Grid */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block text-xs font-medium border border-neutral-400/60 rounded-full px-4 py-1.5 mb-6 text-neutral-600 font-body">
              About us
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5 text-ink">
              Meet The Helm Space: Your Productivity Partners
            </h1>
            <p className="text-neutral-600 font-body leading-relaxed max-w-md text-sm">
              We're not just a workspace; we're creators, problem-solvers, and your routine's best friends. At The Helm Space, we live and breathe focus, from reliable power to seamless workspace experiences. Think of us as an extension of your routine, ready to bring your ideas to life.
            </p>
          </div>
          <div className="relative">
            {/* SVG Asterisk Doodle */}
            <svg
              className="absolute -top-6 right-16 w-10 h-10 text-ink hidden md:block"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 2v10M20 28v10M2 20h10M28 20h10M8 8l7 7M25 25l7 7M32 8l-7 7M15 25l-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <img
              src="/hero_img2.webp"
              alt="The Helm Space team and community"
              className="w-full h-64 md:h-72 object-cover rounded-2xl grayscale"
            />
          </div>
        </div>

        {/* Stats + Pills + Image row */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          {/* Dark Card */}
          <div className="relative flex-[1.3] bg-ink rounded-2xl overflow-hidden px-8 py-8 min-h-[250px] flex flex-col justify-between">
            {/* Concentric circle lines */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40"
              viewBox="0 0 600 300"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <g stroke="white" strokeWidth="1">
                <circle cx="480" cy="150" r="60" opacity="0.5" />
                <circle cx="480" cy="150" r="100" opacity="0.4" />
                <circle cx="480" cy="150" r="140" opacity="0.3" />
                <circle cx="480" cy="150" r="180" opacity="0.2" />
                <circle cx="480" cy="150" r="220" opacity="0.15" />
              </g>
            </svg>

            {/* Counter */}
            <div className="relative z-10">
              <p
                ref={counterRef}
                className="text-white font-display text-4xl md:text-5xl font-bold"
              >
                0+
              </p>
              <p className="text-neutral-300 font-body text-sm mt-1">
                active members and growing
              </p>
            </div>

            {/* Rotated Pills with GSAP Physics Bounce Drop */}
            <div ref={pillsRef} className="relative z-10 flex flex-wrap gap-2 mt-6">
              <span
                data-rotation="-3"
                className="pill-item bg-white text-ink text-xs font-body font-medium px-4 py-2 rounded-full shadow-sm"
              >
                Backup Power
              </span>
              <span
                data-rotation="2"
                className="pill-item bg-white text-ink text-xs font-body font-medium px-4 py-2 rounded-full shadow-sm"
              >
                Quiet Rooms
              </span>
              <span
                data-rotation="-2"
                className="pill-item bg-white text-ink text-xs font-body font-medium px-4 py-2 rounded-full shadow-sm"
              >
                Meeting Space
              </span>
              <br className="w-full hidden sm:block" />
              <span
                data-rotation="3"
                className="pill-item bg-white text-ink text-xs font-body font-medium px-4 py-2 rounded-full shadow-sm"
              >
                Fast Wifi
              </span>
              <span
                data-rotation="-4"
                className="pill-item bg-white text-ink text-xs font-body font-medium px-4 py-2 rounded-full shadow-sm"
              >
                Team Desks
              </span>
              <span
                data-rotation="2"
                className="pill-item bg-white text-ink text-xs font-body font-medium px-4 py-2 rounded-full shadow-sm"
              >
                The Kit Shop
              </span>
            </div>
          </div>

          {/* Grayscale secondary image */}
          <img
            src="/hero_img.jpg.webp"
            alt="Coworkers collaborating at The Helm Space"
            className="flex-1 w-full h-[250px] object-cover rounded-2xl grayscale"
          />
        </div>
      </div>
    </section>
  );
}
