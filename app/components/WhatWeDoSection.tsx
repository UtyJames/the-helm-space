"use client";

const SERVICES = [
  {
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M15 3v18" />
      </svg>
    ),
    title: "Private Offices",
    desc: "Fully furnished, lockable office suites for growing teams of 2 to 20. Backed up by silent power and redundant fiber internet.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Dedicated Desks",
    desc: "Your own personal desk in a quiet shared room, complete with an ergonomic chair and secure under-desk lockable drawer storage.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Hot Desks",
    desc: "Flexible, day-pass access to any open workspace in our common lounge. Perfect for freelancers, nomads, and drop-in business travelers.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 4h16v16H4z" />
        <path d="M4 4l16 16M20 4L4 20" />
      </svg>
    ),
    title: "Meeting Rooms",
    desc: "Professional boardrooms and team rooms equipped with high-definition presentation screens, dry-erase whiteboards, and quiet acoustic walls.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
    title: "Event Spaces",
    desc: "Versatile layouts tailored for corporate workshops, networking mixers, launch events, or seminars, complete with professional audio setup.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M8 4l-6 8 6 8M16 4l6 8-6 8" />
      </svg>
    ),
    title: "Virtual Office",
    desc: "Secure a prestigious commercial mailing address, lock in secure mail forwarding, and establish a premium professional local presence.",
  },
];

export default function WhatWeDoSection() {
  return (
    <section className="bg-ink text-white font-body">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        {/* Header grid */}
        <div className="grid md:grid-cols-2 gap-6 items-start mb-12">
          <div>
            <span className="inline-block text-xs font-medium border border-neutral-600 rounded-full px-4 py-1.5 mb-6 text-neutral-300">
              What we do
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              We design meaningful workspaces, not just quick impressions
            </h2>
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed md:pt-16 max-w-md">
            The Helm Space workspace options are designed to provide absolute focus, quiet collaboration, and premium business support. No distractions, just results.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((srv, idx) => (
            <div
              key={idx}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-all duration-300 hover:border-neutral-700"
            >
              {/* Icon Container */}
              <div className="w-9 h-9 rounded-md border border-neutral-700 flex items-center justify-center mb-6 bg-neutral-800">
                {srv.icon}
              </div>
              <h3 className="font-display font-semibold text-base mb-2 text-white">
                {srv.title}
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {srv.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
