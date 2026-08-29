"use client";

export default function CTASection() {
  return (
    <section className="bg-white px-6 md:px-10 font-body">
      <div className="max-w-6xl mx-auto pb-10">
        <div className="relative bg-ink rounded-3xl px-8 py-16 md:py-20 text-center overflow-hidden">
          {/* Radial decorative circles */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30"
            viewBox="0 0 800 300"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g stroke="white" strokeWidth="1">
              <circle cx="400" cy="150" r="80" opacity="0.4" />
              <circle cx="400" cy="150" r="130" opacity="0.3" />
              <circle cx="400" cy="150" r="180" opacity="0.2" />
            </g>
          </svg>

          <div className="relative z-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
              Let's start upgrading your workday
            </h2>
            <p className="text-neutral-400 text-sm mb-8 font-body">
              Want to see how to transform your routine into deep focus?
              <br />
              Schedule a visit or send us a message!
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-ink text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-200 transition no-underline"
            >
              Book a Tour
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 19L19 5M9 5h10v10" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
