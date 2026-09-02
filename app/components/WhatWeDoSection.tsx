"use client";

const N = (n: number) => "N" + n.toLocaleString("en-NG");

const PLANS = [
  {
    id: "daily-shared",
    badge: "Most Flexible",
    badgeColor: "#5C7A73",
    title: "Shared Table",
    subtitle: "Daily Pass",
    price: 1500,
    orig: 3500,
    unit: "/day",
    highlight: false,
    perks: [
      "Open lounge seating",
      "100% backup power",
      "Fast fiber internet",
      "Quiet call rooms",
    ],
    cta: "Book a Day",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        <path d="M12 12v4M10 14h4" />
      </svg>
    ),
  },
  {
    id: "daily-dedicated",
    badge: "Best Value",
    badgeColor: "#f1552b",
    title: "Dedicated Desk",
    subtitle: "Daily Pass",
    price: 2000,
    orig: 4000,
    unit: "/day",
    highlight: true,
    perks: [
      "Your own personal desk",
      "Ergonomic chair included",
      "Lockable under-desk drawer",
      "100% backup power",
      "Fast fiber internet",
    ],
    cta: "Book a Desk",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: "weekend",
    badge: "Weekend Special",
    badgeColor: "#7C6EAA",
    title: "Weekend Package",
    subtitle: "Sat & Sun access",
    price: 12000,
    orig: undefined as number | undefined,
    unit: "/weekend",
    highlight: false,
    perks: [
      "Full weekend access",
      "Shared table seating",
      "100% backup power",
      "Fast fiber internet",
      "Quiet call rooms",
    ],
    cta: "Book Weekend",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: "monthly-standard",
    badge: "Monthly",
    badgeColor: "#2C7BB6",
    title: "Monthly Standard",
    subtitle: "The Helm Monthly Package",
    price: 70000,
    orig: 75000 as number | undefined,
    unit: "/month",
    highlight: false,
    perks: [
      "Unlimited weekday access",
      "Dedicated desk assignment",
      "100% backup power",
      "Fast fiber internet",
      "Quiet call rooms",
      "Premium lounge access",
    ],
    cta: "Book Monthly",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: "monthly-premium",
    badge: "Premium",
    badgeColor: "#141414",
    title: "Monthly Premium",
    subtitle: "The Helm Monthly Package",
    price: 80000,
    orig: 85000 as number | undefined,
    unit: "/month",
    highlight: false,
    perks: [
      "Everything in Standard",
      "Priority desk selection",
      "Private locker storage",
      "Guest passes (2/month)",
      "Meeting room credits",
      "Premium coffee & tea",
    ],
    cta: "Book Premium",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
      </svg>
    ),
  },
  {
    id: "meeting-room",
    badge: "Per Session",
    badgeColor: "#B45309",
    title: "Meeting Room",
    subtitle: "9-seat boardroom",
    price: 15000,
    orig: 25000 as number | undefined,
    unit: "/session",
    highlight: false,
    perks: [
      "9-seat professional boardroom",
      "HD presentation screen",
      "Dry-erase whiteboard",
      "Acoustic walls for privacy",
      "Complimentary water",
    ],
    cta: "Book a Room",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 4h16v16H4z" />
        <path d="M4 4l16 16M20 4L4 20" />
      </svg>
    ),
  },
  {
    id: "team-desks",
    badge: "For Teams",
    badgeColor: "#166534",
    title: "Team Desks",
    subtitle: "Shared Desk — team of 4",
    price: 11000,
    orig: 12500 as number | undefined,
    unit: "/month",
    highlight: false,
    perks: [
      "4 shared desks together",
      "Monthly flexible access",
      "100% backup power",
      "Fast fiber internet",
      "Quiet call rooms",
      "Team lounge area",
    ],
    cta: "Book for Team",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="7" r="3" />
        <path d="M3 21v-1a6 6 0 0 1 6-6h0" />
        <path d="M11 21v-1a6 6 0 0 1 6-6h0" />
      </svg>
    ),
  },
  {
    id: "hall",
    badge: "Events",
    badgeColor: "#9D174D",
    title: "The Helm Hall",
    subtitle: "Full venue for rent",
    price: 80000,
    orig: 100000 as number | undefined,
    unit: "/day",
    highlight: false,
    perks: [
      "Full hall venue access",
      "Professional audio setup",
      "Flexible layout options",
      "Corporate workshops",
      "Networking events",
      "Seminars & launches",
    ],
    cta: "Enquire Now",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
];

