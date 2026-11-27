import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Navbar = ({ onCtaClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Get to Know Us", href: "#about" },
    { label: "Technology", href: "#technology" },
    { label: "Software solutions/Products", href: "#products" },
    { label: "Problems & Solutions", href: "#solutions" },
    { label: "Contact Us", href: "#faqs" },
  ];

  const handleNavClick = (e, href) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-[#050505]/85 backdrop-blur-md border-b border-[#3B0A6B]/25 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center space-x-3">
          <a
            href="/"
            className="group flex items-center text-white/90 hover:text-white transition-colors"
          >
            <div className="relative h-8 sm:h-9 w-[110px] sm:w-[130px] flex items-center flex-shrink-0">
              <img
                src="/logo.png"
                alt="Alpha Paradox QC"
                className="h-8 sm:h-9 object-contain object-left mix-blend-screen filter brightness-110"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/alpha-logo.png";
                }}
              />
            </div>
          </a>
        </div>

        {/* Center: Minimalist Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-xs lg:text-[13px] tracking-wider text-white/70 hover:text-white transition-all duration-200 relative group py-1 cursor-pointer"
            >
              <span>{link.label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-royal-amethyst via-[#7B1FA2] to-electric-cyan transition-all duration-300 group-hover:w-full opacity-90" />
            </a>
          ))}
        </nav>

        {/* Right: Launch Platform Direct CTA */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            to="/composer"
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#3B0A6B] via-[#7B1FA2] to-[#00E5FF] text-white text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:shadow-[0_0_25px_rgba(0,229,255,0.45)] transition-all hover:scale-[1.02]"
          >
            Launch Platform
          </Link>
          <Link
            to="/auth"
            className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/80 hover:text-white hover:border-white/30 text-xs tracking-wider transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <Link
            to="/composer"
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#3B0A6B] to-[#00E5FF] text-white text-[10px] font-semibold uppercase tracking-wider"
          >
            Launch
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-electric-cyan/40 rounded-lg"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#050505]/95 backdrop-blur-xl border-b border-[#3B0A6B]/30 px-6 py-5 transition-all">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-normal text-white/75 hover:text-white tracking-wide py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col space-y-2">
              <Link
                to="/composer"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-full bg-gradient-to-r from-royal-amethyst via-[#7B1FA2] to-electric-cyan text-white text-xs font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.25)]"
              >
                LAUNCH QUANTUM COMPOSER
              </Link>
              <Link
                to="/labs"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center py-2 px-4 rounded-full bg-white/[0.05] border border-white/15 text-white/80 text-xs tracking-wider"
              >
                EXPLORE DOMAIN LABS
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
