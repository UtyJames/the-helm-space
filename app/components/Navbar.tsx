"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  {
    label: "Workspaces",
    children: [
      { href: "/workspaces/coworking", label: "Coworking" },
      { href: "/workspaces/private-offices", label: "Private Offices" },
      { href: "/workspaces/event-spaces", label: "Event Spaces" },
      { href: "/workspaces/virtual", label: "Virtual Office" },
    ],
  },
  { href: "/store", label: "Store" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspacesOpen, setWorkspacesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className="w-full z-50 bg-white">
      {/* ── Announcement Bar (Full width) ────────────────────── */}
      {announcementVisible && (
        <div className="relative flex min-h-[40px] w-full items-center justify-center bg-ink px-6 py-2.5 text-center">
          <p className="font-body text-xs font-medium text-white/90 flex items-center justify-center gap-2">
            <span style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif" }} aria-hidden="true">
              🎉
            </span>
            <span>Get 10% off your first meeting room booking this month.</span>
          </p>
          <button
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Close announcement"
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent p-1 text-[11px] leading-none text-white/60 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main Navbar ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-4 flex items-center justify-between relative">
        {/* Logo */}
        <a href="/" aria-label="Go to homepage" className="flex items-center">
          <img src="/THS-LOGO.svg" alt="The Helm Space logo" className="block h-8 w-auto md:h-10" />
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
          {NAV_LINKS.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setWorkspacesOpen(true)}
                onMouseLeave={() => setWorkspacesOpen(false)}
                ref={dropdownRef}
              >
                <button
                  aria-haspopup="true"
                  aria-expanded={workspacesOpen}
                  className="inline-flex cursor-pointer items-center gap-1 py-2 text-neutral-600 hover:text-ink transition-colors"
                >
                  {item.label}
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden="true"
                    className={`flex-shrink-0 transition-transform duration-200 ${workspacesOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {workspacesOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full z-20 min-w-[180px] animate-[dropdownIn_0.15s_ease_forwards] rounded-xl border border-neutral-200 bg-white p-2.5 shadow-lg"
                  >
                    {item.children.map(({ href, label }) => (
                      <a
                        key={href}
                        href={href}
                        role="menuitem"
                        className="block rounded-md px-3 py-2 text-sm text-neutral-600 no-underline transition-colors hover:bg-neutral-50 hover:text-ink"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="py-2 text-neutral-600 hover:text-ink transition-colors no-underline"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Right actions (Let's Talk styled button & Hamburger) */}
        <div className="flex items-center gap-4">
          <a
            href="/book"
            className="hidden md:inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-800 transition no-underline"
          >
            Book Now
          </a>

          {/* Mobile hamburger */}
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="flex cursor-pointer items-center justify-center border-none bg-transparent p-1.5 text-ink md:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-neutral-200 bg-white shadow-lg md:hidden">
          <ul className="flex list-none flex-col gap-1 p-5 m-0">
            {NAV_LINKS.map((item) =>
              item.children ? (
                <li key={item.label}>
                  <button
                    onClick={() => setWorkspacesOpen((o) => !o)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md border-none bg-transparent px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                  >
                    {item.label}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden="true"
                      className={`flex-shrink-0 transition-transform duration-200 ${workspacesOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {workspacesOpen && (
                    <ul className="flex list-none flex-col gap-0.5 pl-3 m-0">
                      {item.children.map(({ href, label }) => (
                        <li key={href}>
                          <a
                            href={href}
                            className="block rounded-md px-3 py-2 text-sm text-neutral-600 no-underline transition-colors hover:bg-neutral-50"
                          >
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-50"
                  >
                    {item.label}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
