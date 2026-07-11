"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Users, Image as ImageIcon, Calendar, Swords, Trophy } from 'lucide-react';
import { useLogoClicks } from '@/hooks/useSecretAccess';
import AdminLoginModal from '../admin/AdminLoginModal';

const defaultNavItems = [
  { title: 'Home', href: '/', icon: Shield },
  { title: 'About', href: '/about', icon: Shield },
  { title: 'Members', href: '/members', icon: Users },
  { title: 'Gallery', href: '/gallery', icon: ImageIcon },
  { title: 'Events', href: '/events', icon: Calendar },
  { title: 'War Reports', href: '/war-reports', icon: Swords },
  { title: 'Leaderboards', href: '/leaderboards', icon: Trophy },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const pathname = usePathname();

  const { incrementClicks } = useLogoClicks(7, 3000, () => {
    setIsAdminModalOpen(true);
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-panel py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={incrementClicks}
          >
            <div className="w-10 h-10 rounded bg-black border border-neon-green/50 flex items-center justify-center group-hover:glow-box transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-neon-green/10 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              <span className="font-cyber font-bold text-neon-green text-xl relative z-10">HOS</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-cyber font-bold text-white tracking-widest text-sm uppercase">House of</span>
              <span className="font-cyber font-bold text-neon-green tracking-widest text-lg leading-none uppercase glow-text">Spanking</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {defaultNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 group relative overflow-hidden ${
                    isActive ? 'text-neon-green' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-neon-green/10 border-b-2 border-neon-green rounded-md"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon size={16} className={`relative z-10 ${isActive ? 'text-neon-green' : 'text-gray-500 group-hover:text-neon-green'} transition-colors duration-300`} />
                  <span className="relative z-10 uppercase tracking-wider">{item.title}</span>
                </Link>
              );
            })}

            <Link
              href="/chat"
              className="ml-4 px-6 py-2 rounded border border-neon-green text-neon-green font-bold text-sm uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all duration-300 glow-box relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out]"></div>
              Alliance Chat
            </Link>
          </nav>

          <button
            className="md:hidden text-white p-2 hover:text-neon-green transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 pt-24 bg-black/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col items-center gap-4 p-6">
              {defaultNavItems.map((item, i) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-lg w-full text-lg uppercase tracking-wider ${
                        isActive
                          ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon size={24} className={isActive ? 'text-neon-green' : 'text-gray-500'} />
                      {item.title}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: defaultNavItems.length * 0.05 }}
                className="w-full mt-4"
              >
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center p-4 rounded bg-neon-green text-black font-bold uppercase tracking-widest text-lg"
                >
                  Enter Alliance Chat
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </>
  );
}
