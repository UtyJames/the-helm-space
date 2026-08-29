"use client";

const ITEMS = [
  {
    image: "/hero_img.jpg.webp",
    category: "Meeting Space",
    title: "The Boardroom — Premium Meeting Room",
  },
  {
    image: "/hero_img2.webp",
    category: "Coworking Lounge",
    title: "Deep Focus Desk Suite — Quiet & Productive",
  },
  {
    image: "/hero_img3.webp",
    category: "Private Office",
    title: "Team Office Suite — Scalable Workspace",
  },
];

export default function PortfolioSection() {
  return (
    <section className="bg-white font-body">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        {/* Header flex */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <p className="text-neutral-500 text-sm leading-relaxed max-w-[220px] order-2 md:order-1 font-body">
            Take a look inside the spaces designed specifically for your professional focus and teamwork.
          </p>
          <div className="order-1 md:order-2 md:text-right">
            <span className="inline-block text-xs font-medium border border-neutral-300 rounded-full px-4 py-1.5 mb-6 text-neutral-600 font-body">
              Workspaces
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight text-ink">
              Explore our most successful spaces
            </h2>
          </div>
        </div>

        {/* Workspace Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ITEMS.map((item, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[4/3] bg-neutral-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 scale-100 group-hover:scale-105"
                />
                <span className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md transition-transform group-hover:-translate-y-1">
                  <svg className="w-3.5 h-3.5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-1 font-body uppercase tracking-wider font-semibold">
                {item.category}
              </p>
              <h3 className="font-display font-semibold text-lg text-ink">
                {item.title}
              </h3>
            </div>
          ))}
        </div>

        {/* Call to action button */}
        <div className="mt-10">
          <a
            href="/workspaces"
            className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-800 transition no-underline"
          >
            See all workspaces
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
