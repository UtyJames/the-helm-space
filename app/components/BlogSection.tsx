"use client";

const POSTS = [
  {
    image: "/hero_img.jpg.webp",
    category: "Productivity",
    title: "5 Habits of Highly Effective Remote Workers",
    date: "Aug 24, 2026",
    readTime: "4 min read",
  },
  {
    image: "/hero_img2.webp",
    category: "Workplace",
    title: "Why Quiet Rooms are essential for Modern Teams",
    date: "Aug 18, 2026",
    readTime: "6 min read",
  },
  {
    image: "/hero_img3.webp",
    category: "Community",
    title: "How Networking in a Coworking Space Boosts Growth",
    date: "Aug 10, 2026",
    readTime: "5 min read",
  },
];

export default function BlogSection() {
  return (
    <section className="bg-white font-body border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        {/* Header flex */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <p className="text-neutral-500 text-sm leading-relaxed max-w-[240px] order-2 md:order-1 font-body">
            Insights, guides, and stories on remote work, productivity, and modern office culture.
          </p>
          <div className="order-1 md:order-2 md:text-right">
            <span className="inline-block text-xs font-medium border border-neutral-300 rounded-full px-4 py-1.5 mb-6 text-neutral-600 font-body">
              Articles & Guides
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight text-ink">
              Latest from our blog
            </h2>
          </div>
        </div>

        {/* Blog Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map((post, idx) => (
            <a key={idx} href="/blog" className="group cursor-pointer no-underline block">
              <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[4/3] bg-neutral-100">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 scale-100 group-hover:scale-105"
                />
                <span className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">
                  <svg className="w-3.5 h-3.5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1 font-body">
                <span className="uppercase tracking-wider font-semibold text-[#f1552b]">
                  {post.category}
                </span>
                <span>&bull;</span>
                <span>{post.readTime}</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-ink group-hover:text-[#f1552b] transition-colors leading-snug">
                {post.title}
              </h3>
            </a>
          ))}
        </div>

        {/* Call to action button */}
        <div className="mt-10">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-800 transition no-underline"
          >
            Read all articles
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
