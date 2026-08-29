"use client";

export default function TestimonialsSection() {
  return (
    <section className="bg-paper font-body">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <span className="inline-block text-xs font-medium border border-neutral-400/60 rounded-full px-4 py-1.5 mb-6 text-neutral-600 font-body">
              Reviews
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5 text-ink">
              Here's what our members say about The Helm
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-sm font-body">
              From freelancers to distributed engineering teams. Read how having a reliable space has helped our members do their best work.
            </p>
          </div>
          <div>
            <div className="flex items-start gap-5">
              <img
                src="https://picsum.photos/seed/creatiwise-john/120/120"
                alt="John D. profile"
                className="w-16 h-16 rounded-full object-cover grayscale flex-shrink-0"
              />
              <div>
                <svg className="w-8 h-8 text-neutral-400 mb-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 8c-2.2 0-4 1.8-4 4v6h6v-6H6c0-1.1.9-2 2-2V8zm10 0c-2.2 0-4 1.8-4 4v6h6v-6h-3c0-1.1.9-2 2-2V8z" />
                </svg>
                <p className="text-neutral-600 leading-relaxed mb-5 font-body text-sm">
                  "The Helm completely changed my workday routine. I used to spend hours dealing with power outages and unstable fiber lines at home. Here, everything is always on, silent, and incredibly fast. The community is focused, and the quiet spaces are exactly what I need for deep work."
                </p>
                <p className="font-display font-semibold text-sm text-ink">John D.</p>
                <p className="text-neutral-400 text-xs font-body">Independent Software Engineer</p>
              </div>
            </div>
            {/* Carousel dots indicator */}
            <div className="flex gap-2 mt-8 ml-[84px]">
              <span className="w-2 h-2 rounded-full bg-ink"></span>
              <span className="w-2 h-2 rounded-full bg-neutral-300"></span>
              <span className="w-2 h-2 rounded-full bg-neutral-300"></span>
              <span className="w-2 h-2 rounded-full bg-neutral-300"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
