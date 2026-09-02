import AboutSection        from "./components/AboutSection";
import HowWeWorkSection    from "./components/HowWeWorkSection";
import WhatWeDoSection     from "./components/WhatWeDoSection";
import PortfolioSection    from "./components/PortfolioSection";
import TestimonialsSection from "./components/TestimonialsSection";
import BlogSection         from "./components/BlogSection";
import CTASection          from "./components/CTASection";
import Footer              from "./components/Footer";

export default function Home() {
  return (
    <>
      {/* ─── Hero — aligned with max-w-7xl mx-auto px-6 md:px-10 ─── */}
      <section
        className="w-full flex items-center font-body bg-[#faf9f7]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)),
            radial-gradient(ellipse at 8% 30%,  rgba(241,85,43,0.06) 0%, transparent 52%),
            radial-gradient(ellipse at 88% 78%, rgba(241,85,43,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 55% 10%, rgba(44,44,42,0.02)  0%, transparent 48%),
            url("/mesh-texture.jpg")
          `,
          backgroundSize:   "auto, auto, auto, auto, 320px 320px",
          backgroundRepeat: "no-repeat, no-repeat, no-repeat, no-repeat, repeat",
        }}
      >
        {/* Content container — matches Navbar & Section alignment */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 w-full">

          {/* Hero text */}
          <div className="mb-10 max-w-[620px]">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-ink mb-5">
              A calmer place to get work done.
            </h1>
            <p className="text-[15px] leading-[1.65] text-neutral-600 max-w-[440px]">
              Coworking with reliable power, quiet rooms, and no interruptions.
              Book a desk, a table, or a room for your team — by the hour or the day.
            </p>
          </div>

          {/* Booking widget */}
          <div className="mb-10 relative max-w-[680px]">
            {/* Decorative three.svg at top right */}
            <img
              src="/three.svg"
              alt=""
              className="absolute -top-8 -right-8 w-24 h-auto pointer-events-none z-10"
            />
            <div className="bg-[#F5F1E8] rounded-[14px] border border-neutral-300/60 p-6">

              {/* Label */}
              <div
                className="text-[10px] font-mono tracking-[0.07em] uppercase mb-4"
                style={{ color: "#f1552b" }}
              >
                Book a Spot
              </div>

              {/* Space type grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                <div
                  className="rounded-[8px] p-3.5 text-center cursor-pointer shadow-sm"
                  style={{ background: "#141414" }}
                >
                  <div className="text-[13px] font-medium text-white mb-1 leading-tight">Single desk</div>
                  <div className="text-[11px] font-mono" style={{ color: "#f1552b" }}>&#8358;2,000/day</div>
                </div>

                <div className="bg-white border border-[#D8D2C4] rounded-[8px] p-3.5 text-center cursor-pointer hover:border-[#f1552b] transition-colors">
                  <div className="text-[13px] font-medium text-[#141414] mb-1 leading-tight">Shared table</div>
                  <div className="text-[11px] font-mono text-[#5C7A73]">&#8358;1,500/day</div>
                </div>

                <div className="bg-white border border-[#D8D2C4] rounded-[8px] p-3.5 text-center cursor-pointer hover:border-[#f1552b] transition-colors">
                  <div className="text-[13px] font-medium text-[#141414] mb-1 leading-tight">Meeting room</div>
                  <div className="text-[11px] font-mono text-[#5C7A73]">&#8358;15,000/sess</div>
                </div>

                <div className="bg-white border border-[#D8D2C4] rounded-[8px] p-3.5 text-center cursor-pointer hover:border-[#f1552b] transition-colors">
                  <div className="text-[13px] font-medium text-[#141414] mb-1 leading-tight">Team booking</div>
                  <div className="text-[11px] font-mono text-[#5C7A73]">&#8358;11,000/mo</div>
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between gap-4">
                <div className="text-[12px] text-neutral-500 font-medium">Today &middot; 9:00 AM &ndash; 1:00 PM</div>
                <a
                  href="/book"
                  className="inline-flex items-center text-[12px] font-semibold text-white px-5 py-2.5 rounded-full no-underline transition-colors hover:bg-neutral-800 whitespace-nowrap"
                  style={{ background: "#141414" }}
                >
                  Confirm booking
                </a>
              </div>

            </div>
          </div>

          {/* Feature row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[780px]">

            <div className="flex gap-3 items-start">
              <i className="ti ti-bolt mt-0.5 text-[18px]" style={{ color: "#f1552b" }} aria-hidden="true" />
              <div>
                <div className="text-[13px] text-ink mb-0.5 font-bold">No power cuts</div>
                <div className="text-[12px] text-neutral-500">Backed up, always on.</div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <i className="ti ti-volume-3 mt-0.5 text-[18px]" style={{ color: "#f1552b" }} aria-hidden="true" />
              <div>
                <div className="text-[13px] text-ink mb-0.5 font-bold">Actually quiet</div>
                <div className="text-[12px] text-neutral-500">Rooms built for focus.</div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <i className="ti ti-wifi mt-0.5 text-[18px]" style={{ color: "#f1552b" }} aria-hidden="true" />
              <div>
                <div className="text-[13px] text-ink mb-0.5 font-bold">Stable internet</div>
                <div className="text-[12px] text-neutral-500">Fast, redundant fiber.</div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <i className="ti ti-package mt-0.5 text-[18px]" style={{ color: "#f1552b" }} aria-hidden="true" />
              <div>
                <div className="text-[13px] text-ink mb-0.5 font-bold">The kit shop</div>
                <div className="text-[12px] text-neutral-500">Gear for home offices.</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Sections after the hero (aligned perfectly with pattern.html) ─── */}
      <AboutSection />
      <HowWeWorkSection />
      <WhatWeDoSection />
      <PortfolioSection />
      <TestimonialsSection />
      <BlogSection />
      <CTASection />
      <Footer />
    </>
  );
}