export default function WhatWeDoSection() {
  return (
    <section id="pricing" className="bg-ink text-white font-body overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-6">
        {/* Header */}
        <div className="grid md:grid-cols-2 gap-6 items-end mb-12">
          <div>
            <span className="inline-block text-xs font-medium border border-neutral-600 rounded-full px-4 py-1.5 mb-6 text-neutral-300">
              Pricing
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Transparent pricing for every kind of worker
            </h2>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm md:text-right">
              From a single drop-in day to a full team setup — pick the plan that fits your rhythm. All packages include backup power, fiber internet, and quiet rooms.
            </p>
            <a
              href="/book"
              className="inline-flex items-center gap-2 self-start md:self-end bg-[#f1552b] text-white text-xs font-semibold px-5 py-2.5 rounded-full no-underline hover:bg-[#d94820] transition-colors"
            >
              See all packages
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div
        className="relative pb-20 md:pb-28"
        style={{ WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)" }}
      >
        <div
          className="flex gap-4 overflow-x-auto px-6 md:px-10 pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={[
                "relative flex-shrink-0 w-[280px] snap-start rounded-2xl p-6 flex flex-col transition-all duration-300",
                plan.highlight
                  ? "bg-[#f1552b] text-white shadow-[0_20px_60px_-15px_rgba(241,85,43,0.55)]"
                  : "bg-neutral-900 border border-neutral-800 hover:border-neutral-700",
              ].join(" ")}
            >
              {/* Badge + Icon row */}
              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-[10px] font-mono font-semibold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full"
                  style={{
                    background: plan.highlight ? "rgba(255,255,255,0.2)" : `${plan.badgeColor}22`,
                    color: plan.highlight ? "white" : plan.badgeColor,
                  }}
                >
                  {plan.badge}
                </span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: plan.highlight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: plan.highlight ? "white" : "#aaa",
                  }}
                >
                  {plan.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-lg leading-tight mb-0.5 text-white">
                {plan.title}
              </h3>
              <p className={["text-xs mb-5", plan.highlight ? "text-white/70" : "text-neutral-500"].join(" ")}>
                {plan.subtitle}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-3xl tracking-tight text-white">
                    {N(plan.price)}
                  </span>
                  <span className={["text-xs font-mono", plan.highlight ? "text-white/60" : "text-neutral-500"].join(" ")}>
                    {plan.unit}
                  </span>
                </div>
                {plan.orig && (
                  <p className={["text-xs mt-1 line-through", plan.highlight ? "text-white/50" : "text-neutral-600"].join(" ")}>
                    {N(plan.orig)} regular price
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className={["w-full h-px mb-5", plan.highlight ? "bg-white/20" : "bg-neutral-800"].join(" ")} />

              {/* Perks */}
              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="7" fill={plan.highlight ? "rgba(255,255,255,0.2)" : "rgba(241,85,43,0.12)"} />
                      <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke={plan.highlight ? "white" : "#f1552b"} strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <span className={["text-[12px] leading-snug", plan.highlight ? "text-white/80" : "text-neutral-400"].join(" ")}>
                      {perk}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="/book"
                className={[
                  "w-full py-3 rounded-full text-[12px] font-semibold text-center no-underline transition-all duration-200",
                  plan.highlight
                    ? "bg-white text-[#f1552b] hover:bg-neutral-100"
                    : "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700",
                ].join(" ")}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="flex items-center justify-center mt-4 px-6 md:px-10">
          <p className="text-neutral-600 text-[11px] font-mono tracking-wide">
            ← scroll to explore all plans →
          </p>
        </div>
      </div>
    </section>
  );
}
