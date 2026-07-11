"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "HQ", href: "/" },
    { name: "Network", href: "/#links" },
    { name: "Intel", href: "/#stats" },
    { name: "Archives", href: "/#gallery" },
    { name: "Admin", href: "/admin" },
  ];

  return (
    <>
      <header
        className={clsx(
          "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
          scrolled
            ? "bg-void-black/80 backdrop-blur-xl border-imperial-gold/20 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent py-6"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <Shield className="w-8 h-8 text-imperial-gold group-hover:text-imperial-gold-light transition-colors" />
            <span className="font-cinzel font-bold text-xl tracking-wider text-white hidden sm:block">
              HOS <span className="text-blood-crimson-light">1895</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-ash-grey hover:text-imperial-gold font-rajdhani uppercase tracking-widest text-sm font-semibold transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blood-crimson transition-all group-hover:w-full" />
              </Link>
            ))}
            <button className="px-6 py-2 border border-imperial-gold/50 text-imperial-gold font-cinzel text-sm uppercase tracking-wider hover:bg-blood-crimson hover:border-blood-crimson hover:text-white transition-all duration-300">
              Join Now
            </button>
          </nav>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-void-black/95 backdrop-blur-md flex flex-col"
          >
            <div className="flex justify-end p-6">
              <button
                className="text-white hover:text-imperial-gold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              {navLinks.map((link, i) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="text-2xl font-cinzel text-ash-grey hover:text-imperial-gold uppercase tracking-widest transition-colors block"
                  >
                    {link.name}
                  </motion.span>
                </Link>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 px-8 py-3 border border-imperial-gold text-imperial-gold font-cinzel text-lg uppercase tracking-wider hover:bg-blood-crimson hover:border-blood-crimson hover:text-white transition-all duration-300"
              >
                Join Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
