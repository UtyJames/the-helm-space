"use client";

const PERKS = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    tag: "Community",
    title: "You're never working alone",
    desc: "Join a growing tribe of founders, freelancers, and remote teams who share ideas, refer clients, and hold each other accountable. Show up, and the energy does the rest.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
      </svg>
    ),
    tag: "Accountability",
    title: "A place that makes you show up",
    desc: "Working from home? The couch wins every time. At The Helm, a fixed desk and a familiar face creates the rhythm that keeps your goals on track — day after day.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    tag: "Infrastructure",
    title: "Zero power cuts. Ever.",
    desc: "Industrial-grade backup generators and silent UPS systems mean your laptop, your deadline, and your sanity are all fully protected — even when the grid goes down.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <circle cx="12" cy="20" r="1" fill="currentColor" />
      </svg>
    ),
    tag: "Connectivity",
    title: "Fiber so fast it feels unfair",
    desc: "Dual-redundant fiber internet with dedicated bandwidth per floor. No throttling, no dropped calls, no buffering. Upload your deck, join your Zoom, and move.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    tag: "Focus Rooms",
    title: "Quiet isn't a luxury here",
    desc: "Acoustic-lined call rooms and focus booths mean you can take a client call, run a team standup, or go deep on a brief — without background noise sabotaging you.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    tag: "Amenities",
    title: "The details that make the day",
    desc: "Premium drip coffee, cold brew on tap, ergonomic chairs, lockers, printing, and a kit shop stocked with the home-office gear you didn't know you needed.",
  },
];

export default function PortfolioSection() {
  return (
    <section className="bg-white font-body">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <p className="text-neutral-500 text-sm leading-relaxed max-w-[240px] order-2 md:order-1 font-body">
            Six reasons members renew their passes every single month — and bring their friends.
          </p>
          <div className="order-1 md:order-2 md:text-right">
            <span className="inline-block text-xs font-medium border border-neutral-300 rounded-full px-4 py-1.5 mb-6 text-neutral-600 font-body">
              Perks
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight text-ink">
              We aren't just any co-working space
            </h2>
          </div>
        </div>

        {/* Perks grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PERKS.map((perk, idx) => (
            <div
              key={idx}
              className="group relative bg-[#faf9f7] border border-neutral-200 rounded-2xl p-7 hover:border-neutral-300 hover:shadow-md transition-all duration-300"
            >
              {/* Tag */}
              <p className="text-[10px] font-mono font-semibold tracking-[0.08em] uppercase text-[#f1552b] mb-5">
                {perk.tag}
              </p>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white mb-5 transition-transform duration-300 group-hover:scale-105">
                {perk.icon}
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-[17px] leading-snug text-ink mb-3">
                {perk.title}
              </h3>

              {/* Description */}
              <p className="text-neutral-500 text-sm leading-relaxed">
                {perk.desc}
              </p>

              {/* Subtle hover accent line */}
              <div className="absolute bottom-0 left-7 right-7 h-[2px] bg-[#f1552b] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12">
          <a
            href="/book"
            className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-800 transition no-underline"
          >
            Experience it yourself
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}


