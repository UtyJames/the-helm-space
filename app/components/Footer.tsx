"use client";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 font-body">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <a href="/" aria-label="The Helm Space homepage" className="inline-block mb-4">
              <img src="/THS-LOGO.svg" alt="The Helm Space logo" className="h-12 md:h-14 w-auto" />
            </a>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-[220px]">
              Premium coworking spaces, private offices, and quiet meeting rooms designed for productivity and focus.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Navigate</p>
            <ul className="space-y-3 text-sm text-neutral-600 list-none p-0 m-0">
              <li><a href="/" className="hover:text-ink no-underline transition-colors">Home</a></li>
              <li><a href="/workspaces" className="hover:text-ink no-underline transition-colors">Workspaces</a></li>
              <li><a href="/store" className="hover:text-ink no-underline transition-colors">Store</a></li>
              <li><a href="/membership" className="hover:text-ink no-underline transition-colors">Membership</a></li>
              <li><a href="/about" className="hover:text-ink no-underline transition-colors">About Us</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Support</p>
            <ul className="space-y-3 text-sm text-neutral-600 list-none p-0 m-0">
              <li><a href="/faq" className="hover:text-ink no-underline transition-colors">FAQ</a></li>
              <li><a href="/articles" className="hover:text-ink no-underline transition-colors">Articles</a></li>
              <li><a href="/contact" className="hover:text-ink no-underline transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Social Media</p>
            <ul className="space-y-3 text-sm text-neutral-600 list-none p-0 m-0">
              <li><a href="#" className="hover:text-ink no-underline transition-colors">Dribbble</a></li>
              <li><a href="#" className="hover:text-ink no-underline transition-colors">Behance</a></li>
              <li><a href="#" className="hover:text-ink no-underline transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-ink no-underline transition-colors">Twitter</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 mt-14 pt-6 border-t border-neutral-200 text-xs text-neutral-400">
          <p>© 2026 The Helm Space</p>
          <p>All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
}
